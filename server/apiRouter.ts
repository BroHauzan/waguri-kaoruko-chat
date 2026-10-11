import type { IncomingMessage, ServerResponse } from "http";
import {
  handleChatTurn,
  handleSummarize,
  handleFetchLore,
  handleGeneratePhoto,
  ChatTurnRequest,
  SummarizeRequest,
  LoreRequest,
  GeneratePhotoApiRequest,
} from "./geminiService";

/** Batas ukuran body request. */
const MAX_CHAT_BODY_BYTES = 10 * 1024 * 1024; // 10 MB (cukup untuk audio/gambar base64)
const MAX_TEXT_BODY_BYTES = 1 * 1024 * 1024;  // 1 MB (untuk summarize/lore)

// Simple in-memory rate limiter per IP
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 35; // Maksimal 35 request per menit per IP

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipRequestHistory.set(ip, recent);

  // Bersihkan key lama jika map terlalu besar
  if (ipRequestHistory.size > 1000) {
    for (const [key, tsList] of ipRequestHistory.entries()) {
      if (tsList.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(key);
      }
    }
  }

  return false;
}

function parseJsonBody<T>(req: IncomingMessage, maxBytes: number = MAX_CHAT_BODY_BYTES): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let aborted = false;

    req.on("data", (chunk) => {
      if (aborted) return;
      bytes += chunk.length;

      if (bytes > maxBytes) {
        aborted = true;
        reject(
          new Error(
            `Payload terlalu besar (${Math.round(
              bytes / 1024 / 1024
            )} MB). Maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`
          )
        );
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      if (aborted) return;
      try {
        if (!body) {
          resolve({} as T);
        } else {
          resolve(JSON.parse(body) as T);
        }
      } catch (err) {
        reject(new Error("Body request bukan JSON yang valid."));
      }
    });

    req.on("error", (err) => {
      if (aborted) return;
      aborted = true;
      reject(err);
    });
  });
}

function sendJsonResponse(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): Promise<boolean> {
  const url = req.url?.split("?")[0] || "";

  if (url === "/api/health") {
    sendJsonResponse(res, 200, { status: "ok", timestamp: Date.now() });
    return true;
  }

  const clientIp = getClientIp(req);
  if (url.startsWith("/api/") && req.method === "POST" && isRateLimited(clientIp)) {
    sendJsonResponse(res, 429, {
      error: "Too Many Requests",
      details: "Batas frekuensi permintaan terlampaui. Silakan tunggu beberapa saat.",
    });
    return true;
  }

  if (url === "/api/chat" && req.method === "POST") {
    try {
      const body = await parseJsonBody<ChatTurnRequest>(req, MAX_CHAT_BODY_BYTES);
      const result = await handleChatTurn(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/chat error:", err);
      const statusCode = err?.status || (err?.message?.includes("429") ? 429 : 500);
      sendJsonResponse(res, statusCode, {
        error: "Failed to generate chat response",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/summarize" && req.method === "POST") {
    try {
      const body = await parseJsonBody<SummarizeRequest>(req, MAX_TEXT_BODY_BYTES);
      const result = await handleSummarize(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/summarize error:", err);
      const statusCode = err?.status || (err?.message?.includes("429") ? 429 : 500);
      sendJsonResponse(res, statusCode, {
        error: "Failed to summarize chat",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/lore" && req.method === "POST") {
    try {
      const body = await parseJsonBody<LoreRequest>(req, MAX_TEXT_BODY_BYTES);
      const result = await handleFetchLore(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/lore error:", err);
      const statusCode = err?.status || (err?.message?.includes("429") ? 429 : 500);
      sendJsonResponse(res, statusCode, {
        error: "Failed to fetch character lore",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/photo" && req.method === "POST") {
    try {
      const body = await parseJsonBody<GeneratePhotoApiRequest>(req, MAX_CHAT_BODY_BYTES);
      const result = await handleGeneratePhoto(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/photo error:", err);
      const statusCode = err?.status || (err?.message?.includes("429") ? 429 : 500);
      sendJsonResponse(res, statusCode, {
        error: "Failed to generate character photo",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  return false;
}
