# Waguri Kaoruko — AI Character Chat

Aplikasi chat AI berbasis web untuk karakter **Waguri Kaoruko** (dari anime/manga *Kanojo mo Kanojo*). Dibangun dengan React + Vite + Tailwind CSS, backend API pakai Vercel Functions (Gemini) atau server lokal (Express).

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Chat Real-time** | Balasan streaming bubble-per-bubble dengan typing indicator |
| **Multi-Provider AI** | Built-in Gemini + Custom OpenAI-compatible (OpenRouter, Ollama, dll) |
| **Kirim Gambar** | Upload foto → AI "melihat" dan merespons isi gambar |
| **Voice Note** | Rekam suara (WAV 16kHz mono) → AI transkrip & balas isi ucapan |
| **Reply & Quote** | Swipe kanan untuk reply, long-press untuk context menu |
| **Read Receipts** | Centang 1 = terkirim, Centang 2 (amber) = dibaca |
| **Emoji Picker** | 400+ emoji, kategori + search |
| **Custom Instructions** | Atur gaya bicara, aturan khusus per karakter |
| **Memory & Summary** | Ringkasan percakapan otomatis untuk konteks jangka panjang |
| **Dark/Light Mode** | Otomatis mengikuti sistem / manual toggle |
| **PWA Ready** | Installable, service worker (notif di browser) |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Motion (Framer Motion) |
| **State** | React hooks + localStorage (chat history) + IndexedDB (background queue) |
| **Backend (Dev)** | Express + TypeScript (`server.ts`) — jalan di port 3001 |
| **Backend (Prod)** | Vercel Functions (`api/chat.js`, `api/summarize.js`) — Node.js 20 |
| **AI** | Google Gemini (`@google/genai`), support OpenAI-compatible API |
| **Audio** | Web Audio API → WAV 16kHz mono conversion di browser |
| **Build** | `npm run build` → output `dist/` (static SPA) |
| **Deploy** | Vercel (auto-deploy dari GitHub) |

---

## 🚀 Quick Start (Development)

### Prasyarat
- Node.js 20+
- npm / pnpm / yarn

### Install
```bash
git clone https://github.com/BroHauzan/waguri-kaoruko-chat.git
cd waguri-kaoruko-chat
npm install
```

### Environment
Buat file `.env` di root:
```env
# API Key Gemini (wajib)
GEMINI_API_KEY=AQ.xxxxxxxxxxxx

# Kosongkan untuk dev lokal (pakai proxy /api ke server.ts:3001)
VITE_API_BASE_URL=""

# URL app (opsional)
APP_URL=http://localhost:3000
```

### Jalankan (butuh 2 terminal)

**Terminal 1 — Backend API (port 3001):**
```bash
npm run start
# Server listening on port 3001
```

**Terminal 2 — Frontend (port 3000 + proxy):**
```bash
npm run dev
# Vite running on http://localhost:3000
```

Buka browser: **http://localhost:3000**

---

## 📦 Build Production

```bash
npm run build
# Output di folder dist/
```

Deploy ke Vercel:
1. Push ke GitHub
2. Import project di Vercel Dashboard
3. Set Environment Variable: `GEMINI_API_KEY` (Production + Preview + Development)
4. Deploy — selesai!

---

## 📁 Struktur Project

```
waguri-kaoruko-chat/
├── api/                    # Vercel Functions
│   ├── chat.js             # POST /api/chat
│   ├── summarize.js        # POST /api/summarize
│   └── lib/gemini.js       # Shared Gemini logic (ESM)
├── lib/                    # Shared untuk Vercel (copy dari server/)
├── server/                 # Local dev server (Express)
│   ├── apiRouter.ts        # Route handler
│   └── geminiService.ts    # Full Gemini logic (TypeScript)
├── src/
│   ├── components/         # React components
│   ├── lib/                # Client utils (geminiClient, storage, audio, image)
│   ├── types/              # TypeScript types
│   └── main.tsx            # Entry point
├── .env                    # Local env (VITE_API_BASE_URL="")
├── .env.example
├── vercel.json             # Vercel config (proxy, rewrites)
├── package.json
├── vite.config.ts          # Vite + proxy /api -> localhost:3001
└── server.ts               # Express dev server (port 3001)
```

---

## 🔧 Scripts

| Command | Fungsi |
|---------|--------|
| `npm run dev` | Frontend dev server (port 3000, proxy `/api` → 3001) |
| `npm run start` | Backend Express server (port 3001) |
| `npm run build` | Build production ke `dist/` |
| `npm run preview` | Preview build production |
| `npm run lint` | TypeScript type-check |

---

## 🌐 Deploy ke Vercel (Production)

1. **Push ke GitHub** → repo public/private
2. **Vercel Dashboard** → Import Project
3. **Environment Variables** → Tambah:
   - `GEMINI_API_KEY` = key Gemini kamu (centang Production, Preview, Development)
4. **Deploy** → Dapat URL `https://<project>.vercel.app`

**API Endpoints:**
- `POST /api/chat` — Kirim pesan (support text, image, audio, reply)
- `POST /api/summarize` — Ringkasan percakapan

---

## 🎯 Custom Provider (OpenAI-compatible)

Di UI: **Pengaturan → Provider AI** → Tambah provider:
- **Type**: `openai-compatible`
- **Base URL**: Contoh `https://openrouter.ai/api/v1` atau `http://localhost:11434/v1` (Ollama)
- **API Key**: Key provider
- **Model**: Nama model (misal `openrouter/auto`, `llama3.2`, dll)

---

## 📝 License

MIT License — bebas dipakai, dimodifikasi, didistribusikan.

---

## 🙏 Credits

- **Character**: Waguri Kaoruko (由 *Kanojo mo Kanojo* / *Girlfriend, Girlfriend*)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Animation**: Motion (Framer Motion)
- **Styling**: Tailwind CSS v4

---

**Dibuat dengan ❤️ untuk komunitas fans Kaoruko.**