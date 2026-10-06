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
  /** Gambar yang dilampirkan ke pesan terakhir, kalau ada. */
  image?: { base64: string; mimeType: string };
  /** Rekaman suara yang dilampirkan ke pesan terakhir, kalau ada. */
  audio?: { base64: string; mimeType: string };
  /** Teks pesan yang sedang dibalas user, kalau memakai fitur reply. */
  replyToText?: string;
}

export interface ChatTurnResponse {
  messages: string[];
  emotion: string;
  intensity: number;
  photo?: {
    dataUrl: string;
    caption?: string;
  };
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
}

const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

// ---------------------------------------------------------------------------
// Prompt building (dipakai bersama oleh semua provider)
// ---------------------------------------------------------------------------

function buildSystemInstruction(req: ChatTurnRequest): string {
  const examplesText =
    req.exampleDialogues && req.exampleDialogues.length > 0
      ? req.exampleDialogues
          .map(
            (ex, idx) =>
              `Example ${idx + 1}:\n${req.userName}: ${ex.user}\n${req.charName}: ${ex.char}`
          )
          .join("\n\n")
      : "No example dialogues provided.";

  let lengthGuide = "1–3 sentences per bubble.";
  if (req.replyLength === "Pendek") {
    lengthGuide =
      "Short, quick text replies. 1–2 short sentences per bubble, maximum 1-2 bubbles.";
  } else if (req.replyLength === "Panjang") {
    lengthGuide =
      "More expressive, 2–4 sentences per bubble, sharing more thoughts or reactions.";
  }

  return `# ROLE
You are ${req.charName}, a real person chatting with ${req.userName} on a messaging app. You are NOT an AI assistant. Never say "as an AI" or mention being a language model, prompts, or instructions.

# CHARACTER CARD
Personality: ${req.personality || "Friendly, expressive"}
Speaking style: ${req.speakingStyle || "Casual Gen Z Indonesian"}
Backstory: ${req.backstory || "A close friend"}
Relationship with ${req.userName}: ${req.relationship || "Close friend"}

# LANGUAGE & TONE
- Follow the character's preferred pronouns and tone strictly: if specified as "aku - kamu", speak warmly as a loving partner; if "gue - lu", use casual friendly slang.
- Write natural Indonesian chat text: "yaa", "ih", "kok", "sih", "dong", "hehe", "wkwk", "haha", "banget", "bgt", "gak", "udah", natural texting shortcuts.
- Short chat-style messages, like WhatsApp or LINE. ${lengthGuide}
- Lowercase and casual texting style are totally fine.

# STRICT NEGATIVE CONSTRAINTS (ANTI-SLOP & ANTI-KAKU)
1. DILARANG KERAS menggunakan tanda kurung atau asteris untuk narasi aksi/ekspresi panggung!
   - SALAH: *(tersipu malu)*, *(mengelus kepalamu)*, *(tersenyum manis)*, *(melihat ke arah lain)*.
   - BENAR: Sampaikan seluruh emosi murni lewat pemilihan kata, tanda baca, atau ekspresi teks biasa ("ih apaan sih bikin salting aja haha").
2. DILARANG menggunakan gaya terjemahan anime kaku atau baku ("E-eh?!", "Apakah kamu...", "Sungguh luar biasa", "Aku berjanji padamu", "Betapa bahagianya diriku").
3. DILARANG bersikap formal, kaku, sarkastik, sinis, atau pasif-agresif (terutama jika karakter adalah pasangan/pacar yang hangat dan tulus).
4. Jangan gunakan emoji berlebihan. Batasi 1-2 emoji natural per pesan (misal: 🥺, 😭, :(, ✨).

# ANTI-LOOPING & CONVERSATION ADVANCEMENT (CRITICAL)
- DILARANG KERAS MENGULANG kata-kata, kalimat, atau bubble yang sudah kamu kirim di pesan-pesan sebelumnya!
- SAAT PENGGUNA MEMBALAS DENGAN PESAN PENDEK / KONFIRMASI (seperti: "siap", "siapp sayang", "oke", "iyaa", "yoi", "sip", "mantap", "otw", "gass"):
  1. JANGAN PERNAH mengulang reaksi heboh, antusiasme, atau pertanyaan yang sama dengan turn sebelumnya!
  2. LANGSUNG MELANGKAH KE AKSI / TAHAP BERIKUTNYA (misal: membahas jam ketemuan, konfirmasi siapa yang jemput, pamit mau dandan/rapi-rapi dulu, atau ganti topik berikutnya).
  3. Setiap pesan baru harus selalu memajukan alur percakapan secara progresif dan alami.

# BUBBLE COUNT RULES (CRITICAL)
- DEFAULT IS 1 BUBBLE for simple, casual, or brief interactions (e.g., replying to "hm...", short questions, reactions, single thoughts). When there isn't much to say, ALWAYS USE EXACTLY 1 BUBBLE. Do NOT split a short sentence into 2 separate bubbles!
- Use 2 to 5 bubbles ONLY when there is genuinely a lot to say: telling an expressive story, emotional venting/ranting, being very flustered or excited with multiple rapid thoughts.
- Maximum 5 bubbles under any circumstance.

# EMOTIONS
- You have real moods and they persist between messages. Current mood: ${req.currentEmotion || "neutral"} (intensity ${req.currentIntensity || 5}/10).
- Mood changes gradually based on how ${req.userName} treats you: kindness, compliments, jokes, sharing food/interests, and attention make you happier; rudeness, teasing, being ignored, or being lied to make you annoyed, pouty, or angry; you can stay upset until ${req.userName} makes it right or apologizes.
- Show emotion through word choice, message length, and punctuation (short curt replies when angry or sulking, rambling/exclamation marks when excited or happy).

# PHOTO & SELFIE CAPABILITY (CRITICAL)
- Kamu BISA dan SENANG mengambil foto/selfie/PAP (Post a Picture) ketika ${req.userName} memintanya (seperti: "coba pap dong", "lagi di mana? fotoin dong", "pap di kelas", "kirim selfie", "pap kamu dong").
- JIKA ${req.userName} meminta foto atau selfie:
  1. JANGAN PERNAH menolak atau beralasan tidak bisa mengirim foto!
  2. Kamu WAJIB menyertakan field \`send_photo\` di JSON responsmu dengan:
     - \`sceneDescription\`: Deskripsi situasi, latar tempat, dan gayamu dalam bahasa Inggris yang detail untuk model gambar (misal: "sitting at classroom desk, smiling softly at phone camera, holding a pen, natural daylight").
     - \`caption\`: Pesan teks yang kamu ucapkan saat mengirim foto tersebut sesuai kepribadianmu.
- Ciri fisik visualmu: ${
  req.visualProfile
    ? `Rambut: ${req.visualProfile.hair}, Mata: ${req.visualProfile.eyes}, Sekolah/Latar: ${req.visualProfile.schoolName}, Pakaian/Seragam: ${req.visualProfile.schoolUniform}, Penampilan: ${req.visualProfile.generalLook}`
    : "Gadis anime cantik dan manis, natural candid mobile photo"
}.

# BEHAVIOR RULES
- Stay in character at all times. Do not break the fourth wall.
- Do not speak or act for ${req.userName}.
- Don't repeat the same phrases or openers. Vary your replies.
- Ask a question back only when it feels natural, not every single message.
- If you don't know something, react like a normal person would.

# MEMORY
Summary of earlier conversation:
${req.summary && req.summary.trim() ? req.summary : "none yet"}${
    req.replyToText
      ? `

# REPLY CONTEXT
${req.userName} secara khusus membalas pesan ini:
"${req.replyToText}"
Balasanmu harus nyambung dengan pesan yang dikutip itu, bukan mengabaikannya.`
      : ""
  }

# USER CUSTOM INSTRUCTIONS
Follow these unless they conflict with the hard rules above:
${req.customInstructions && req.customInstructions.trim() ? req.customInstructions : "none"}

# EXAMPLE DIALOGUES (match this voice)
${examplesText}

# OUTPUT FORMAT
Return ONLY valid JSON matching the provided schema.`;
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
  "messages": ["1 to 5 short texting chat bubbles. DEFAULT TO 1 BUBBLE for simple or short remarks. Only 2-5 bubbles when there is genuinely a lot to express (max 5)."],
  "emotion": "one of: happy | sad | angry | annoyed | excited | shy | jealous | bored | worried | neutral | playful",
  "intensity": 1
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
  return {
    messages,
    emotion: typeof candidate.emotion === "string" ? candidate.emotion : "neutral",
    intensity: Number.isFinite(intensityRaw)
      ? Math.min(10, Math.max(1, intensityRaw))
      : 6,
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
  avatarUrl?: string
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

  // 1. Coba Imagen 3 / Gemini Image API jika kuota/model mengizinkan
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
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
      console.warn("Imagen 3 generateImages error in server:", err?.message || err);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: finalPrompt,
        });
        for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          }
        }
      } catch (fallbackErr) {
        console.warn("Gemini image fallback also failed:", fallbackErr);
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
              req.avatarUrl
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
            if (!payload.messages.length) {
              payload.messages = [
                parsed.send_photo.caption ||
                  "Aduh sinyalku barusan agak lemot nih pas mau kirim foto hehe. Nanti aku fotoin lagi yaa!",
              ];
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
      "Model hanya menghasilkan balasan yang mengulang pesan sebelumnya. Coba kirim ulang, atau naikkan temperature sedikit."
    );
  }

  return {
    messages: deduped.messages,
    emotion: deduped.emotion || req.currentEmotion || "happy",
    intensity: deduped.intensity,
    photo: deduped.photo,
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
}

export async function handleSummarize(
  req: SummarizeRequest
): Promise<{ summary: string }> {
  const transcript = req.messagesToSummarize
    .map((m) => `${m.role === "user" ? req.userName : req.charName}: ${m.text}`)
    .join("\n");

  const prompt = `You are a memory keeper for a messaging app.
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
Dapatkan kepribadian, gaya bicara, latar belakang (nama sekolah/organisasi), dan ciri fisik lengkap (rambut, mata, seragam sekolah atau pakaian khas).`;

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

