import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { handleApiRequest } from "./server/apiRouter";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS — izinkan origin development lokal & WebView Capacitor (capacitor://localhost).
// Di production, ganti dengan URL backend kamu.
const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "capacitor://localhost",
  "https://localhost",
];

// Jika ada CORS_ALLOWED_ORIGINS di env, gunakan sebagai sumber kebenaran utama
if (process.env.CORS_ALLOWED_ORIGINS) {
  const custom = process.env.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  if (custom.length > 0) allowedOrigins.push(...custom);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Pre-flight untuk request OPTIONS (yang dikirim browser untuk endpoint CORS)
app.options("*", cors({
  origin: allowedOrigins,
  maxAge: 86400,
}));

// API routes handled by API router
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith("/api/")) {
    const handled = await handleApiRequest(req, res, next);
    if (!handled) {
      next();
    }
  } else {
    next();
  }
});

// Serve static assets from dist
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
