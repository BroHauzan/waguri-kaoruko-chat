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

/** Batas ukuran body request. Payload berisi gambar base64 bisa besar,
 *  jadi longgar — tapi tetap dibatasi supaya request raksasa tidak
 *  menghabiskan memori server. */
const MAX_BODY_BYTES = 25 * 1024 * 1024; // 25 MB

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let aborted = false;

    req.on("data", (chunk) => {
      if (aborted) return;
      bytes += chunk.length;

      if (bytes > MAX_BODY_BYTES) {
        aborted = true;
        reject(
          new Error(
            `Payload terlalu besar (${Math.round(
              bytes / 1024 / 1024
            )} MB). Maksimal ${Math.round(MAX_BODY_BYTES / 1024 / 1024)} MB.`
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

  if (url === "/api/chat" && req.method === "POST") {
    try {
      const body = await parseJsonBody<ChatTurnRequest>(req);
      const result = await handleChatTurn(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/chat error:", err);
      sendJsonResponse(res, 500, {
        error: "Failed to generate chat response",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/summarize" && req.method === "POST") {
    try {
      const body = await parseJsonBody<SummarizeRequest>(req);
      const result = await handleSummarize(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/summarize error:", err);
      sendJsonResponse(res, 500, {
        error: "Failed to summarize chat",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/lore" && req.method === "POST") {
    try {
      const body = await parseJsonBody<LoreRequest>(req);
      const result = await handleFetchLore(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/lore error:", err);
      sendJsonResponse(res, 500, {
        error: "Failed to fetch character lore",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  if (url === "/api/photo" && req.method === "POST") {
    try {
      const body = await parseJsonBody<GeneratePhotoApiRequest>(req);
      const result = await handleGeneratePhoto(body);
      sendJsonResponse(res, 200, result);
    } catch (err: any) {
      console.error("API /api/photo error:", err);
      sendJsonResponse(res, 500, {
        error: "Failed to generate character photo",
        details: err?.message || String(err),
      });
    }
    return true;
  }

  return false;
}
