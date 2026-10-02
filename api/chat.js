import { handleChatTurn } from "../server/geminiService";

export default async function handler(req, res) {
  // CORS headers untuk Capacitor WebView
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await handleChatTurn(req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error("API /api/chat error:", err);
    // Return detailed error for debugging
    return res.status(500).json({
      error: "Failed to generate chat response",
      details: err?.message || String(err),
      stack: err?.stack
    });
  }
}