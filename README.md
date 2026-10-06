# Waguri Kaoruko — AI Character Chat

Aplikasi chat AI interaktif berbasis web untuk karakter **Waguri Kaoruko** (dari anime/manga *The Fragrant Flower Blooms with Dignity* / *Kaoru Hana wa Rin to Saku* & *Kanojo mo Kanojo*). Dibangun dengan React + Vite + Tailwind CSS, backend API pakai Vercel Functions (Gemini) atau server lokal (Express).

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Chat Real-time & Responsif** | Balasan streaming bubble-per-bubble dengan typing indicator halus dan auto-scroll yang nyaman |
| **Auto-Growing Input (WhatsApp-Style)** | Kolom chat elastis dinamis (1–5 baris teks) yang membesar dan menciut otomatis tanpa teks terpotong |
| **Kamera Langsung & Galeri (WhatsApp-Style)** | Pop-up menu untuk mengambil foto langsung dari kamera HP (`capture="environment"`) atau memilih dari galeri |
| **Kompresi Gambar Otomatis** | Gambar dari kamera atau galeri dikompresi otomatis di sisi browser sebelum dikirim untuk menghemat bandwidth |
| **Upload Foto Profil Karakter** | Dukungan upload foto langsung dari galeri lokal dengan auto-compress selain input URL gambar |
| **Multi-Bahasa (i18n)** | Pilihan bahasa tampilan antarmuka: **Bahasa Indonesia** dan **English** |
| **Mode Tampilan (Theme)** | Pilihan tema **Terang (Light)**, **Gelap (Dark)**, atau **Otomatis (Auto)** yang sinkron langsung dengan tema perangkat |
| **Minimalist Mood Indicator** | Indikator emosi karakter yang bersih dan minimalis tanpa elemen dekoratif berlebih (*anti-slop design*) |
| **Voice Note (Pesan Suara)** | Rekam suara (WAV 16kHz mono) → AI transkrip & balas isi percakapan |
| **Reply & Quote Message** | Geser pesan ke kanan untuk membalas (*swipe-to-reply*) atau *long-press* untuk context menu |
| **Read Receipts** | Centang satu = terkirim, Centang ganda = tersampaikan/dibaca |
| **Multi-Provider AI & Dual Model** | Built-in Google Gemini API + Custom OpenAI-compatible dengan pemisahan Model Teks (default: `gemini-3.1-flash-lite`) dan Model Khusus Gambar/PAP (default: `gemini-3.1-flash-lite-image`) |
| **Auto-Fetch Lore (Search Grounding)** | Riset otomatis biodata kanon, kepribadian, gaya bicara, dan profil visual karakter dari internet via Google Search Grounding |
| **In-Character Photo / PAP (Dual Model)** | AI dapat mengirim foto selfie/PAP karakter portrait (9:16) saat diminta user menggunakan model generasi gambar khusus & referensi profil visual |
| **Hierarki Pengaturan WhatsApp-Style** | Tata letak pengaturan terpusat dengan top action bar, profile header tengah, dan flat list menu bersih dengan modal terpadu |
| **PWA Ready & Notifikasi** | Installable di homescreen mobile/desktop dengan dukungan push-like notification banner |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Motion (Framer Motion), Lucide React |
| **State & Storage** | React hooks, LocalStorage (riwayat chat & settings), IndexedDB (antrean background processor) |
| **Backend (Dev)** | Express + TypeScript (`server.ts`) — port 3001 |
| **Backend (Prod)** | Vercel Serverless Functions (`api/chat.js`, `api/summarize.js`) — Node.js 20 ESM |
| **AI Integration** | Google Gemini SDK (`@google/genai`) & OpenAI-Compatible REST client |
| **Audio & Media** | Web Audio API (downsampling WAV mono 16kHz) & HTML5 Canvas Image Resizer/Compressor |

---

## 🚀 Quick Start (Development)

### Prasyarat
- Node.js 20+
- npm / pnpm / yarn

### 1. Clone & Install
```bash
git clone https://github.com/BroHauzan/waguri-kaoruko-chat.git
cd waguri-kaoruko-chat
npm install
```

### 2. Konfigurasi Environment
Buat file `.env` di direktori root:
```env
# API Key Gemini dari Google AI Studio (wajib)
GEMINI_API_KEY=AIzaSy...

# Kosongkan untuk dev lokal (otomatis proxy /api ke server.ts:3001)
VITE_API_BASE_URL=""

# URL aplikasi (opsional)
APP_URL=http://localhost:3000
```

### 3. Menjalankan Server Lokal (2 Terminal)

**Terminal 1 — Backend Express API (port 3001):**
```bash
npm run start
# Server API aktif di http://localhost:3001
```

**Terminal 2 — Frontend Vite Client (port 3000):**
```bash
npm run dev
# Vite aktif di http://localhost:3000
```

Buka browser kamu di: **http://localhost:3000**

---

## 📦 Build & Production

```bash
# Jalankan kompilasi TypeScript dan bundling Vite
npm run build
```
Output hasil build akan berada di direktori `dist/` sebagai Static SPA.

---

## 🌐 Panduan Deploy ke Vercel

1. Push repository ke GitHub.
2. Buka dashboard [Vercel](https://vercel.com/) dan pilih **Add New Project** → Import repo ini.
3. Konfigurasikan **Environment Variables**:
   - `GEMINI_API_KEY`: Masukkan API Key Gemini kamu (centang Production, Preview, Development).
4. Klik **Deploy**. Selesai!

### Serverless Endpoints:
- `POST /api/chat` — Menangani interaksi chat (teks, gambar, audio, reply).
- `POST /api/summarize` — Menangani pembuatan rangkuman memori percakapan.

---

## 📁 Struktur Direktori

```
waguri-kaoruko-chat/
├── api/                    # Vercel Serverless Functions
│   ├── chat.js             # Handler POST /api/chat
│   ├── summarize.js        # Handler POST /api/summarize
│   └── lib/gemini.js       # Core Gemini logic untuk Vercel
├── server/                 # Backend lokal Express (Development)
│   ├── apiRouter.ts        # Route handler API
│   └── geminiService.ts    # Service logic Gemini & provider
├── src/
│   ├── components/         # Komponen React (Chat, Picker, Forms, dll.)
│   │   ├── ChatImagePicker.tsx       # Ambil foto kamera langsung & galeri
│   │   ├── ChatScreen.tsx            # Layar obrolan & input auto-growing
│   │   ├── SettingsScreen.tsx        # Pengaturan tema, bahasa, akun
│   │   └── ...
│   ├── lib/                # Helper & utility client
│   │   ├── i18n.ts                   # Modul kamus multi-bahasa (ID/EN)
│   │   ├── imageUtils.ts             # Kompresi & pemrosesan gambar
│   │   ├── audioUtils.ts             # Recorder & konverter audio WAV
│   │   └── ...
│   ├── types/              # Deklarasi antarmuka TypeScript
│   └── main.tsx            # Entry point aplikasi React
├── server.ts               # Server Express dev entry point
├── vite.config.ts          # Konfigurasi Vite & proxy backend
└── package.json
```

---

## 🎯 Pengaturan AI Provider & Konfigurasi Dual Model

Aplikasi ini mendukung arsitektur **Dual Model**, di mana model untuk teks chat dan model untuk pembuatan gambar foto/PAP dapat dikonfigurasi secara terpisah:

1. **Model Teks (Chat)**: Digunakan untuk percakapan chat, reasoning persona karakter, audio voice notes, dan summarization memori.
   - Default: `gemini-3.1-flash-lite` (sangat cepat, hemat biaya, dan responsif).
   - Opsi lain: `gemini-2.5-flash`, `gemini-1.5-flash`, atau custom model jika menggunakan OpenAI-compatible.
2. **Model Khusus Gambar (Foto / PAP)**: Digunakan saat AI mengeksekusi function call untuk mengirim foto selfie/PAP in-character.
   - Default: `gemini-3.1-flash-lite-image`.
   - Opsi lain: `gemini-3.1-flash-image`, `gemini-2.5-flash-image`, atau `imagen-3.0-generate-002`.

### Provider Kustom (OpenAI-compatible)
Di halaman **Pengaturan → Model & Provider AI**, Anda juga dapat menambahkan provider OpenAI-compatible:
- **Type**: `openai-compatible`
- **Base URL**: Contoh `https://openrouter.ai/api/v1` atau `http://localhost:11434/v1` (Ollama lokal)
- **API Key**: Kunci API provider yang sesuai
- **Model Teks**: Identifier model chat (misal `openrouter/auto`, `llama3.2`, dll.)
- **Model Gambar**: Model gambar yang didukung atau fallback otomatis ke preset Gemini/Avatar.

---

## 📝 License

MIT License — Bebas digunakan, dipelajari, dan dikembangkan lebih lanjut.

---

## 🙏 Credits & Apresiasi

- **Character Concept**: Waguri Kaoruko
- **AI Core**: Google Gemini API (`@google/genai`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animation**: [Motion](https://motion.dev/) (Framer Motion)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)