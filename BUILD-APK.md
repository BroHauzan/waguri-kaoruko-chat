# Panduan Build APK

App ini adalah **React web** (Vite), bukan React Native. Jadi untuk jadi APK, dia
harus dibungkus pakai **Capacitor** — wrapper yang menjalankan app web di dalam
WebView Android, sambil memberi akses ke API native (mikrofon, kamera, notifikasi).

Panduan ini disusun sesuai kondisi project saat ini.

---

## ⚠️ Baca dulu: satu hal yang wajib diselesaikan

**App ini butuh server backend untuk memanggil Gemini.**

Saat berjalan di browser, ada dua bagian:

1. **Frontend** — kode React di `src/`, dijalankan Vite.
2. **Backend** — `server.ts` + `server/geminiService.ts`, menerima request di
   `/api/chat` lalu meneruskan ke Gemini memakai API key dari `.env`.

Waktu di browser, keduanya jalan bersamaan: Vite menyediakan plugin
(`serverApiPlugin` di `vite.config.ts`) yang menangani `/api/*` di mesin yang sama.
Jadi `fetch("/api/chat")` otomatis mengarah ke server lokal.

**Di dalam APK, tidak ada server.** WebView hanya memuat file statis. Kalau
`fetch("/api/chat")` dijalankan, dia akan mencari `file:///api/chat` dan gagal.

Ada dua cara menyelesaikannya — pilih salah satu sebelum build:

### Opsi A — Deploy backend ke hosting (direkomendasikan)

1. Deploy `server.ts` ke Vercel / Railway / Render / VPS.
2. Ganti pemanggilan relatif jadi absolut di `src/lib/geminiClient.ts`:

   ```ts
   // sebelum
   fetch("/api/chat", { ... })

   // sesudah
   const API_BASE = "https://api-kamu.example.com";
   fetch(`${API_BASE}/api/chat`, { ... })
   ```

   Ada **dua** tempat: `sendMessageToGemini` dan `triggerSummarizeMemory`.

3. Aktifkan CORS di server untuk origin WebView (`capacitor://localhost`
   atau `https://localhost`).

**Penting:** dengan cara ini, API key tetap aman di server dan tidak pernah
masuk ke dalam APK.

### Opsi B — Panggil Gemini langsung dari app

Pindahkan pemanggilan Gemini ke sisi klien dan simpan API key di app.
**Ini tidak disarankan**: API key di dalam APK bisa diekstrak siapa pun yang
memegang file APK-nya, lalu dipakai atas biaya kamu.

Kalau tetap mau cara ini, key harus diisi user lewat Pengaturan > Provider AI
(fitur ini sudah ada), dan **jangan** menaruh key bawaan di dalam build.

---

## Langkah build

### 1. Prasyarat

- Node.js 20+
- Android Studio (untuk Android SDK) — atau hanya command-line tools
- JDK 17

### 2. Pasang Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Waguri Kaoruko" com.waguri.kaoruko --web-dir=dist
```

### 3. Izinkan akses jaringan & media

Edit `capacitor.config.json` yang baru dibuat:

```json
{
  "appId": "com.waguri.kaoruko",
  "appName": "Waguri Kaoruko",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

`androidScheme: "https"` penting supaya WebView dianggap origin aman —
tanpa ini, mikrofon dan kamera akan diblokir.

### 4. Tambahkan izin di AndroidManifest

Setelah `npx cap add android`, buka
`android/app/src/main/AndroidManifest.xml` dan tambahkan:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

`RECORD_AUDIO` wajib untuk fitur voice note. `VIBRATE` untuk haptic feedback.
`POST_NOTIFICATIONS` untuk notifikasi balasan (Android 13+).

### 5. Build & sinkronkan

```bash
npm run build          # hasilkan folder dist/
npx cap sync android   # salin dist/ ke project Android
npx cap open android   # buka Android Studio
```

Di Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Atau lewat terminal:

```bash
cd android
./gradlew assembleDebug      # APK debug, untuk uji coba
./gradlew assembleRelease    # APK rilis, perlu signing
```

Hasilnya ada di `android/app/build/outputs/apk/`.

### 6. Tanda tangan APK rilis

APK rilis harus ditandatangani, kalau tidak tidak bisa dipasang:

```bash
keytool -genkey -v -keystore kaoruko.keystore -alias kaoruko \
  -keyalg RSA -keysize 2048 -validity 10000
```

Lalu daftarkan di `android/app/build.gradle`, dan simpan file keystore-nya
baik-baik — kalau hilang, kamu tidak bisa merilis update untuk app yang sama.

---

## Catatan penting setelah jadi APK

### Service Worker tidak jalan di WebView

`src/main.tsx` mendaftarkan service worker (`/sw.js`) untuk notifikasi latar
belakang. Di WebView Android, service worker **tidak didukung** dengan cara yang
sama seperti di browser. Artinya:

- Notifikasi latar belakang saat app ditutup **tidak akan berfungsi** lewat jalur ini.
- Solusinya pakai plugin native Capacitor
  (`@capacitor/local-notifications`), atau terima bahwa notifikasi hanya muncul
  saat app terbuka.

### Mode gelap mengikuti sistem

`useTheme` membaca `prefers-color-scheme`. Di WebView Android, ini mengikuti
setelan gelap/terang HP. Mode "Otomatis" di Pengaturan akan bekerja normal.

### Safe area

Sudah ditangani lewat `viewport-fit=cover` di `index.html` dan utility
`pt-safe` / `pb-safe` di `index.css`. Pastikan langkah 3 (`androidScheme: https`)
sudah dilakukan, kalau tidak `env(safe-area-inset-*)` bisa bernilai 0.

### Ukuran APK

Perkiraan 5–15 MB, tergantung seberapa banyak yang di-bundle. Kalau mau lebih
kecil, pertimbangkan R8/ProGuard untuk mengecilkan kode.

---

## Ringkasan urutan perintah

```bash
# 1. Siapkan backend (Opsi A) dan perbarui URL di src/lib/geminiClient.ts
# 2. Pasang Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Waguri Kaoruko" com.waguri.kaoruko --web-dir=dist

# 3. Tambahkan izin di AndroidManifest.xml (lihat langkah 4)

# 4. Build
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

---

## Kalau mau hasil yang lebih "native"

Project ini bisa tetap seperti sekarang dan berjalan baik sebagai APK.
Tapi kalau suatu saat ingin performa dan integrasi native yang lebih dalam,
pertimbangkan menulis ulang bagian UI memakai **React Native / Expo** —
spec desain WhatsApp yang sudah dipakai di sini (warna, tipografi, spacing)
bisa dipindahkan hampir langsung, dan `DESIGN-expo.md` sudah menyediakan
padanan komponennya.
