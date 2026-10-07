# Security Audit & Chaos Engineering Report

## BAGIAN 1: Security Audit — Pencegahan Kebocoran API Key

### 1. Audit Endpoint & Arsitektur Secret Management
- **Integrasi Backend:** Seluruh pemanggilan ke Gemini API dilakukan melalui backend proxy lokal pada rute `/api/chat`, `/api/lore`, `/api/photo`, dan `/api/summarize`. Frontend (React) tidak memanggil AI service secara langsung.
- **Environment Variables:** Backend telah dikonfigurasi untuk hanya membaca API key dari `process.env.GEMINI_API_KEY` dari server node environment. Tidak terdapat penggunaan variabel prefix terekspos seperti `VITE_GEMINI_API_KEY` pada frontend.
- **Bring Your Own Key (BYOK):** Aplikasi mendukung input API key manual melalui pengaturan provider. API key ini aman karena hanya disimpan secara lokal menggunakan `localStorage` pada browser klien, dikirim ke backend melalui payload request yang terisolasi, dan **tidak dicetak ke sistem log atau analytics backend.**
- **UI Masking:** Key di-render menggunakan `<input type="password">` di layar pengaturan dengan placeholder tersamar (*misal: sk-... / AIza...*), melindungi key dari _shoulder surfing_.

### 2. Static Bundle & Git Leak Audit
- **Static Bundle (npm run build):** Pengecekan pada seluruh chunk bundel build statis (`dist/assets/*.js`) untuk pola-pola kunci (`sk-` dan `AIza`) menghasilkan 0 temuan hardcoded API keys.
- **Pengecekan Kode Mentah:** Kode sumber di `src/`, `api/`, `server/`, dan folder root tidak memiliki satupun *hardcoded* API key.
- **Konfigurasi Git:** File `.env`, `.env.local` telah dimasukkan ke dalam `.gitignore` dengan benar.
- **Git History Leak Audit:** Audit mendalam pada keseluruhan sejarah *commit* (seluruh *branch* dan *commit hash* lampau) telah dilakukan menggunakan *regular expression* dan tidak ditemukan kebocoran secret ataupun riwayat `.env` yang ter-*commit*.

---

## BAGIAN 2: Chaos Engineering & Resilience Testing

Skenario chaos engineering telah diaudit, disimulasikan, dan diimplementasikan ulang untuk menambal kerentanan _user-experience_:

### 1. Skenario 1: API Quota & Rate Limit (HTTP 429)
- **Problem:** Sebelumnya UI melempar error 500 mentah meskipun model mengalami *Rate Limiting* (429), membuat seakan koneksi terputus dan memungkinkan spam tombol kirim yang berlebihan.
- **Resolusi:**
  - `server/apiRouter.ts` dimodifikasi agar meneruskan *status code HTTP* asli dari Gemini SDK kepada klien.
  - `geminiClient.ts` sekarang menangkap properti `.status` sehingga error bisa diidentifikasi dengan benar oleh antarmuka chat.
  - Saat `HTTP 429` (Quota Exceeded / Rate Limited) terdeteksi, antarmuka `ChatScreen.tsx` akan otomatis menampilkan pesan error humanis In-Character: *"Aduh, Kaoruko lagi istirahat sebentar nih! Tunggu bentar ya, nanti aku bales lagi! 🥺"*.
  - **Cooldown Timer:** Input chat dan tombol kirim otomatis dinonaktifkan (disabled) dan UI input menampilkan *"Tunggu 60s..."* selama waktu *cooldown* untuk mencegah *spam-retries*.

### 2. Skenario 2: Kegagalan Generator Gambar (Imagen / Vision Fallback)
- **Problem:** Ketika request gambar gagal, aplikasi melempar *warning* dan membiarkan array *messages* kosong jika tidak ada *caption*, yang bisa menyebabkan state *skeleton loader* menggantung tanpa merespons ke *UI*.
- **Resolusi:**
  - Modifikasi pada blok `catch` Imagen di `geminiService.ts`: Meskipun gagal men-*generate* foto, aplikasi memastikan ada respons teks fallback yang dimasukkan ke dalam pesan, contohnya *"Aduh sinyalku barusan agak lemot nih pas mau kirim foto hehe. Nanti aku fotoin lagi yaa!"*. UI loader gambar akan dihentikan dengan aman.

### 3. Skenario 3: Sudden Network Drop (Offline Transition)
- **Problem:** Aplikasi tidak memberikan notifikasi jelas saat koneksi jaringan pengguna tiba-tiba terputus, membiarkan pengguna bertanya-tanya mengapa pesan mereka berstatus tertahan.
- **Resolusi:**
  - Menambahkan *Offline Banner Indicator* secara real-time yang memonitor *event listener* `online` dan `offline` di `App.tsx`.
  - Jika internet terputus, notifikasi *floating banner* non-intrusif berwarna kuning muncul di atas UI *"Koneksi terputus. Pesan akan terkirim otomatis saat online."*
  - Antrean `indexedDbQueue` sudah ada dari sistem aslinya, mem-by-pass blok koneksi sehingga dapat dikirim ulang secara utuh ketika OS menyalakan event `online`.

### 4. Skenario 4: IndexedDB Corruption & Storage Quota Exceeded
- **Problem:** Fungsi insert transaksi di modul database (*indexedDbQueue*) dapat mengalami Promise-rejection *uncaught* atau nge-*hang* bila pengguna telah mencapai batas *Storage Quota Exceeded*.
- **Resolusi:**
  - Menerapkan arsitektur `try/catch` pada internal transaction-API `enqueueTask`.
  - Mengikat listener `tx.onabort` dan `req.onerror`. Apabila mendeteksi error bertipe `QuotaExceededError`, mekanisme otomatis _Self-Healing_ akan terpanggil, yakni menjalankan `clearCompletedTasks()` (membersihkan _task log_ dan *cache* gambar basi).
  - Label tombol hapus data (Panic Button / Reset) telah diperbarui dalam dictionary (`i18n.ts`) dan ditranslasikan dengan sebutan spesifik: **"Bersihkan Cache & Reset Data Sesi"**, sesuai instruksi.

---
> Status: **Semua instrumen telah lolos build (`npm run build`) tanpa error. Sistem keamanan dan _chaos mitigation_ 100% *compliant* dengan checklist TASK MASTER.**
