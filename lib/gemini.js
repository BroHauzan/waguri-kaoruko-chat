import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

// ============================================================
// Helpers
// ============================================================

export function extractJson(text) {
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

export function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw.messages ? raw : raw.response || raw.data || raw.result;
  if (!candidate || !Array.isArray(candidate.messages)) return null;
  const messages = candidate.messages
    .map((m) => String(m).trim())
    .filter((m) => m.length > 0);
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

export function dropRepeatedBubbles(payload, history) {
  const recentModelTexts = history
    .filter((h) => h.role === "model")
    .slice(-6)
    .map((h) => h.text.trim().toLowerCase().replace(/[^\w\s]/g, ""));
  const fresh = [];
  const seenInTurn = new Set();
  for (const rawMsg of payload.messages) {
    const trimmed = rawMsg.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/[^\w\s]/g, "");
    if (seenInTurn.has(normalized)) continue;
    seenInTurn.add(normalized);
    const isDuplicateOfHistory = recentModelTexts.some((prev) => {
      if (prev.length <= 10) return false;
      if (prev === normalized) return true;
      const longEnough = normalized.length >= 20;
      if (!longEnough) return false;
      return prev.includes(normalized) || normalized.includes(prev);
    });
    if (!isDuplicateOfHistory) fresh.push(trimmed);
  }
  if (fresh.length === 0) {
    return { ...payload, messages: [] };
  }
  return { ...payload, messages: fresh };
}

// ============================================================
// Prompt building
// ============================================================

export function buildSystemInstruction(req) {
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

export function buildOpenAIMessages(req) {
  const messages = [{ role: "system", content: "" }];
  for (const item of req.history.slice(-25)) {
    messages.push({
      role: item.role === "user" ? "user" : "assistant",
      content: item.text,
    });
  }
  const hasImage = Boolean(req.image?.base64);
  const hasAudio = Boolean(req.audio?.base64);
  if (hasImage || hasAudio) {
    const parts = [];
    if (req.message.trim()) parts.push({ type: "text", text: req.message });
    if (hasImage && req.image) {
      parts.push({
        type: "image_url",
        image_url: { url: `data:${req.image.mimeType};base64,${req.image.base64}` },
      });
    }
    if (hasAudio && req.audio) {
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

export const IMAGE_INSTRUCTION =
  "\n\n# IMAGE INPUT\nPesan terakhir dari pengguna menyertakan sebuah GAMBAR. Lihat gambarnya dengan saksama dan tanggapi isinya secara natural sesuai karaktermu — komentari apa yang benar-benar terlihat di gambar (orang, benda, makanan, tempat, teks, suasana). Jangan mengabaikan gambarnya, jangan mengarang isi yang tidak ada, dan jangan menyebut bahwa kamu menerima \"file\" atau \"lampiran\".";

export const AUDIO_INSTRUCTION =
  "\n\n# VOICE MESSAGE INPUT\nPesan terakhir dari pengguna adalah PESAN SUARA. Dengarkan isinya dan tanggapi seperti orang yang baru mendengar ucapan langsung — jawab ISI pembicaraannya (pertanyaan, cerita, atau perasaannya), bukan sekadar mengakui bahwa kamu menerima suara. Jangan menyebut \"voice note\", \"rekaman\", \"audio\", atau \"transkrip\". Kalau ucapannya kurang jelas, minta diulang dengan santai.";

export const RESPONSE_SCHEMA_HINT = `{
  "messages": ["1 to 5 short texting chat bubbles. DEFAULT TO 1 BUBBLE for simple or short remarks. Only 2-5 bubbles when there is genuinely a lot to express (max 5)."],
  "emotion": "one of: happy | sad | angry | annoyed | excited | shy | jealous | bored | worried | neutral | playful",
  "intensity": 1
}`;

// ============================================================
// Gemini Provider & Photo Helper
// ============================================================

async function generatePhotoHelper(charName, visualProfile, sceneDescription, apiKey, avatarUrl, imageModel) {
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

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    const ai = new GoogleGenAI({ apiKey });

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
      } catch (err) {
        console.warn(`${selectedImageModel} generateImages error in lib/gemini.js:`, err?.message || err);
      }
    } else {
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
      } catch (geminiImgErr) {
        console.warn(`${selectedImageModel} generateContent error in lib/gemini.js:`, geminiImgErr?.message || geminiImgErr);
      }
    }

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
        console.warn("Secondary image fallback failed in lib/gemini.js:", fallbackErr);
      }
    }
  }

  // 2. Fallback: jika avatarUrl dikirim dan berupa dataUrl base64, gunakan avatar karakter
  if (avatarUrl && avatarUrl.startsWith("data:image")) {
    return avatarUrl;
  }

  // 3. Fallback: gunakan foto lokal karakter dari folder public
  try {
    const publicPfpPath = path.resolve(process.cwd(), "public/waguri-pfp.jpg");
    if (fs.existsSync(publicPfpPath)) {
      const buf = fs.readFileSync(publicPfpPath);
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
  } catch (fsErr) {
    console.warn("Could not read local fallback image in lib/gemini.js:", fsErr);
  }

  throw new Error("Gagal menghasilkan foto karakter.");
}

export async function callGemini(req, cfg, systemInstruction, temperature) {
  const apiKey = (cfg.apiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY belum diset. Set di Vercel Dashboard → Settings → Environment Variables."
    );
  }
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" }, timeout: 60000 },
  });
  const requestedModel = cfg.model?.trim() || GEMINI_DEFAULT_MODEL;
  const candidateModels = Array.from(new Set([requestedModel, GEMINI_DEFAULT_MODEL]));
  const contents = [];
  for (const item of req.history.slice(-25)) {
    contents.push({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.text }],
    });
  }
  const attachmentParts = [];
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
    const parts = [];
    if (req.message.trim()) parts.push({ text: req.message });
    parts.push(...attachmentParts);
    contents.push({ role: "user", parts });
  } else {
    contents.push({ role: "user", parts: [{ text: req.message }] });
  }
  let lastError = null;
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
                        "Deskripsi situasi/tempat/latar foto dalam bahasa Inggris untuk Imagen 3.",
                    },
                    caption: {
                      type: Type.STRING,
                      description:
                        "Pesan teks yang diucapkan karakter saat mengirim foto ini.",
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
          } catch (photoErr) {
            console.warn("Generating character photo failed gracefully:", photoErr);
            if (!payload.messages.length) {
              payload.messages = [
                parsed.send_photo.caption ||
                  "Aduh sinyalku barusan agak lemot nih pas mau kirim foto hehe. Nanti aku fotoin lagi yaa!",
              ];
            }
          }
        }

        return payload;
      } catch (error) {
        lastError = error;
        if (error?.status !== 503 && error?.status !== 429) break;
      }
    }
  }
  throw lastError || new Error("Semua model Gemini gagal dipanggil.");
}

// ============================================================
// OpenAI-compatible Provider
// ============================================================

export async function callOpenAICompatible(req, cfg, systemInstruction, temperature) {
  const baseUrl = (cfg.baseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Base URL provider belum diisi. Contoh: https://openrouter.ai/api/v1");
  }
  const apiKey = (cfg.apiKey || "").trim();
  if (!apiKey) throw new Error("API key provider belum diisi.");
  const model = (cfg.model || "").trim();
  if (!model) throw new Error("Nama model provider belum diisi.");
  const url = `${baseUrl}/chat/completions`;
  const messages = buildOpenAIMessages(req);
  messages[0].content = systemInstruction;
  messages[0].content += `\n\nReturn ONLY a valid JSON object with this exact shape, no markdown fences, no extra text:\n${RESPONSE_SCHEMA_HINT}`;
  const attempt = async (useJsonMode) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });
    } catch (err) {
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
  let res = await attempt(true);
  if (res.status === 400) res = await attempt(false);
  const rawText = await res.text();
  if (!res.ok) {
    let detail = rawText.slice(0, 400);
    try {
      const parsedErr = JSON.parse(rawText);
      detail = parsedErr?.error?.message || parsedErr?.message || detail;
    } catch {}
    throw new Error(`Provider menolak permintaan (HTTP ${res.status}): ${detail}`);
  }
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(`Respons provider bukan JSON yang valid. Potongan awal: ${rawText.slice(0, 200)}`);
  }
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Respons provider tidak berisi teks balasan.");
  }
  const parsed = JSON.parse(extractJson(content));
  const payload = normalizePayload(parsed);
  if (!payload) {
    throw new Error(
      `Model tidak mengembalikan format JSON yang diminta. Responsnya: ${content.slice(0, 200)}`
    );
  }
  return payload;
}

// ============================================================
// Entry Points
// ============================================================

export async function handleChatTurn(req) {
  const cfg = req.provider || { type: "gemini" };
  let systemInstruction = buildSystemInstruction(req);
  if (req.image?.base64) systemInstruction += IMAGE_INSTRUCTION;
  if (req.audio?.base64) systemInstruction += AUDIO_INSTRUCTION;
  const temperature = typeof req.temperature === "number" ? req.temperature : 0.95;
  let payload;
  if (cfg.type === "openai-compatible") {
    payload = await callOpenAICompatible(req, cfg, systemInstruction, temperature);
  } else {
    payload = await callGemini(req, cfg, systemInstruction, temperature);
  }
  const deduped = dropRepeatedBubbles(payload, req.history);
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

export async function handleSummarize(req) {
  const transcript = req.messagesToSummarize
    .map((m) => `${m.role === "user" ? req.userName : req.charName}: ${m.text}`)
    .join("\n");
  const prompt = `You are a memory keeper for a messaging app.
Conversation transcript between ${req.charName} and ${req.userName}:
${transcript}

${req.existingSummary ? `Previous Memory Summary:\n${req.existingSummary}\n` : ""}

Task: Write a concise 2-4 sentence summary of what was discussed, personal details shared, inside jokes, and relational mood changes. Focus on key memories so ${req.charName} remembers them in future chats. Write directly in Indonesian. Keep it factual and brief.`;
  const cfg = req.provider || { type: "gemini" };
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
      });
      if (!res.ok) return { summary: req.existingSummary || "" };
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      return { summary: typeof text === "string" && text.trim() ? text.trim() : req.existingSummary || "" };
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

export async function handleFetchLore(req) {
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
  } catch (searchGroundingErr) {
    console.warn("Search Grounding attempt failed, falling back to gemini-3.1-flash-lite...", searchGroundingErr?.message || searchGroundingErr);
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

export async function handleGeneratePhoto(req) {
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

