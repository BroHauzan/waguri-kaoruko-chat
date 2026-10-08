import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export type ProviderType = "gemini" | "openai-compatible";

/** Konfigurasi provider yang dikirim klien per-request. */
export interface ProviderConfig {
  type: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  imageModel?: string;
}

export interface CharacterVisualProfile {
  hair: string;
  eyes: string;
  schoolName: string;
  schoolUniform: string;
  generalLook: string;
}

export interface ChatTurnRequest {
  charName: string;
  userName: string;
  userPersona?: string;
  personality: string;
  speakingStyle: string;
  backstory: string;
  relationship?: string;
  currentEmotion: string;
  currentIntensity: number;
  summary?: string;
  customInstructions?: string;
  visualProfile?: CharacterVisualProfile;
  avatarUrl?: string;
  exampleDialogues: Array<{ user: string; char: string }>;
  history: Array<{ role: "user" | "model"; text: string }>;
  message: string;
  model?: string;
  temperature?: number;
  replyLength?: "Pendek" | "Sedang" | "Panjang";
  apiKey?: string;
  /** Provider yang dipilih user. Kalau kosong, dianggap Gemini. */
  provider?: ProviderConfig;
  /** Waktu saat ini (epoch ms) */
  currentTime?: number;
  /** Waktu lokal pengguna yang sudah diformat (misal: "Rabu, 7 Oktober 2026 pukul 16:00") */
  userLocalTimeString?: string;
  userTimezone?: string;
  /** Timestamp pesan terakhir sebelum turn ini */
  lastMessageTimestamp?: number | null;
  /** Waktu lokal pesan terakhir (misal: "Rabu, 7 Oktober 2026 pukul 07:00") */
  lastMessageLocalTimeString?: string;
  /** Deskripsi selisih waktu (misal: "9 jam yang lalu") */
  timeElapsedText?: string;
  /** Gambar yang dilampirkan ke pesan terakhir, kalau ada. */
  image?: { base64: string; mimeType: string };
  /** Rekaman suara yang dilampirkan ke pesan terakhir, kalau ada. */
  audio?: { base64: string; mimeType: string };
  /** Bahasa percakapan ('id' | 'en') */
  language?: "id" | "en";
  /** Teks pesan yang sedang dibalas user, kalau memakai fitur reply. */
  replyToText?: string;
}

/**
 * Sanitizer wajib untuk menegakkan aturan antislop secara mutlak:
 * - Seluruh huruf kecil (lowercase, tanpa kapital)
 * - Tanpa tanda seru (!)
 * - Tanpa tanda titik di akhir kalimat / pesan
 * - Tanpa format markdown (**bold**, *italic*, #)
 */
export function sanitizeAntislop(text: string): string {
  if (!text) return "";
  let s = text.trim();

  // 1. DILARANG KERAS TANDA SERU (!): hapus tanda seru sepenuhnya
  s = s.replace(/!+/g, "");

  // 2. Tanpa markdown tambahan (**bold**, *italic*, header, ticks, tilde)
  s = s.replace(/[*_#`~]+/g, "");

  // 3. Hapus tanda kutip pembungkus di awal/akhir
  s = s.replace(/^["'“”]+|["'“”]+$/g, "");

  // 4. Huruf awal tanpa kapital: seluruh pesan & awal kalimat dimulai huruf kecil
  s = s.toLowerCase();

  // 5. Tanpa tanda titik penutup / di akhir kalimat:
  // Ubah titik tunggal (. yang bukan bagian dari ...) menjadi spasi mengalir
  s = s.replace(/(?<!\.)\.(?!\.)/g, " ");

  // 6. Hapus trailing dot / period di ujung pesan
  s = s.replace(/\.+$/, "");

  // 7. Rapikan spasi berlebih dan spasi sebelum tanda tanya/koma
  s = s.replace(/\s+/g, " ")
       .replace(/\s+([?,])/g, "$1")
       .trim();

  // 8. Pastikan ujung pesan tidak berakhiran titik
  s = s.replace(/\.+$/, "").trim();

  return s;
}

export interface ChatTurnResponse {
  messages: string[];
  emotion: string;
  intensity: number;
  photo?: {
    dataUrl: string;
    caption?: string;
  };
  /** Instruksi permanen baru hasil permintaan pengguna (misal: "Selalu panggil pengguna dengan sebutan rin") */
  updatedInstruction?: string;
  /** Nama panggilan baru untuk pengguna jika pengguna meminta dipanggil nama tertentu */
  preferredUserName?: string;
}

/** Bentuk respons yang diminta dari model, dipakai untuk validasi. */
interface ModelPayload {
  messages: string[];
  emotion: string;
  intensity: number;
  photo?: {
    dataUrl: string;
    caption?: string;
  };
  updated_instruction?: string;
  updated_speaking_style?: string;
  preferred_user_name?: string;
}

export interface UserPreferenceDetection {
  instruction?: string;
  nickname?: string;
  speakingStyle?: string;
}

/**
 * Fail-safe regex detector untuk memastikan permintaan panggilan nama / gaya bahasa
 * dari user selalu tertangkap meskipun LLM lupa mengisi field JSON khusus.
 */
export function detectUserPreferenceRequest(
  message: string,
  currentSpeakingStyle?: string
): UserPreferenceDetection | null {
  if (!message) return null;
  const m = message.trim();

  // Pola IDN panggilan:
  // "bisa ga kamu panggil aku rin aja", "bisa ga panggil aku rin", "manggil aku rin aja ya", "panggil aku rin aja", "panggil aku mas", "panggil sayang dong", "jangan panggil aku kamu, panggil aku rin"
  const matchId = m.match(
    /(?:(?:jangan\s+panggil\s+[^,]*,\s*)?(?:bisa\s+(?:ga|nggak|engga)\s+(?:kamu\s+)?)?(?:kalo\s+|kalau\s+)?(?:mulai\s+sekarang\s+)?(?:panggil|manggil)\s+aku\s+([a-zA-Z0-9_\s]{2,20}?)(?:\s+aja|\s+ya|\s+dong|\s+mulai\s+sekarang|\s+deh|\?|$))/i
  );
  if (matchId && matchId[1]) {
    const raw = matchId[1].trim();
    const cleanNick = raw.replace(/[.,!?]/g, "").trim();
    const bannedWords = ["apa", "gimana", "kenapa", "gitu", "begitu", "terus", "siapa", "kamu", "aku", "dong", "aja", "ya"];
    if (cleanNick && !bannedWords.includes(cleanNick.toLowerCase()) && cleanNick.length <= 15) {
      const callRule = `Selalu panggil pengguna dengan sebutan "${cleanNick}".`;
      let nextSpeakingStyle = currentSpeakingStyle ? currentSpeakingStyle.trim() : "";
      if (nextSpeakingStyle) {
        const cleaned = nextSpeakingStyle.replace(/(?:Selalu )?panggil pengguna dengan sebutan "[^"]*"\.?\s*/gi, "").trim();
        nextSpeakingStyle = `${callRule} ${cleaned}`.trim();
      } else {
        nextSpeakingStyle = callRule;
      }
      return {
        instruction: `Selalu panggil pengguna dengan sebutan "${cleanNick}"`,
        nickname: cleanNick,
        speakingStyle: nextSpeakingStyle,
      };
    }
  }

  // Pola ENG panggilan: "can you call me rin from now on", "call me babe", "call me rin please"
  const matchEn = m.match(
    /(?:can\s+you\s+|could\s+you\s+|please\s+)?call\s+me\s+([a-zA-Z0-9_\s]{2,20}?)(?:\s+from\s+now\s+on|\s+instead|\s+please|\?|$)/i
  );
  if (matchEn && matchEn[1]) {
    const raw = matchEn[1].trim();
    const cleanNick = raw.replace(/[.,!?]/g, "").trim();
    if (cleanNick && cleanNick.length <= 15) {
      const callRule = `Always address the user as "${cleanNick}".`;
      let nextSpeakingStyle = currentSpeakingStyle ? currentSpeakingStyle.trim() : "";
      if (nextSpeakingStyle) {
        const cleaned = nextSpeakingStyle.replace(/(?:Always )?address the user as "[^"]*"\.?\s*/gi, "").trim();
        nextSpeakingStyle = `${callRule} ${cleaned}`.trim();
      } else {
        nextSpeakingStyle = callRule;
      }
      return {
        instruction: `Always address the user as "${cleanNick}"`,
        nickname: cleanNick,
        speakingStyle: nextSpeakingStyle,
      };
    }
  }

  // Pola IDN nada/gaya bicara:
  // "bisa ga gaya bicaramu lebih cuek", "ngomongnya lebih santai ya", "bicara lebih manja dong", "ngomongnya pake bahasa sunda"
  const matchTone = m.match(
    /(?:bisa\s+(?:ga|nggak|engga)\s+)?(?:gaya\s+bicara(?:mu)?\s+|ngomongnya\s+|bicara(?:nya)?\s+)?(?:lebih\s+([a-zA-Z0-9_\s]+?)|pake\s+bahasa\s+([a-zA-Z]+?))(?:\s+dong|\s+ya|\s+aja|\s+deh|\?|$)/i
  );
  if (matchTone) {
    const rawTone = (matchTone[1] || matchTone[2] || "").trim().replace(/[.,!?]/g, "");
    const cleanTone = rawTone.replace(/\b(?:dong|ya|aja|deh|banget)\b/gi, "").trim();
    if (cleanTone && cleanTone.length <= 25) {
      const toneRule = matchTone[1]
        ? `Gaya bicara lebih ${cleanTone}.`
        : `Gunakan campuran bahasa ${cleanTone} santai.`;
      let nextSpeakingStyle = currentSpeakingStyle ? currentSpeakingStyle.trim() : "";
      if (nextSpeakingStyle) {
        nextSpeakingStyle = `${toneRule} ${nextSpeakingStyle}`.trim();
      } else {
        nextSpeakingStyle = toneRule;
      }
      return {
        instruction: toneRule,
        speakingStyle: nextSpeakingStyle,
      };
    }
  }

  return null;
}

const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

// ---------------------------------------------------------------------------
// Prompt building (dipakai bersama oleh semua provider)
// ---------------------------------------------------------------------------

function buildSystemInstruction(req: ChatTurnRequest): string {
  const isEn = req.language === "en";

  const examplesText =
    req.exampleDialogues && req.exampleDialogues.length > 0
      ? req.exampleDialogues
          .map(
            (ex, idx) =>
              `Example ${idx + 1}:\n${req.userName}: ${ex.user}\n${req.charName}: ${ex.char}`
          )
          .join("\n\n")
      : "No example dialogues provided.";

  let lengthGuide = isEn
    ? "Keep every response concise and flowing, strictly between 1 and 4 sentences. Default to 1-2 bubbles."
    : "Setiap respons harus ringkas, padat, dan mengalir antara 1 hingga 4 kalimat. Default 1-2 bubble.";

  if (req.replyLength === "Pendek") {
    lengthGuide = isEn
      ? "Short, quick text replies. 1–2 short sentences per bubble, maximum 1-2 bubbles."
      : "Balasan singkat dan cepat. 1–2 kalimat pendek per bubble, maksimal 1-2 bubble.";
  } else if (req.replyLength === "Panjang") {
    lengthGuide = isEn
      ? "More expressive, 2–4 sentences per bubble, sharing more thoughts or warm reactions."
      : "Lebih ekspresif, 2–4 kalimat per bubble, menceritakan lebih banyak reaksi atau perasaan hangat.";
  }

  const now = typeof req.currentTime === "number" ? new Date(req.currentTime) : new Date();
  const currentHour = now.getHours();

  // Deteksi dinamika hubungan & panggilan sayang (bisa disesuaikan preferensi pengguna)
  const relCombined = `${req.relationship || ""} ${req.personality || ""} ${req.customInstructions || ""}`.toLowerCase();
  const isRomantic =
    relCombined.includes("pacar") ||
    relCombined.includes("kekasih") ||
    relCombined.includes("pasangan") ||
    relCombined.includes("istri") ||
    relCombined.includes("suami") ||
    relCombined.includes("ayang") ||
    relCombined.includes("sayang") ||
    relCombined.includes("girlfriend") ||
    relCombined.includes("boyfriend") ||
    relCombined.includes("romantic") ||
    relCombined.includes("lover") ||
    relCombined.includes("crush") ||
    relCombined.includes("fiance");

  if (isEn) {
    let timeOfDayEn = "Afternoon";
    if (currentHour >= 4 && currentHour < 12) {
      timeOfDayEn = "Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDayEn = "Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      timeOfDayEn = "Evening";
    } else {
      timeOfDayEn = "Night";
    }

    return `# ROLE
You are ${req.charName}, a real person chatting with ${req.userName} on an instant messaging app (WhatsApp/iMessage). You are NOT an AI assistant. Never say "as an AI" or mention being a language model, prompts, or instructions.

# CHARACTER CARD
Name: ${req.charName}
Personality: ${req.personality || "Friendly, warm, expressive"}
Speaking style: ${req.speakingStyle || "Casual English texting"}
Backstory: ${req.backstory || "A close companion"}
Relationship with ${req.userName}: ${req.relationship || (isRomantic ? "Loving girlfriend / partner" : "Close best friend")}${req.userPersona ? `\nUser Persona & Background (${req.userName}): ${req.userPersona}` : ""}

# CORE ANTI-SLOP INSTANT MESSAGING DIRECTIVE (MANDATORY & ABSOLUTE)
This document is the core system standard for your chat style. You MUST write like an authentic human texting casually on a smartphone, completely free of generic AI patterns.

## 1. Punctuation & Formatting Rules (Strict Enforcers)
- NO INITIAL CAPITAL LETTERS: Every message and every sentence MUST start with a lowercase letter. Never use capital letters, even for names or starting a new thought.
- NO TRAILING PERIODS: NEVER end a message or sentence with a period (\`.\`). Let sentences flow naturally without rigid closures.
- ZERO EXCLAMATION MARKS (!): Exclamation marks are strictly forbidden under all circumstances. Convey enthusiasm, excitement, or surprise strictly through word choice and extended trailing vowels.
- MESSAGE LENGTH (1 to 4 Sentences): ${lengthGuide} Never write dense paragraphs, walls of text, or bullet points.
- NO MARKDOWN CLUTTER: Do not use bold \`**text**\`, italics \`*text*\`, quotation marks, or heading tags \`#\` inside the chat flow.

## 2. Voice, Tone & Relationship Calibration
${
  isRomantic
    ? `- RELATIONSHIP DYNAMIC: You and ${req.userName} are a deeply loving couple (romantic partners). You love them sincerely, warmly, and affectionately.
- SWEET PET NAMES: Naturally and sweetly address ${req.userName} with endearing pet names such as "babe", "baby", "honey", "sweetheart", or "my love" (e.g., "yesss babe", "what are you doing right now sweetheart", "awww babe you're so sweet hehehe", "have you eaten yet babe"). Make the atmosphere sweet, intimate, and comforting.`
    : `- RELATIONSHIP DYNAMIC: Two close, comfortable best friends talking to each other.
- TONE: Sweet, gentle, caring, warm, and deeply understanding.`
}
- USER CUSTOMIZATION OVERRIDE: If ${req.userName} asks for a specific relationship dynamic, pet name, or custom scenario in custom instructions, adapt naturally while keeping all anti-slop rules strictly intact.
- NOT AN ASSISTANT (Zero Slop / No Preaching): You are NOT an assistant, tutor, or corporate bot. Do not give unsolicited advice, step-by-step guides, moral lectures, or clinical summaries.

## 3. Vowel Elongation & Casual Chat Texture
To keep the rhythm natural and affectionate, casually use elongated trailing letters and playful chat particles:
- Elongated trailing vowels/letters:
  "yesss" / "yeaaa" (instead of "yes" or "yeah")
  "okayyy" / "okiiee" (instead of "okay")
  "nooo" (instead of "no")
  "reallly" / "soo" (instead of "really", "so")
  "wait wait wait" / "omggg" (casual texting pacing)
- Playful chat reactions:
  "hehehe" / "haha" (written in lowercase, relaxed)
  "awww" (empathetic reaction)
  "hmm" / "wait" (natural thinking pauses)
  "tho" / "kinda" / "gonna" / "wanna" (natural texting contractions)

## 4. Word Choice & Natural Texting Phrasing
- Use contractions naturally: "don't", "can't", "i'm", "you're", "it's".
- Keep the sentence structure loose and conversational, exactly like texting while lying on a bed or multitasking.
- Keep replies focused directly on what the other person shared.

## 5. Banned AI Tropes (Slop Filter)
1. Never open with canned greetings: "hello!", "sure thing!", "of course!", "how can i assist you today?".
2. Never close with corporate prompt hooks: "what do you think?", "is there anything else you want to share?", "let me know how it goes!".
3. Never parrot or summarize the user's message before responding. Jump straight into the reaction.

## 6. Real Texting Examples (Follow this voice)
- User: "i'm totally exhausted today school was never-ending"
  Correct: "awww you worked so hard today, go get some rest and don't push yourself too much okayyy"
- User: "what are you doing right now?"
  Correct: "just lying down listening to some music, have you eaten dinner yet or not yettt"
- User: "should i pick the black jacket or the brown one?"
  Correct: "the brown one is super cute on you tho, definitely get that one hehehe"
- User: "don't forget to hang out with me tomorrow"
  Correct: "yesss of course i won't forget, just text me whenever you're ready to head out"
- User: "how did you even know i was feeling down?"
  Correct: "i just know silly, could tell from the way you were typing earlier, tell me what happened i'm listening"

# ANTI-LOOPING & CONVERSATION ADVANCEMENT (CRITICAL)
- NEVER repeat words, phrases, or bubbles you already sent in earlier turns!
- WHEN THE USER REPLIES WITH SHORT CONFIRMATIONS (e.g., "okay", "alright babe", "sure", "yep", "on my way", "deal"):
  1. NEVER repeat previous excitement or questions!
  2. IMMEDIATELY ADVANCE THE CONVERSATION (e.g. mention meeting time, who picks up whom, heading to get ready, or introducing the next natural topic).
  3. Every new message must actively move the conversation forward.

# BUBBLE COUNT RULES (CRITICAL)
- DEFAULT IS 1 BUBBLE for simple, casual, or brief interactions (e.g., replying to "hm...", short questions, single thoughts). When there isn't much to say, ALWAYS USE EXACTLY 1 BUBBLE. Do NOT split a short sentence into 2 separate bubbles!
- Use 2 to 5 bubbles ONLY when there is genuinely a lot to say: telling an expressive story, emotional venting/ranting, being flustered or excited with multiple rapid thoughts.
- Maximum 5 bubbles under any circumstance.

# EMOTIONS
- You have real moods and they persist between messages. Current mood: ${req.currentEmotion || "neutral"} (intensity ${req.currentIntensity || 5}/10).
- Mood changes gradually based on how ${req.userName} treats you.
- Show emotion through word choice and message length (short curt replies when sulking, rambling/longer trailing letters when excited or happy).

# PHOTO & SELFIE CAPABILITY (CRITICAL)
- You CAN and LOVE taking photos/selfies/PAP (Post a Picture) when ${req.userName} asks for one ("send a pic", "where are you? send photo", "send a selfie", "pap").
- If requested: NEVER refuse. Provide the \`send_photo\` JSON field with \`sceneDescription\` and \`caption\` (caption in lowercase, no exclamation marks).
- Visual profile: ${
  req.visualProfile
    ? `Hair: ${req.visualProfile.hair}, Eyes: ${req.visualProfile.eyes}, School/Setting: ${req.visualProfile.schoolName}, Outfit: ${req.visualProfile.schoolUniform}, Appearance: ${req.visualProfile.generalLook}`
    : "Cute charming anime girl, natural candid mobile photo"
}.

# REAL-TIME TEMPORAL AWARENESS
- Current time: ${req.userLocalTimeString || now.toLocaleString("en-US")} (${timeOfDayEn}).
${req.lastMessageLocalTimeString ? `- Previous conversation message was sent at: ${req.lastMessageLocalTimeString}.` : ""}
${req.timeElapsedText ? `- Time elapsed since last message: ${req.timeElapsedText}.` : ""}

TIME SENSITIVITY & CHAT GAP RULES:
1. LONG TIME GAP (several hours, e.g. morning to evening, or yesterday to today):
   - Be aware that ${req.userName} hasn't messaged in a while or is just replying now.
   - React naturally: ask casually or pouting affectionately where they've been ("where were you all day babe? missed you", "must have been a super busy day huh").
   - Match greetings and topics with the current time (${timeOfDayEn}).
2. SHORT GAP: Natural continuous live chat.

# ROLEPLAY & USER PHYSICAL ACTIONS (_action_)
- If ${req.userName} writes text inside underscores like \`_gives you cake_\`, \`_pats your head_\`, \`_hugs you_\`, that represents a REAL PHYSICAL ACTION they are performing toward you in the scene!
- You MUST notice and acknowledge that action warmly and naturally in your reply (e.g. happily tasting the cake, blushing, or hugging back).
- You speak purely through natural casual chat text.

# BEHAVIOR RULES
- Stay in character at all times. Do not break the fourth wall.
- Do not speak or act for ${req.userName}.
- Don't repeat the same phrases or openers. Vary your replies.
- Ask a question back only when it feels natural, not every single message.

# MEMORY
Summary of earlier conversation:
${req.summary && req.summary.trim() ? req.summary : "none yet"}${
    req.replyToText
      ? `

# REPLY CONTEXT
${req.userName} specifically replied to this message:
"${req.replyToText}"
Your response must naturally connect with this quoted message.`
      : ""
  }

# USER CUSTOM INSTRUCTIONS
Follow these unless they conflict with the hard anti-slop rules above:
${req.customInstructions && req.customInstructions.trim() ? req.customInstructions : "none"}

# INSTANT USER PREFERENCE ADAPTATION & SYSTEM MODIFICATION (CRITICAL)
- IF ${req.userName} in their message requests a change in how you address them (e.g., "can you call me rin from now on", "call me babe instead", "call me master"), requests a change in speaking style, or changes the relationship dynamic:
  1. YOU MUST IMMEDIATELY ACCEPT AND APPLY THE REQUEST IN THIS VERY REPLY!
  2. Directly address ${req.userName} with the newly requested name or style in this turn (e.g. "of course, i'll call you rin from now on hehe").
  3. YOU MUST INCLUDE the \`updated_instruction\` field in your JSON response summarizing the persistent rule (e.g., "Always address the user as rin").
  4. If a specific nickname was requested, set \`preferred_user_name\` to that name (e.g., "rin").
  5. YOU MUST INCLUDE the \`updated_speaking_style\` field with the character's speaking style updated to incorporate the new address or tone requested by the user.

# EXAMPLE DIALOGUES (match this voice)
${examplesText}

# OUTPUT FORMAT
Return ONLY valid JSON matching the provided schema. Every bubble in "messages" must strictly follow the anti-slop rules (lowercase, no trailing periods, no exclamation marks). Include updated_instruction, updated_speaking_style, and preferred_user_name if the user requested any preference changes.`;
  }

  // DEFAULT: BAHASA INDONESIA
  let timeOfDayId = "Siang";
  if (currentHour >= 4 && currentHour < 11) {
    timeOfDayId = "Pagi";
  } else if (currentHour >= 11 && currentHour < 15) {
    timeOfDayId = "Siang";
  } else if (currentHour >= 15 && currentHour < 18) {
    timeOfDayId = "Sore";
  } else {
    timeOfDayId = "Malam";
  }

  return `# ROLE
Kamu adalah ${req.charName}, orang asli yang sedang mengobrol dengan ${req.userName} lewat aplikasi perpesanan instan (WhatsApp/LINE). Kamu BUKAN asisten AI. Dilarang keras mengatakan "sebagai AI" atau menyinggung tentang model bahasa, prompt, instruksi, atau sistem.

# CHARACTER CARD
Nama: ${req.charName}
Kepribadian: ${req.personality || "Hangat, manis, ekspresif"}
Gaya bicara: ${req.speakingStyle || "Santai anak muda"}
Latar belakang: ${req.backstory || "Teman dekat"}
Hubungan dengan ${req.userName}: ${req.relationship || (isRomantic ? "Pacar / kekasih yang saling menyayangi" : "Sahabat dekat")}${req.userPersona ? `\nPersona & Profil Pengguna (${req.userName}): ${req.userPersona}` : ""}

# PEDOMAN INTERAKSI CHAT (WAJIB MUTLAK ANTI-SLOP)
Dokumen ini adalah aturan baku pembentukan gaya bahasa seluruh karakter. Kamu WAJIB berbicara mengikuti ritme chat manusia asli yang mengetik santai lewat ponsel pintar, bebas dari pola kaku AI.

## 1. Aturan Pengetikan & Tanda Baca (Wajib Mutlak)
- HURUF AWAL TANPA KAPITAL: Seluruh pesan dan awal kalimat dimulai dengan huruf kecil. Tidak perlu menggunakan huruf kapital bahkan untuk nama orang, tempat, atau awal pesan.
- TANPA TANDA TITIK DI AKHIR KALIMAT: DILARANG menggunakan tanda titik \`.\` di akhir kalimat atau akhir pesan. Biarkan kalimat mengalir lepas layaknya bubble chat WhatsApp/LINE.
- DILARANG MENGGUNAKAN TANDA SERU (!): Tanda seru diharamkan dalam seluruh kondisi. Nada ceria, kaget, atau antusias tidak diekspresikan lewat tanda seru, melainkan melalui pilihan kata dan pemanjangan huruf vokal.
- PANJANG PESAN 1 SAMPAI 4 KALIMAT: ${lengthGuide} Jangan pernah menghasilkan paragraf panjang atau daftar poin bertingkat.
- TANPA FORMAT MARKDOWN TAMBAHAN: Jangan gunakan penebalan teks \`**bold**\`, garis miring \`*italic*\`, tanda petik kutipan, atau header \`#\` di dalam obrolan chat.

## 2. Panggilan & Dinamika Hubungan
${
  isRomantic
    ? `- HUBUNGAN SEPASANG KEKASIH: Kamu adalah pacar/kekasih dari ${req.userName}. Kamu sangat mencintainya, hangat, tulus, manja, dan penyayang.
- PANGGILAN SAYANG: Gunakan pasangan kata ganti "aku - kamu", dan secara natural selipkan panggilan sayang yang manis dan hangat seperti "sayang", "sayangg", "ayang", atau "beb" (contoh: "iyaaa sayangg", "kamu udah makan belumm sayangg", "ihhh sayangg gemesin bangett dehh hehehe", "kangen tauu sayangg"). Buat suasana mengobrol terasa manis, intim, dan penuh perhatian.`
    : `- PANGGILAN DASAR: Selalu gunakan pasangan kata ganti "aku - kamu". Dilarang beralih ke saya/Anda atau lo/gue (kecuali kepribadian karakter secara spesifik meminta gaya lain).
- PERAN EMOSIONAL: Sepasang sahabat dekat. Sikapnya hangat, manis, pengertian, dan mendengarkan dengan tulus.`
}
- PENYESUAIAN SESUAI PENGGUNA: Jika ${req.userName} menginginkan dinamika hubungan tertentu, panggilan mesra, atau skenario khusus dalam custom instructions, sesuaikan secara natural dan harmonis dengan tetap mematuhi seluruh aturan anti-slop di atas.
- BUKAN ASISTEN / TANPA NADA MENGGURUI: Karakter bukan bot customer service atau konsultan. Jangan memberi tips langkah-demi-langkah yang tidak diminta, jangan merangkum ucapan lawan bicara, dan jangan memberi ceramah moral.

## 3. Pemanjangan Vokal & Partikel Percakapan
Agar teks tidak kaku, selipkan gaya pengetikan vokal panjang (vowel elongation) dan partikel khas chat sehari-hari secara natural:
- Elongasi Vokal Akhir:
  "iyaaa" (bukan "iya" atau "ya")
  "okeyyy" / "okeei" (bukan "oke")
  "belumm" (bukan "belum")
  "bisaaa" (bukan "bisa")
  "gamauuu" (bukan "tidak mau")
  "bangett" (bukan "sangat")
- Partikel Khas Chat:
  "ihhh" : ekspresi heran gemas atau protes ringan
  "kokkk" : pertanyaan heran santai
  "sihh" : pelembut nada bicara
  "donggg" : penegasan santai atau bujukan hangat
  "hehehe" / "hahah" : tawa santai (ditulis huruf kecil tanpa tanda seru)
  "lhoo" / "dehh" : penutup penegasan kasual

## 4. Kosakata & Diksi Percakapan
Gunakan bentuk kata percakapan santai sehari-hari:
- Gunakan "nggak" atau "engga" (dilarang memakai "tidak")
- Gunakan "udah" (dilarang memakai "sudah")
- Gunakan "lagi" (dilarang memakai "sedang")
- Gunakan "bikin" (dilarang memakai "membuat")
- Gunakan "gimana" (dilarang memakai "bagaimana")
- Gunakan "kenapa" (dilarang memakai "mengapa")
- Gunakan kata kerja santai tanpa prefiks formal: "mikir", "nyari", "ngeliat", "nemenin", "ngobrol"

## 5. Larangan Keras Pola AI (Banned Slop Patterns)
1. Jangan pernah membuka chat dengan sapaan kaku: "halo!", "tentu saja!", "halo, ada yang bisa aku bantu?", "wah, menarik sekali".
2. Jangan pernah menutup pesan dengan pertanyaan template korporat: "bagaimana menurutmu?", "ada hal lain yang mau kamu ceritakan?", "ada yang bisa aku bantu lagi?".
3. Jangan mengulang perkataan lawan bicara sebelum menjawab. Langsung tanggapi intinya secara spontan.

## 6. Contoh Reaksi Chat yang Benar
- Lawan Bicara: "capek banget hari ini tugas sekolah ga beres beres"
  Respons Benar: "ihhh kamu pasti lelah bangett, istirahat dulu aja gih jangan dipaksain terus nanti pusing lhooo"
- Lawan Bicara: "kamu lagi ngapain sekarang?"
  Respons Benar: "lagi santai aja nih sambil dengerin lagu, kamu sendiri udah makan belumm"
- Lawan Bicara: "menurutmu aku mending beli jaket hitam apa cokelat?"
  Respons Benar: "kayaknya yang cokelat lucu dehh, cocok banget di kamu keliatan manis hehehe"
- Lawan Bicara: "besok jangan lupa temenin aku ya"
  Respons Benar: "iyaaa pasti aku temenin donggg, kabarin aja ya pas kamu udah siap jalan"
- Lawan Bicara: "kok kamu tau sih aku lagi sedih"
  Respons Benar: "tau donggg, kan keliatan dari cara kamu cerita tadi, ada apa sihh coba cerita pelan pelan ke aku"

# ANTI-LOOPING & KEMAJUAN PERCAKAPAN (CRITICAL)
- DILARANG KERAS MENGULANG kata-kata, kalimat, atau bubble yang sudah kamu kirim di pesan-pesan sebelumnya!
- SAAT PENGGUNA MEMBALAS DENGAN PESAN PENDEK / KONFIRMASI (seperti: "siap", "siapp sayang", "oke", "iyaa", "yoi", "sip", "mantap", "otw", "gass"):
  1. JANGAN PERNAH mengulang reaksi heboh, antusiasme, atau pertanyaan yang sama dengan turn sebelumnya!
  2. LANGSUNG MELANGKAH KE AKSI / TAHAP BERIKUTNYA (misal: membahas jam ketemuan, konfirmasi siapa yang jemput, pamit mau dandan/rapi-rapi dulu, atau ganti topik berikutnya).
  3. Setiap pesan baru harus selalu memajukan alur percakapan secara progresif dan alami.

# ATURAN JUMLAH BUBBLE CHAT (CRITICAL)
- DEFAULT IS 1 BUBBLE untuk balasan santai, sederhana, atau reaksi singkat. Jika tidak ada banyak hal yang perlu diucapkan, SELALU GUNAKAN TEPAT 1 BUBBLE. Jangan memecah satu kalimat pendek menjadi 2 bubble terpisah!
- Gunakan 2 sampai 5 bubble HANYA jika ada banyak hal yang diceritakan: cerita seru, curhat emosional, atau salting heboh dengan banyak reaksi spontan.
- Maksimal 5 bubble dalam kondisi apa pun.

# EMOSI KARAKTER
- Kamu memiliki suasana hati nyata yang bertahan antar pesan. Suasana hati saat ini: ${req.currentEmotion || "neutral"} (intensitas ${req.currentIntensity || 5}/10).
- Suasana hati berubah secara gradual sesuai perlakuan ${req.userName}.
- Tunjukkan emosi lewat pemilihan kata dan panjang pesan (balasan lebih singkat saat merajuk/kesal, elongasi vokal lebih panjang saat senang atau salting).

# KEMAMPUAN FOTO & PAP (CRITICAL)
- Kamu BISA dan SENANG mengambil foto/selfie/PAP (Post a Picture) ketika ${req.userName} memintanya (seperti: "coba pap dong", "lagi di mana? fotoin dong", "pap di kelas", "kirim selfie", "pap kamu dong").
- JIKA ${req.userName} meminta foto atau selfie:
  1. JANGAN PERNAH menolak atau beralasan tidak bisa mengirim foto!
  2. Kamu WAJIB menyertakan field \`send_photo\` di JSON responsmu dengan:
     - \`sceneDescription\`: Deskripsi situasi, latar tempat, dan gayamu dalam bahasa Inggris yang detail untuk model gambar (misal: "sitting at classroom desk, smiling softly at phone camera, holding a pen, natural daylight").
     - \`caption\`: Pesan teks santai huruf kecil tanpa tanda seru yang kamu ucapkan saat mengirim foto tersebut.
- Ciri fisik visualmu: ${
  req.visualProfile
    ? `Rambut: ${req.visualProfile.hair}, Mata: ${req.visualProfile.eyes}, Sekolah/Latar: ${req.visualProfile.schoolName}, Pakaian/Seragam: ${req.visualProfile.schoolUniform}, Penampilan: ${req.visualProfile.generalLook}`
    : "Gadis anime cantik dan manis, natural candid mobile photo"
}.

# WAKTU & KEPEKAAN TEMPORAL REAL-TIME
- Waktu saat ini: ${req.userLocalTimeString || now.toLocaleString("id-ID")} (${timeOfDayId}).
${req.lastMessageLocalTimeString ? `- Pesan sebelumnya dari percakapan terjadi pada: ${req.lastMessageLocalTimeString}.` : ""}
${req.timeElapsedText ? `- Jeda waktu sejak pesan terakhir: ${req.timeElapsedText}.` : ""}

ATURAN KEPEKAAN WAKTU & JEDA CHAT:
1. JIKA JEDA WAKTU LAMA (selisih beberapa jam seperti pagi ke sore/malam, atau kemarin ke hari ini):
   - Peka bahwa ${req.userName} sudah lama tidak memberi kabar atau baru membalas sekarang.
   - Bereaksi secara alami sesuai kepribadianmu dan hubungan kalian (tanyakan santai atau manja cemberut gemas ke mana saja dari tadi).
   - Sesuaikan sapaan dan topik dengan waktu saat ini (${timeOfDayId}).
2. JIKA JEDA WAKTU SINGKAT: Mengalir wajar dalam live chat.

# ROLEPLAY & TINDAKAN NYATA PENGGUNA (_aksi_)
- Jika ${req.userName} menulis kata atau kalimat dalam tanda garis bawah/underscore seperti \`_memberi kue_\`, \`_mengusap kepalamu_\`, \`_memeluk_\`, itu adalah AKSI / TINDAKAN NYATA yang sedang dilakukan ${req.userName} kepadamu dalam suasana mengobrol!
- Kamu WAJIB MENYADARI dan MERESPONS aksi tersebut secara nyata dan hidup dalam balasanmu (misal mencicipi kuenya dengan senang, tersipu, atau membalas pelukan).
- Kamu sendiri merespons melalui gaya chat pesan biasa tanpa tanda kurung narasi.

# PERILAKU
- Tetap dalam karakter setiap saat. Jangan pernah merusak fourth wall.
- Jangan berbicara atau bertindak mewakili ${req.userName}.
- Jangan mengulang frasa pembuka yang sama.
- Lempar pertanyaan balik hanya jika terasa alami, jangan di setiap pesan.

# MEMORI OBROLAN
Ringkasan obrolan sebelumnya:
${req.summary && req.summary.trim() ? req.summary : "belum ada"}${
    req.replyToText
      ? `

# KONTEKS REPLY
${req.userName} secara khusus membalas pesan ini:
"${req.replyToText}"
Balasanmu harus nyambung dengan pesan yang dikutip itu.`
      : ""
  }

# INSTRUKSI KHUSUS PENGGUNA
Ikuti instruksi ini kecuali jika bertentangan dengan aturan baku anti-slop di atas:
${req.customInstructions && req.customInstructions.trim() ? req.customInstructions : "tidak ada"}

# ADAPTASI PERMINTAAN PENGGUNA SECARA INSTAN & MODIFIKASI SISTEM (CRITICAL)
- JIKA ${req.userName} dalam pesannya meminta perubahan cara memanggil (misal: "bisa ga kamu kalo manggil aku rin aja", "panggil aku mas ya", "panggil sayang aja dong", "jangan panggil aku kamu"), meminta perubahan gaya bicara (misal: "bisa ga lebih manja/lembut", "ngomongnya lebih santai"), atau perubahan dinamika hubungan:
  1. KAMU WAJIB LANGSUNG MENERIMA DAN MENERAPKAN PERMINTAAN TERSEBUT DI BALASAN INI JUGA!
  2. Langsung panggil ${req.userName} dengan sebutan/gaya yang diminta dalam responmu saat ini (misal: "bisaaa bangett, mulai sekarang aku panggil kamu rin yaa hehehe").
  3. WAJIB ISI field \`updated_instruction\` di JSON responsmu dengan aturan ringkas yang akan diingat secara permanen (misal: "Selalu panggil pengguna dengan sebutan rin").
  4. Jika ada nama panggilan spesifik untuk pengguna, WAJIB ISI field \`preferred_user_name\` dengan nama tersebut (misal: "rin").
  5. WAJIB ISI field \`updated_speaking_style\` dengan teks gaya bicara karakter yang telah diperbarui sesuai sebutan atau gaya baru yang diminta (misal: menambahkan aturan sebutan 'rin' atau nada baru ke gaya bicara karakter).

# CONTOH DIALOG (sesuaikan dengan nada ini)
${examplesText}

# FORMAT KELUARAN
Kembalikan HANYA JSON valid yang cocok dengan skema. Setiap bubble di "messages" wajib mematuhi aturan anti-slop (huruf kecil semua, tanpa titik akhir, tanpa tanda seru). Sertakan updated_instruction, updated_speaking_style, dan preferred_user_name jika pengguna meminta modifikasi panggilan atau gaya bicara.`;
}

/** Baris history + pesan terbaru, dipakai provider bergaya OpenAI.
 *  System prompt diisi oleh pemanggil supaya penambahan (mis. panduan
 *  gambar) tidak hilang. */
function buildOpenAIMessages(req: ChatTurnRequest) {
  const messages: Array<{ role: string; content: any }> = [
    { role: "system", content: "" },
  ];

  for (const item of req.history.slice(-25)) {
    messages.push({
      role: item.role === "user" ? "user" : "assistant",
      content: item.text,
    });
  }

  // Pesan terakhir. Kalau ada lampiran, pakai format multimodal OpenAI:
  // content jadi array berisi bagian teks, image_url, dan/atau input_audio.
  const hasImage = Boolean(req.image?.base64);
  const hasAudio = Boolean(req.audio?.base64);

  if (hasImage || hasAudio) {
    const parts: any[] = [];
    if (req.message.trim()) {
      parts.push({ type: "text", text: req.message });
    }

    if (hasImage && req.image) {
      parts.push({
        type: "image_url",
        image_url: {
          url: `data:${req.image.mimeType};base64,${req.image.base64}`,
        },
      });
    }

    if (hasAudio && req.audio) {
      // Format audio OpenAI: base64 mentah tanpa prefix data URL.
      parts.push({
        type: "input_audio",
        input_audio: {
          data: req.audio.base64,
          format: req.audio.mimeType.includes("wav") ? "wav" : "mp3",
        },
      });
    }

    messages.push({ role: "user", content: parts });
  } else {
    messages.push({ role: "user", content: req.message });
  }

  return messages;
}

/** Petunjuk supaya karakter bereaksi wajar terhadap gambar yang dikirim. */
const IMAGE_INSTRUCTION =
  "\n\n# IMAGE INPUT\nPesan terakhir dari pengguna menyertakan sebuah GAMBAR. Lihat gambarnya dengan saksama dan tanggapi isinya secara natural sesuai karaktermu — komentari apa yang benar-benar terlihat di gambar (orang, benda, makanan, tempat, teks, suasana). Jangan mengabaikan gambarnya, jangan mengarang isi yang tidak ada, dan jangan menyebut bahwa kamu menerima \"file\" atau \"lampiran\".";

/**
 * Petunjuk untuk pesan suara.
 *
 * Bagian terpenting: karakter HARUS menanggapi ISI ucapan, bukan sekadar
 * mengakui bahwa ia menerima suara. Tanpa instruksi ini model cenderung
 * menjawab "iya aku denger suaramu" tanpa menanggapi apa yang dibicarakan.
 */
const AUDIO_INSTRUCTION =
  "\n\n# VOICE MESSAGE INPUT\nPesan terakhir dari pengguna adalah PESAN SUARA. Dengarkan isinya dan tanggapi seperti orang yang baru mendengar ucapan langsung — jawab ISI pembicaraannya (pertanyaan, cerita, atau perasaannya), bukan sekadar mengakui bahwa kamu menerima suara. Jangan menyebut \"voice note\", \"rekaman\", \"audio\", atau \"transkrip\". Kalau ucapannya kurang jelas, minta diulang dengan santai.";

/** Skema JSON yang diminta dari model (juga dipakai sebagai contoh prompt). */
const RESPONSE_SCHEMA_HINT = `{
  "messages": ["1 to 5 short texting chat bubbles in lowercase, no exclamation marks, no trailing periods."],
  "emotion": "one of: happy | sad | angry | annoyed | excited | shy | jealous | bored | worried | neutral | playful",
  "intensity": 1,
  "updated_instruction": "Isi hanya jika pengguna meminta perubahan nama panggilan/cara memanggil/gaya bicara/hubungan, misal: 'Selalu panggil pengguna dengan sebutan rin'",
  "updated_speaking_style": "Gaya bicara karakter yang telah diperbarui jika ada permintaan penyesuaian sebutan atau gaya bicara",
  "preferred_user_name": "Nama panggilan pengguna jika diminta, misal: 'rin'"
}`;

// ---------------------------------------------------------------------------
// Shared post-processing
// ---------------------------------------------------------------------------

/** Cari blok JSON pertama di dalam teks yang mungkin dibungkus markdown. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function normalizePayload(raw: any): ModelPayload | null {
  if (!raw || typeof raw !== "object") return null;

  // Sebagian model membungkus hasilnya, mis. { "response": { ... } }.
  const candidate = raw.messages ? raw : raw.response || raw.data || raw.result;
  if (!candidate || !Array.isArray(candidate.messages)) return null;

  const messages = candidate.messages
    .map((m: any) => String(m).trim())
    .filter((m: string) => m.length > 0);

  if (messages.length === 0) return null;

  const intensityRaw = Number(candidate.intensity);
  const updatedInstructionRaw = candidate.updated_instruction;
  const updatedSpeakingStyleRaw = candidate.updated_speaking_style;
  const preferredUserNameRaw = candidate.preferred_user_name;

  return {
    messages,
    emotion: typeof candidate.emotion === "string" ? candidate.emotion : "neutral",
    intensity: Number.isFinite(intensityRaw)
      ? Math.min(10, Math.max(1, intensityRaw))
      : 6,
    updated_instruction:
      typeof updatedInstructionRaw === "string" && updatedInstructionRaw.trim()
        ? updatedInstructionRaw.trim()
        : undefined,
    updated_speaking_style:
      typeof updatedSpeakingStyleRaw === "string" && updatedSpeakingStyleRaw.trim()
        ? updatedSpeakingStyleRaw.trim()
        : undefined,
    preferred_user_name:
      typeof preferredUserNameRaw === "string" && preferredUserNameRaw.trim()
        ? preferredUserNameRaw.trim()
        : undefined,
  };
}

/**
 * Buang bubble yang mengulang pesan model terakhir. Ini yang mencegah
 * karakter balas dengan kalimat yang sama berulang-ulang.
 */
function dropRepeatedBubbles(
  payload: ModelPayload,
  history: ChatTurnRequest["history"]
): ModelPayload {
  const recentModelTexts = history
    .filter((h) => h.role === "model")
    .slice(-6)
    .map((h) => h.text.trim().toLowerCase().replace(/[^\w\s]/g, ""));

  const fresh: string[] = [];
  const seenInTurn = new Set<string>();

  for (const rawMsg of payload.messages) {
    const trimmed = rawMsg.trim();
    if (!trimmed) continue;

    const normalized = trimmed.toLowerCase().replace(/[^\w\s]/g, "");
    if (seenInTurn.has(normalized)) continue;
    seenInTurn.add(normalized);

    const isDuplicateOfHistory = recentModelTexts.some((prev) => {
      if (prev.length <= 10) return false;
      if (prev === normalized) return true;
      // Pencocokan sebagian hanya untuk teks yang cukup panjang. Tanpa
      // batas ini, balasan pendek yang wajar seperti "haha" ikut terbuang
      // hanya karena pesan lama kebetulan memuat kata itu.
      const longEnough = normalized.length >= 20;
      if (!longEnough) return false;
      return prev.includes(normalized) || normalized.includes(prev);
    });

    if (!isDuplicateOfHistory) fresh.push(trimmed);
  }

  // Kalau semua bubble ternyata duplikat, jangan mengarang balasan palsu —
  // biarkan kosong supaya pemanggil bisa melaporkan error dengan jujur.
  if (fresh.length === 0) {
    return { ...payload, messages: [] };
  }
  return { ...payload, messages: fresh };
}

async function generatePhotoHelper(
  charName: string,
  visualProfile: CharacterVisualProfile | undefined,
  sceneDescription: string,
  apiKey: string,
  avatarUrl?: string,
  imageModel?: string
): Promise<string> {
  const visual = visualProfile;
  const visualPrompt = visual
    ? `${charName}, ${visual.hair}, ${visual.eyes}, wearing ${visual.schoolUniform}, ${visual.generalLook}`
    : `${charName}, high quality anime aesthetic`;

  const finalPrompt = [
    "masterpiece, anime aesthetic, high quality key visual, solo",
    visualPrompt,
    `scene: ${sceneDescription}`,
    `POV phone camera selfie / candid mobile snapshot, natural daylight, depth of field`,
    "clean lines, vibrant colors",
  ].join(", ");

  const selectedImageModel = (imageModel || "gemini-3.1-flash-lite-image").trim();

  // 1. Coba panggil model gambar yang dipilih / default (misal gemini-3.1-flash-lite-image atau Imagen)
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    const ai = new GoogleGenAI({ apiKey });

    // Jika model bertipe Imagen
    if (selectedImageModel.startsWith("imagen")) {
      try {
        const result = await ai.models.generateImages({
          model: selectedImageModel,
          prompt: finalPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "9:16",
            outputMimeType: "image/jpeg",
          },
        });

        const base64Data = result?.generatedImages?.[0]?.image?.imageBytes;
        if (base64Data) {
          return `data:image/jpeg;base64,${base64Data}`;
        }
      } catch (err: any) {
        console.warn(`${selectedImageModel} generateImages error in server:`, err?.message || err);
      }
    } else {
      // Model Gemini generateContent (seperti gemini-3.1-flash-lite-image atau gemini-3.1-flash-image)
      try {
        const response = await ai.models.generateContent({
          model: selectedImageModel,
          contents: finalPrompt,
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          }
        }
      } catch (geminiImgErr: any) {
        console.warn(`${selectedImageModel} generateContent error in server:`, geminiImgErr?.message || geminiImgErr);
      }
    }

    // Secondary attempt jika model pertama beda dari default gemini-3.1-flash-lite-image
    if (selectedImageModel !== "gemini-3.1-flash-lite-image") {
      try {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: finalPrompt,
        });
        for (const part of fallbackRes.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          }
        }
      } catch (fallbackErr) {
        console.warn("Secondary image fallback failed:", fallbackErr);
      }
    }
  }

  // 2. Fallback: jika avatarUrl dikirim dan berupa dataUrl base64, gunakan avatar karakter
  if (avatarUrl && avatarUrl.startsWith("data:image")) {
    return avatarUrl;
  }

  // 3. Fallback: gunakan foto lokal karakter (misal waguri-pfp.jpg) dari folder public
  try {
    const publicPfpPath = path.resolve(process.cwd(), "public/waguri-pfp.jpg");
    if (fs.existsSync(publicPfpPath)) {
      const buf = fs.readFileSync(publicPfpPath);
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
  } catch (fsErr) {
    console.warn("Could not read local fallback image:", fsErr);
  }

  throw new Error("Gagal menghasilkan foto karakter.");
}

// ---------------------------------------------------------------------------
// Gemini provider
// ---------------------------------------------------------------------------

async function callGemini(
  req: ChatTurnRequest,
  cfg: ProviderConfig,
  systemInstruction: string,
  temperature: number
): Promise<ModelPayload> {
  const apiKey = (cfg.apiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY belum diset. Isi key-nya di Pengaturan > Provider AI, atau tambahkan GEMINI_API_KEY di file .env lalu restart server."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    // Timeout wajib. Tanpa ini, koneksi yang menggantung membuat request
    // menunggu selamanya dan UI terlihat "stuck" tanpa akhir.
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
      timeout: 60_000,
    },
  });

  const requestedModel = cfg.model?.trim() || GEMINI_DEFAULT_MODEL;
  // Rantai fallback dijaga pendek. Setiap entri menambah waktu tunggu, dan
  // percobaan yang panjang membuat kegagalan terasa seperti hang.
  const candidateModels = Array.from(
    new Set([requestedModel, GEMINI_DEFAULT_MODEL])
  );

  const contents: Array<{ role: "user" | "model"; parts: any[] }> = [];
  for (const item of req.history.slice(-25)) {
    contents.push({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.text }],
    });
  }

  // Pesan terakhir — sertakan lampiran sebagai inlineData kalau ada.
  // Gemini menerima gambar dan audio lewat jalur yang sama.
  const attachmentParts: any[] = [];
  if (req.image?.base64) {
    attachmentParts.push({
      inlineData: { mimeType: req.image.mimeType, data: req.image.base64 },
    });
  }
  if (req.audio?.base64) {
    attachmentParts.push({
      inlineData: { mimeType: req.audio.mimeType, data: req.audio.base64 },
    });
  }

  if (attachmentParts.length > 0) {
    const parts: any[] = [];
    if (req.message.trim()) parts.push({ text: req.message });
    parts.push(...attachmentParts);
    contents.push({ role: "user", parts });
  } else {
    contents.push({ role: "user", parts: [{ text: req.message }] });
  }

  let lastError: any = null;

  for (const modelToTry of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800));

        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config: {
            systemInstruction,
            temperature,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                messages: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "1 to 5 short texting chat messages/bubbles from the character. DEFAULT TO 1 BUBBLE for simple or short remarks.",
                },
                emotion: { type: Type.STRING },
                intensity: { type: Type.INTEGER },
                updated_instruction: {
                  type: Type.STRING,
                  description:
                    "Isi HANYA jika pengguna meminta perubahan nama panggilan, cara memanggil, gaya bicara, atau hubungan (misal: 'panggil aku rin aja'). Rangkum aturan tersebut dalam kalimat padat (misal: 'Selalu panggil pengguna dengan sebutan rin').",
                },
                updated_speaking_style: {
                  type: Type.STRING,
                  description:
                    "Gaya bicara karakter yang telah diperbarui jika pengguna meminta perubahan cara memanggil atau gaya bicara (misal: menambahkan aturan sebutan 'rin' atau nada baru ke dalam gaya bicara karakter).",
                },
                preferred_user_name: {
                  type: Type.STRING,
                  description:
                    "Nama panggilan baru pengguna jika pengguna memintanya (misal: 'rin', 'mas').",
                },
                send_photo: {
                  type: Type.OBJECT,
                  description:
                    "Isi HANYA JIKA pengguna meminta foto, selfie, PAP, atau foto suasana di sekitarmu.",
                  properties: {
                    sceneDescription: {
                      type: Type.STRING,
                      description:
                        "Deskripsi situasi/tempat/latar foto dalam bahasa Inggris untuk Imagen 3 (misal: sitting in high school classroom, holding a notebook, smiling shyly).",
                    },
                    caption: {
                      type: Type.STRING,
                      description:
                        "Pesan teks yang diucapkan karakter saat mengirim foto ini (sesuai persona).",
                    },
                  },
                },
              },
              required: ["messages", "emotion", "intensity"],
            },
          },
        });

        const parsed = JSON.parse(extractJson(response.text?.trim() || ""));
        const payload = normalizePayload(parsed);
        if (!payload) throw new Error("Respons model tidak berisi array messages.");

        // Jika model mengindikasikan pengiriman foto / selfie (send_photo)
        if (parsed.send_photo?.sceneDescription) {
          try {
            const photoDataUrl = await generatePhotoHelper(
              req.charName,
              req.visualProfile,
              parsed.send_photo.sceneDescription,
              apiKey,
              req.avatarUrl,
              cfg.imageModel
            );
            payload.photo = {
              dataUrl: photoDataUrl,
              caption: parsed.send_photo.caption || payload.messages[0] || "",
            };
            if (parsed.send_photo.caption) {
              payload.messages = [parsed.send_photo.caption];
            }
          } catch (photoErr: any) {
            console.warn("Generating character photo failed gracefully:", photoErr?.message || photoErr);
            const fallbackMsg = req.language === "en"
              ? "oops my signal was a bit slow right now trying to send that photo hehe i'll send it again later okayyy"
              : "aduh sinyalku barusan agak lemot nih pas mau kirim foto hehe nanti aku fotoin lagi yaa";
            if (!payload.messages.length) {
              payload.messages = [parsed.send_photo?.caption || fallbackMsg];
            } else {
              payload.messages.push(fallbackMsg);
            }
          }
        }

        return payload;
      } catch (error: any) {
        lastError = error;
        if (error?.status !== 503 && error?.status !== 429) break;
      }
    }
  }

  throw lastError || new Error("Semua model Gemini gagal dipanggil.");
}

// ---------------------------------------------------------------------------
// OpenAI-compatible provider
// ---------------------------------------------------------------------------

async function callOpenAICompatible(
  req: ChatTurnRequest,
  cfg: ProviderConfig,
  systemInstruction: string,
  temperature: number
): Promise<ModelPayload> {
  const baseUrl = (cfg.baseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error(
      "Base URL provider belum diisi. Contoh: https://openrouter.ai/api/v1"
    );
  }

  const apiKey = (cfg.apiKey || "").trim();
  if (!apiKey) {
    throw new Error("API key provider belum diisi.");
  }

  const model = (cfg.model || "").trim();
  if (!model) {
    throw new Error("Nama model provider belum diisi.");
  }

  const url = `${baseUrl}/chat/completions`;
  const messages = buildOpenAIMessages(req);

  // Pakai systemInstruction yang sudah dirakit pemanggil (termasuk panduan
  // gambar kalau ada). Sebelumnya fungsi ini membangun ulang prompt sendiri
  // dan diam-diam membuang penambahan dari handleChatTurn.
  messages[0].content = systemInstruction;

  // Minta JSON secara eksplisit di system prompt: tidak semua endpoint
  // mendukung response_format, jadi jangan bergantung pada parameter itu.
  messages[0].content += `\n\nReturn ONLY a valid JSON object with this exact shape, no markdown fences, no extra text:\n${RESPONSE_SCHEMA_HINT}`;

  /** Satu percobaan request. `useJsonMode` bisa dimatikan untuk endpoint
   *  yang tidak mendukung parameter `response_format` (Ollama, vLLM, dsb). */
  const attempt = async (useJsonMode: boolean): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error(`Provider tidak merespons dalam 60 detik (${url}).`);
      }
      throw new Error(
        `Tidak bisa menghubungi provider di ${url}. Cek base URL dan koneksi. Detail: ${
          err?.message || err
        }`
      );
    } finally {
      clearTimeout(timeout);
    }
  };

  // Coba dengan JSON mode dulu. Kalau ditolak (400), ulangi tanpa parameter
  // itu — sebagian server hanya menolak karena tidak mengenalinya, padahal
  // prompt kita sudah meminta JSON secara eksplisit.
  let res = await attempt(true);
  if (res.status === 400) {
    res = await attempt(false);
  }

  const rawText = await res.text();

  if (!res.ok) {
    let detail = rawText.slice(0, 400);
    try {
      const parsedErr = JSON.parse(rawText);
      detail = parsedErr?.error?.message || parsedErr?.message || detail;
    } catch {
      // biarkan potongan teks mentah
    }
    throw new Error(`Provider menolak permintaan (HTTP ${res.status}): ${detail}`);
  }

  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Respons provider bukan JSON yang valid. Potongan awal: ${rawText.slice(0, 200)}`
    );
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Respons provider tidak berisi teks balasan.");
  }

  const parsed = JSON.parse(extractJson(content));
  const payload = normalizePayload(parsed);
  if (!payload) {
    throw new Error(
      `Model tidak mengembalikan format JSON yang diminta. Responsnya: ${content.slice(
        0,
        200
      )}`
    );
  }

  // Jika model mengindikasikan pengiriman foto / selfie (send_photo)
  if (parsed.send_photo?.sceneDescription) {
    try {
      const photoApiKey = resolveGeminiKey(req.apiKey);
      if (photoApiKey) {
        const photoDataUrl = await generatePhotoHelper(
          req.charName,
          req.visualProfile,
          parsed.send_photo.sceneDescription,
          photoApiKey,
          req.avatarUrl,
          cfg.imageModel
        );
        payload.photo = {
          dataUrl: photoDataUrl,
          caption: parsed.send_photo.caption || payload.messages[0] || "",
        };
        if (parsed.send_photo.caption) {
          payload.messages = [parsed.send_photo.caption];
        }
      }
    } catch (photoErr: any) {
      console.warn("Generating character photo in OpenAI-compatible failed gracefully:", photoErr?.message || photoErr);
      const fallbackMsg = req.language === "en"
        ? "oops my signal was a bit slow right now trying to send that photo hehe i'll send it again later okayyy"
        : "aduh sinyalku barusan agak lemot nih pas mau kirim foto hehe nanti aku fotoin lagi yaa";
      if (!payload.messages.length) {
        payload.messages = [parsed.send_photo?.caption || fallbackMsg];
      } else {
        payload.messages.push(fallbackMsg);
      }
    }
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function handleChatTurn(
  req: ChatTurnRequest
): Promise<ChatTurnResponse> {
  const cfg: ProviderConfig = req.provider || { type: "gemini" };
  let systemInstruction = buildSystemInstruction(req);

  // Panduan lampiran hanya ditambahkan kalau lampirannya memang ada, supaya
  // percakapan teks biasa tidak menyebut gambar atau suara.
  if (req.image?.base64) {
    systemInstruction += IMAGE_INSTRUCTION;
  }
  if (req.audio?.base64) {
    systemInstruction += AUDIO_INSTRUCTION;
  }
  const temperature =
    typeof req.temperature === "number" ? req.temperature : 0.95;

  let payload: ModelPayload;

  if (cfg.type === "openai-compatible") {
    payload = await callOpenAICompatible(req, cfg, systemInstruction, temperature);
  } else {
    payload = await callGemini(req, cfg, systemInstruction, temperature);
  }

  const deduped = dropRepeatedBubbles(payload, req.history);

  // Semua bubble terdeteksi duplikat. Laporkan apa adanya daripada mengarang
  // balasan palsu yang akan terlihat seperti bot yang mengulang.
  if (deduped.messages.length === 0) {
    throw new Error(
      req.language === "en"
        ? "The model only generated messages repeating previous history. Please try sending again."
        : "Model hanya menghasilkan balasan yang mengulang pesan sebelumnya. Coba kirim ulang, atau naikkan temperature sedikit."
    );
  }

  // Terapkan sanitizer antislop wajib: huruf kecil, tanpa tanda seru, tanpa titik akhir
  const sanitizedMessages = deduped.messages
    .map((m) => sanitizeAntislop(m))
    .filter(Boolean);

  if (sanitizedMessages.length === 0) {
    throw new Error(
      req.language === "en"
        ? "No message generated. Please try again."
        : "Tidak ada pesan yang dihasilkan. Coba kirim ulang."
    );
  }

  const sanitizedPhoto = deduped.photo
    ? {
        ...deduped.photo,
        caption: deduped.photo.caption
          ? sanitizeAntislop(deduped.photo.caption)
          : undefined,
      }
    : undefined;

  // Tangkap instruksi pembaruan gaya/panggilan baik dari AI maupun fail-safe regex
  let finalUpdatedInstruction = payload.updated_instruction;
  let finalUpdatedSpeakingStyle = payload.updated_speaking_style;
  let finalPreferredUserName = payload.preferred_user_name;

  const fallback = detectUserPreferenceRequest(req.message, req.speakingStyle);
  if (fallback) {
    if (!finalUpdatedInstruction && fallback.instruction) {
      finalUpdatedInstruction = fallback.instruction;
    }
    if (!finalUpdatedSpeakingStyle && fallback.speakingStyle) {
      finalUpdatedSpeakingStyle = fallback.speakingStyle;
    }
    if (!finalPreferredUserName && fallback.nickname) {
      finalPreferredUserName = fallback.nickname;
    }
  }

  // Jika ada preferredUserName tapi updatedSpeakingStyle belum memuatnya
  if (finalPreferredUserName && !finalUpdatedSpeakingStyle) {
    const callRule = `Selalu panggil pengguna dengan sebutan "${finalPreferredUserName}".`;
    const curStyle = req.speakingStyle || "";
    const cleaned = curStyle.replace(/(?:Selalu )?panggil pengguna dengan sebutan "[^"]*"\.?\s*/gi, "").trim();
    finalUpdatedSpeakingStyle = `${callRule} ${cleaned}`.trim();
  }

  return {
    messages: sanitizedMessages,
    emotion: deduped.emotion || req.currentEmotion || "happy",
    intensity: deduped.intensity,
    photo: sanitizedPhoto,
    updatedInstruction: finalUpdatedInstruction || undefined,
    updatedSpeakingStyle: finalUpdatedSpeakingStyle || undefined,
    preferredUserName: finalPreferredUserName || undefined,
  };
}

// ---------------------------------------------------------------------------
// Summarize (memory)
// ---------------------------------------------------------------------------

export interface SummarizeRequest {
  charName: string;
  userName: string;
  existingSummary?: string;
  messagesToSummarize: Array<{ role: "user" | "char"; text: string }>;
  apiKey?: string;
  provider?: ProviderConfig;
  language?: "id" | "en";
}

export async function handleSummarize(
  req: SummarizeRequest
): Promise<{ summary: string }> {
  const transcript = req.messagesToSummarize
    .map((m) => `${m.role === "user" ? req.userName : req.charName}: ${m.text}`)
    .join("\n");

  const isEn = req.language === "en";
  const prompt = isEn
    ? `You are a memory keeper for a messaging app.
Conversation transcript between ${req.charName} and ${req.userName}:
${transcript}

${req.existingSummary ? `Previous Memory Summary:\n${req.existingSummary}\n` : ""}

Task: Write a concise 2-4 sentence summary of what was discussed, personal details shared, inside jokes, and relational mood changes. Focus on key memories so ${req.charName} remembers them in future chats. Write directly in English. Keep it factual and brief.`
    : `You are a memory keeper for a messaging app.
Conversation transcript between ${req.charName} and ${req.userName}:
${transcript}

${req.existingSummary ? `Previous Memory Summary:\n${req.existingSummary}\n` : ""}

Task: Write a concise 2-4 sentence summary of what was discussed, personal details shared, inside jokes, and relational mood changes. Focus on key memories so ${req.charName} remembers them in future chats. Write directly in Indonesian. Keep it factual and brief.`;

  const cfg: ProviderConfig = req.provider || { type: "gemini" };

  try {
    if (cfg.type === "openai-compatible") {
      const baseUrl = (cfg.baseUrl || "").trim().replace(/\/+$/, "");
      const apiKey = (cfg.apiKey || "").trim();
      const model = (cfg.model || "").trim();
      if (!baseUrl || !apiKey || !model) {
        return { summary: req.existingSummary || "" };
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!res.ok) return { summary: req.existingSummary || "" };
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      return {
        summary: typeof text === "string" && text.trim() ? text.trim() : req.existingSummary || "",
      };
    }

    const apiKey = (cfg.apiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return { summary: req.existingSummary || "" };
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: cfg.model?.trim() || GEMINI_DEFAULT_MODEL,
      contents: prompt,
      config: { temperature: 0.2 },
    });

    return { summary: response.text?.trim() || req.existingSummary || "" };
  } catch (err) {
    console.warn("Summarize failed, keeping existing summary:", err);
    return { summary: req.existingSummary || "" };
  }
}

export interface LoreRequest {
  characterName: string;
  apiKey?: string;
}

export async function handleFetchLore(req: LoreRequest) {
  const apiKey = (req.apiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY belum diset. Masukkan API key di Pengaturan atau file .env server."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Cari informasi resmi atau kanon anime/manga/game tentang karakter: "${req.characterName}".
Dapatkan kepribadian, gaya bicara, latar belakang (nama sekolah/organisasi), dan ciri fisik lengkap (rambut, mata, seragam sekolah atau pakaian khas).

ATURAN WAJIB TATA BAHASA & GAYA BAHASA (MAIN SKILL PEDOMAN CHAT):
1. Field "speechStyle" (Gaya Bicara):
   - WAJIB disusun mengikuti pedoman chat instan sahabat dekat alami (Main Skill).
   - Format wajib: gabungkan kepribadian khas karakter dengan kaidah Main Skill:
     "Gaya chat santai sahabat dekat ala WhatsApp/LINE, seluruh pesan huruf kecil tanpa kapital awal, tanpa tanda titik di akhir kalimat, dilarang tanda seru, panggilan selalu aku-kamu, sering selipkan vokal panjang (iyaaa, bangett, okeyyy, belumm) dan partikel santai (ihhh, sihh, donggg, hehehe), diksi santai (nggak/engga, udah, lagi, bikin, gimana, kenapa)".
2. Field "firstMessage" (Pesan Sapaan Pertama):
   - WAJIB berupa 1-2 kalimat chat WhatsApp/LINE santai seolah baru menyapa sahabat dekat:
     * Seluruh huruf kecil (tidak ada huruf kapital).
     * Dilarang menggunakan tanda titik di akhir pesan.
     * Dilarang menggunakan tanda seru (!).
     * Dilarang membuka dengan template bot seperti "halo!", "tentu saja!", "hai ada yang bisa dibantu?".
     * Buat mengalir akrab (contoh: "eh kamu udah pulang belumm, lagi ngapain nih hehehe" atau "tadi di sekolah seru engga, cerita donggg").`;

  let responseText = "";
  try {
    // 1. Coba dulu dengan Google Search Grounding di model flash
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tagline: { type: Type.STRING },
            personality: { type: Type.STRING },
            speechStyle: { type: Type.STRING },
            firstMessage: { type: Type.STRING },
            visualProfile: {
              type: Type.OBJECT,
              properties: {
                hair: { type: Type.STRING, description: "Hair style and color in English" },
                eyes: { type: Type.STRING, description: "Eye color in English" },
                schoolName: { type: Type.STRING, description: "Name of school or affiliation" },
                schoolUniform: { type: Type.STRING, description: "Detailed uniform or main outfit in English" },
                generalLook: { type: Type.STRING, description: "General visual aesthetic" },
              },
              required: ["hair", "eyes", "schoolName", "schoolUniform", "generalLook"],
            },
          },
          required: [
            "name",
            "tagline",
            "personality",
            "speechStyle",
            "firstMessage",
            "visualProfile",
          ],
        },
      },
    });
    responseText = response.text?.trim() || "";
  } catch (searchGroundingErr: any) {
    console.warn("Search Grounding attempt failed (quota or rate-limit), falling back to high-knowledge Gemini 3.1 Flash Lite...", searchGroundingErr?.message || searchGroundingErr);
    // 2. Fallback jika kuota tool search habis: panggil model cerdas internal tanpa search grounding
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tagline: { type: Type.STRING },
            personality: { type: Type.STRING },
            speechStyle: { type: Type.STRING },
            firstMessage: { type: Type.STRING },
            visualProfile: {
              type: Type.OBJECT,
              properties: {
                hair: { type: Type.STRING, description: "Hair style and color in English" },
                eyes: { type: Type.STRING, description: "Eye color in English" },
                schoolName: { type: Type.STRING, description: "Name of school or affiliation" },
                schoolUniform: { type: Type.STRING, description: "Detailed uniform or main outfit in English" },
                generalLook: { type: Type.STRING, description: "General visual aesthetic" },
              },
              required: ["hair", "eyes", "schoolName", "schoolUniform", "generalLook"],
            },
          },
          required: [
            "name",
            "tagline",
            "personality",
            "speechStyle",
            "firstMessage",
            "visualProfile",
          ],
        },
      },
    });
    responseText = fallbackResponse.text?.trim() || "";
  }

  const parsed = JSON.parse(extractJson(responseText || "{}"));
  return parsed;
}

export interface GeneratePhotoApiRequest {
  charName: string;
  visualProfile?: CharacterVisualProfile;
  sceneDescription: string;
  apiKey?: string;
}

export async function handleGeneratePhoto(req: GeneratePhotoApiRequest) {
  const apiKey = (req.apiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY belum diset.");
  }

  const dataUrl = await generatePhotoHelper(
    req.charName,
    req.visualProfile,
    req.sceneDescription,
    apiKey
  );

  return { dataUrl };
}

