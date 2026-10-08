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
  photo?: {
    dataUrl: string;
    caption?: string;
  };
  updatedInstruction?: string;
  updatedSpeakingStyle?: string;
  preferredUserName?: string;
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
    imageModel: provider.imageModel || settings.imageModel || "gemini-3.1-flash-lite-image",
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
  // Batasi history pesan. Jika ringkasan memori (`chat.summary`) sudah ada,
  // 15 pesan terakhir sudah sangat cukup untuk alur aktif dan menghemat token AI.
  const historyLimit = chat.summary && chat.summary.trim() ? 15 : 25;
  const history = chat.messages.slice(-historyLimit).map((m) => ({
    role: (m.role === "user" ? "user" : "model") as "user" | "model",
    text: m.text,
  }));

  const provider = providerPayload(settings);

  const isEn = settings.language === "en";
  const locale = isEn ? "en-US" : "id-ID";

  // Perhitungan waktu saat ini & jeda dari pesan terakhir
  const now = Date.now();
  const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
  const lastMessageTimestamp = lastMsg ? lastMsg.timestamp : null;

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  const userLocalTimeString = new Date(now).toLocaleString(locale, {
    timeZone: userTimezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let lastMessageLocalTimeString: string | undefined = undefined;
  let timeElapsedText: string | undefined = undefined;

  if (lastMessageTimestamp) {
    lastMessageLocalTimeString = new Date(lastMessageTimestamp).toLocaleString(locale, {
      timeZone: userTimezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const elapsedMs = Math.max(0, now - lastMessageTimestamp);
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const elapsedHours = Math.floor(elapsedMs / (60 * 60 * 1000));
    const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

    if (isEn) {
      if (elapsedMinutes < 2) {
        timeElapsedText = "Just now (less than 2 minutes ago)";
      } else if (elapsedMinutes < 60) {
        timeElapsedText = `${elapsedMinutes} minutes ago`;
      } else if (elapsedHours < 24) {
        timeElapsedText = `${elapsedHours} hours ago`;
      } else {
        timeElapsedText = `${elapsedDays} days ago`;
      }
    } else {
      if (elapsedMinutes < 2) {
        timeElapsedText = "Baru saja (kurang dari 2 menit yang lalu)";
      } else if (elapsedMinutes < 60) {
        timeElapsedText = `${elapsedMinutes} menit yang lalu`;
      } else if (elapsedHours < 24) {
        timeElapsedText = `${elapsedHours} jam yang lalu`;
      } else {
        timeElapsedText = `${elapsedDays} hari yang lalu`;
      }
    }
  }

  const payload = {
    charName: character.name,
    userName: settings.userName || (isEn ? "You" : "Kamu"),
    userPersona: settings.userPersona,
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    backstory: character.backstory,
    relationship: character.relationship,
    currentEmotion: chat.currentMood.emotion,
    currentIntensity: chat.currentMood.intensity,
    summary: chat.summary,
    customInstructions: character.customInstructions,
    visualProfile: character.visualProfile,
    avatarUrl: character.avatarUrl,
    exampleDialogues: character.exampleDialogues,
    history,
    message: userMessage,
    model: provider.model,
    temperature: settings.temperature ?? 0.95,
    replyLength: settings.replyLength,
    apiKey: provider.apiKey,
    provider,
    language: settings.language || "id",
    currentTime: now,
    userLocalTimeString,
    userTimezone,
    lastMessageTimestamp,
    lastMessageLocalTimeString,
    timeElapsedText,
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
    const detail = errorBody.details || errorBody.error || `Server responded with status ${res.status}`;
    const err = new Error(detail) as any;
    err.status = res.status;
    throw err;
  }

  const data: SendMessageResult = await res.json();

  // Client-side fail-safe jika server atau LLM belum mengisi preferredUserName / updatedSpeakingStyle
  if (!data.updatedSpeakingStyle && !data.preferredUserName && userMessage) {
    const m = userMessage.trim();
    const matchId = m.match(
      /(?:(?:jangan\s+panggil\s+[^,]*,\s*)?(?:bisa\s+(?:ga|nggak|engga)\s+(?:kamu\s+)?)?(?:kalo\s+|kalau\s+)?(?:mulai\s+sekarang\s+)?(?:panggil|manggil)\s+aku\s+([a-zA-Z0-9_\s]{2,20}?)(?:\s+aja|\s+ya|\s+dong|\s+mulai\s+sekarang|\s+deh|\?|$))/i
    );
    if (matchId && matchId[1]) {
      const cleanNick = matchId[1].replace(/[.,!?]/g, "").trim();
      const bannedWords = ["apa", "gimana", "kenapa", "gitu", "begitu", "terus", "siapa", "kamu", "aku", "dong", "aja", "ya"];
      if (cleanNick && !bannedWords.includes(cleanNick.toLowerCase()) && cleanNick.length <= 15) {
        data.preferredUserName = cleanNick;
        data.updatedInstruction = `Selalu panggil pengguna dengan sebutan "${cleanNick}"`;
        const callRule = `Selalu panggil pengguna dengan sebutan "${cleanNick}".`;
        const curStyle = character.speakingStyle || "";
        const cleaned = curStyle.replace(/(?:Selalu )?panggil pengguna dengan sebutan "[^"]*"\.?\s*/gi, "").trim();
        data.updatedSpeakingStyle = `${callRule} ${cleaned}`.trim();
      }
    }
  }

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
    userName: settings.userName || (settings.language === "en" ? "You" : "Kamu"),
    existingSummary: chat.summary,
    messagesToSummarize: messagesToSummarize.map((m) => ({
      role: m.role,
      text: m.text,
    })),
    provider: providerPayload(settings),
    language: settings.language || "id",
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

/**
 * Memeriksa apakah terjadi pergantian hari dan obrolan dari hari kemarin/sebelumnya
 * belum dirangkum ke dalam memori karakter (`chat.summary`).
 * Dijalankan di background tanpa memblokir obrolan pengguna.
 */
export async function checkAndAutoSummarizeDayTransition({
  character,
  chat,
  settings,
  onUpdateChat,
}: {
  character: Character;
  chat: Chat;
  settings: Settings;
  onUpdateChat?: (updatedChat: Chat) => void;
}): Promise<Chat> {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  // Ambil semua pesan yang dikirim sebelum hari ini (kemarin atau sebelumnya)
  const pastDaysMessages = chat.messages.filter((m) => m.timestamp < startOfToday);

  // Jika pesan dari hari sebelumnya kurang dari 3 pesan, tidak perlu dirangkum
  if (pastDaysMessages.length < 3) {
    return chat;
  }

  // Pesan terakhir dari masa lalu (kemarin)
  const lastPastMessage = pastDaysMessages[pastDaysMessages.length - 1];

  // Jika pesan kemarin ini sudah pernah dirangkum, jangan panggil AI lagi (hemat token!)
  if (chat.lastSummarizedMessageId === lastPastMessage.id) {
    return chat;
  }

  try {
    const payload = {
      charName: character.name,
      userName: settings.userName || (settings.language === "en" ? "You" : "Kamu"),
      existingSummary: chat.summary || "",
      messagesToSummarize: pastDaysMessages.map((m) => ({
        role: m.role,
        text: m.text,
      })),
      provider: providerPayload(settings),
      language: settings.language || "id",
    };

    const res = await fetch(apiUrl("summarize"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Auto-summarize failed with status:", res.status);
      return chat;
    }

    const data = await res.json();
    const newSummary = (data.summary || "").trim();

    if (newSummary && newSummary !== chat.summary) {
      const updatedChat: Chat = {
        ...chat,
        summary: newSummary,
        lastSummarizedMessageId: lastPastMessage.id,
        lastSummarizedDate: todayStr,
      };

      if (onUpdateChat) {
        onUpdateChat(updatedChat);
      }
      return updatedChat;
    }
  } catch (err) {
    console.warn("Auto-summarize exception:", err);
  }

  return chat;
}

