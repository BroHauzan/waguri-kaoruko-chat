import { Character, Chat, Settings } from "../types";
import { getActiveProvider } from "./providers";

/** Bentuk minimal gambar yang dibutuhkan pengiriman. Sengaja tidak memakai
 *  `ImageAttachment` penuh: antrean latar belakang hanya menyimpan base64,
 *  tanpa dataUrl, supaya payload IndexedDB tidak membengkak. */
export interface SendableImage {
  base64: string;
  mimeType: string;
}

export interface SendMessageParams {
  character: Character;
  chat: Chat;
  userMessage: string;
  settings: Settings;
  /** Gambar yang dilampirkan ke pesan ini, kalau ada. */
  image?: SendableImage | null;
  /** Rekaman suara yang dilampirkan, kalau ada. Selalu WAV. */
  audio?: { base64: string; mimeType: string } | null;
  /** Pesan yang sedang dibalas, kalau user memakai fitur reply. */
  replyToText?: string | null;
}

export interface SendMessageResult {
  messages: string[];
  emotion: string;
  intensity: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/** Konfigurasi provider aktif, dikirim ke server per-request. */
function providerPayload(settings: Settings) {
  const provider = getActiveProvider(settings);
  return {
    type: provider.type,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    model: provider.model || settings.model,
  };
}

/** Helper untuk membangun URL API dengan base URL yang mungkin dikonfigurasi. */
function apiUrl(path: string) {
  return `${API_BASE}/api/${path}`;
}

export async function sendMessageToGemini({
  character,
  chat,
  userMessage,
  settings,
  image,
  audio,
  replyToText,
}: SendMessageParams): Promise<SendMessageResult> {
  // Format last 25 messages as history for Gemini (mapping role: char -> model)
  const history = chat.messages.slice(-25).map((m) => ({
    role: (m.role === "user" ? "user" : "model") as "user" | "model",
    text: m.text,
  }));

  const provider = providerPayload(settings);

  const payload = {
    charName: character.name,
    userName: settings.userName || "Kamu",
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    backstory: character.backstory,
    relationship: character.relationship,
    currentEmotion: chat.currentMood.emotion,
    currentIntensity: chat.currentMood.intensity,
    summary: chat.summary,
    customInstructions: character.customInstructions,
    exampleDialogues: character.exampleDialogues,
    history,
    message: userMessage,
    model: provider.model,
    temperature: settings.temperature ?? 0.95,
    replyLength: settings.replyLength,
    apiKey: provider.apiKey,
    provider,
    // Hanya kirim data mentahnya — dataUrl penuh terlalu besar untuk payload.
    image: image
      ? { base64: image.base64, mimeType: image.mimeType }
      : undefined,
    audio: audio
      ? { base64: audio.base64, mimeType: audio.mimeType }
      : undefined,
    replyToText: replyToText || undefined,
  };

  // Timeout di sisi klien. Tanpa ini, server yang menggantung membuat UI
  // menampilkan "sedang mengetik" tanpa akhir dan user tidak pernah tahu
  // ada yang salah. Payload bergambar lebih besar, jadi beri ruang lebih.
  const timeoutMs = image ? 90_000 : 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(apiUrl("chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        `Server tidak merespons dalam ${Math.round(
          timeoutMs / 1000
        )} detik. Coba lagi, atau kirim gambar yang lebih kecil.`
      );
    }
    throw new Error(
      `Gagal menghubungi server. Pastikan \`npm run dev\` masih berjalan. Detail: ${
        err?.message || err
      }`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    // `details` carries the actionable reason (e.g. missing API key);
    // `error` is the generic label. Prefer the specific one.
    throw new Error(
      errorBody.details || errorBody.error || `Server responded with status ${res.status}`
    );
  }

  const data = await res.json();
  return data;
}

export async function triggerSummarizeMemory({
  character,
  chat,
  settings,
}: {
  character: Character;
  chat: Chat;
  settings: Settings;
}): Promise<string> {
  // Take older messages to summarize (e.g. from start up to the last 15 messages)
  const messagesToSummarize = chat.messages.slice(0, Math.max(1, chat.messages.length - 15));
  if (messagesToSummarize.length < 6) {
    return chat.summary || "";
  }

  const payload = {
    charName: character.name,
    userName: settings.userName || "Kamu",
    existingSummary: chat.summary,
    messagesToSummarize: messagesToSummarize.map((m) => ({
      role: m.role,
      text: m.text,
    })),
    provider: providerPayload(settings),
  };

  const res = await fetch(apiUrl("summarize"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn("Failed to summarize chat memory:", res.status);
    return chat.summary || "";
  }

  const data = await res.json();
  return data.summary || chat.summary || "";
}
