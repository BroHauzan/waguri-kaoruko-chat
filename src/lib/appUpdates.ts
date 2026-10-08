export interface UpdateHighlight {
  title: string;
  description: string;
  tag?: string;
}

export interface AppUpdateInfo {
  id: string;
  version: string;
  date: string;
  badge?: string;
  bannerGradient: string;
  bannerImage?: string;
  title: {
    id: string;
    en: string;
  };
  subtitle: {
    id: string;
    en: string;
  };
  highlights: {
    id: UpdateHighlight[];
    en: UpdateHighlight[];
  };
}

const STORAGE_KEY = "waguri_last_seen_update_id";

/**
 * Daftar 3 pembaruan terakhir aplikasi.
 * Pembaruan yang lebih lama dibersihkan agar riwayat tetap ramping dan relevan.
 */
export const APP_UPDATES: AppUpdateInfo[] = [
  {
    id: "2026.10.08-thinking-reasoning-tutor-and-gps-search",
    version: "v1.7.0",
    date: "8 Oktober 2026",
    badge: "Terbaru",
    bannerGradient: "from-amber-500 via-purple-600 to-indigo-700",
    bannerImage: "/subaru-pfp.jpg",
    title: {
      id: "Proses Berpikir AI, Karakter Tutor, & Pencarian GPS",
      en: "AI Thinking Process, Study Tutor & GPS Search",
    },
    subtitle: {
      id: "Fitur alur berpikir AI interaktif untuk akun VIP, tutor belajar baru Subaru Hoshina, serta integrasi GPS & pencarian web real-time.",
      en: "Interactive AI reasoning for VIP accounts, new Subaru Hoshina study tutor character, and real-time GPS & web search integration.",
    },
    highlights: {
      id: [
        {
          title: "Tampilkan Alur Berpikir AI (Reasoning)",
          description:
            "Lihat proses penalaran dan pemikiran internal AI sebelum membalas pesan di Opsi Lanjutan Developer. Kotak pemikiran otomatis di-collapse setelah selesai.",
          tag: "VIP Eksklusif",
        },
        {
          title: "Karakter Baru: Subaru Hoshina (Tutor Belajar)",
          description:
            "Tutor belajar cerdas dan sabar dari SMA Kikyo yang siap membimbing materi rumit dari dasarnya dengan analogi sederhana dan gaya santai antislop.",
          tag: "Karakter",
        },
        {
          title: "Akses GPS & Informasi Cuaca Real-Time",
          description:
            "Seluruh karakter kini mampu mencari informasi internet dan memeriksa kondisi cuaca real-time di kotamu menggunakan koordinat GPS perangkat.",
          tag: "Pencarian Web",
        },
        {
          title: "Pencarian Fakta & Ensiklopedia Terkini",
          description:
            "Dukungan pencarian pengetahuan langsung ke internet untuk menjawab pertanyaan fakta atau berita secara instan dan akurat.",
          tag: "Fitur Cerdas",
        },
      ],
      en: [
        {
          title: "AI Thinking & Reasoning Process",
          description:
            "View the AI's internal reasoning process before answering in Developer Advanced Options. Automatically collapses once thinking completes.",
          tag: "VIP Exclusive",
        },
        {
          title: "New Character: Subaru Hoshina (Study Tutor)",
          description:
            "Intelligent, patient Kikyo High School tutor dedicated to explaining tricky topics from scratch using clear analogies and anti-slop style.",
          tag: "Character",
        },
        {
          title: "GPS Access & Real-Time Weather",
          description:
            "All characters can now search the web and check current real-time weather in your city using your device's GPS coordinates.",
          tag: "Web Search",
        },
        {
          title: "Live Encyclopedia & Fact Search",
          description:
            "Direct internet search integration to provide real-time facts, encyclopedic knowledge, and live information seamlessly.",
          tag: "Smart Feature",
        },
      ],
    },
  },
  {
    id: "2026.10.08-atria-dawn-and-1000-quota",
    version: "v1.6.0",
    date: "8 Oktober 2026",
    badge: "Peningkatan",
    bannerGradient: "from-amber-500 via-orange-500 to-rose-600",
    bannerImage: "/waguri-pfp.jpg",
    title: {
      id: "Model Atria Dawn Default & Kuota 1.000 Pesan",
      en: "Default Atria Dawn Model & 1,000 Messages Quota",
    },
    subtitle: {
      id: "Integrasi model AI Atria Dawn Preview dengan rotasi 10 API key, serta lonjakan kuota harian akun gratis menjadi 1.000 pesan per hari.",
      en: "Integrated Atria Dawn Preview model with 10-key rotation pool and expanded free daily message limit to 1,000 messages.",
    },
    highlights: {
      id: [
        {
          title: "Model Atria Dawn Preview Bawaan",
          description:
            "Atria Dawn kini menjadi model AI default utama yang super cepat dan cerdas dengan reasoning yang tajam untuk semua percakapan.",
          tag: "Model AI",
        },
        {
          title: "Rotasi Cerdas 10 API Keys",
          description:
            "Didukung kolam 10 API key berkecepatan tinggi dengan auto-failover dan load balancing otomatis untuk menjamin ketersediaan tanpa gangguan.",
          tag: "Infrastruktur",
        },
        {
          title: "Kuota Harian Melonjak ke 1.000 Pesan",
          description:
            "Batas pesan harian pengguna gratis dinaikkan 5x lipat dari 200 menjadi 1.000 pesan per hari agar kamu bisa bebas mengobrol seharian penuh.",
          tag: "Kuota",
        },
        {
          title: "Perbaikan Tema Browser Bawaan",
          description:
            "Mencegah pemaksaan mode gelap (force dark mode) di browser bawaan HP saat pengguna memilih mode terang (light mode).",
          tag: "Tampilan",
        },
      ],
      en: [
        {
          title: "Default Atria Dawn Preview Model",
          description:
            "Atria Dawn is now the primary default AI model, delivering ultra-fast responses and sharp reasoning for all character conversations.",
          tag: "AI Model",
        },
        {
          title: "Smart 10-Key Rotation Pool",
          description:
            "Powered by 10 high-speed API keys with automatic failover and load balancing to ensure continuous uninterrupted availability.",
          tag: "Infrastructure",
        },
        {
          title: "Daily Quota Expanded to 1,000 Messages",
          description:
            "Free tier daily message limit increased 5x from 200 to 1,000 messages daily for relaxed all-day chatting.",
          tag: "Quota",
        },
        {
          title: "Mobile Browser Light Theme Guard",
          description:
            "Prevents mobile default browsers from force-darkening web contents when user chooses Light Mode.",
          tag: "UI",
        },
      ],
    },
  },
  {
    id: "2026.10.08-persona-expansion-and-onboarding-fixes",
    version: "v1.5.1",
    date: "8 Oktober 2026",
    badge: "Peningkatan",
    bannerGradient: "from-amber-500 via-orange-500 to-amber-700",
    bannerImage: "/waguri-pfp.jpg",
    title: {
      id: "Persona Bebas & Backstory Karakter",
      en: "Expanded Persona & Character Backstory",
    },
    subtitle: {
      id: "Batas persona hingga 5.000 karakter, field cerita latar belakang (backstory), dan perbaikan onboarding.",
      en: "Persona limit up to 5,000 characters, new character backstory field, and onboarding bug fixes.",
    },
    highlights: {
      id: [
        {
          title: "Batas Persona Lebih Luas (5.000 Karakter)",
          description:
            "Deskripsi profil dan persona pengguna kini dapat menampung hingga 5.000 karakter tanpa terpotong saat disalin (paste), baik di Pengaturan, Onboarding, maupun Instruksi Kustom.",
          tag: "Fitur",
        },
        {
          title: "Field Latar Belakang (Backstory) Karakter",
          description:
            "Kini tersedia kolom khusus untuk mengisi cerita latar belakang dan lore panjang karakter saat membuat atau mengedit karakter impianmu.",
          tag: "Karakter",
        },
        {
          title: "Perbaikan Tuntas Isi Otomatis Karakter",
          description:
            "Sanitasi API key otomatis sehingga pengambilan lore karakter tidak lagi gagal atau memicu error 400 API key invalid saat menggunakan provider non-Gemini.",
          tag: "Perbaikan",
        },
        {
          title: "Perbaikan Alur Selamat Datang",
          description:
            "Memperbaiki kendala macet saat pengguna baru mengisi nama dan menekan tombol 'Mulai Mengobrol', kini langsung membuka obrolan dengan lancar.",
          tag: "Pengguna",
        },
      ],
      en: [
        {
          title: "Expanded Persona Limits (5,000 Characters)",
          description:
            "User persona and profile descriptions can now hold up to 5,000 characters without truncation when pasted in Settings, Onboarding, or Custom Instructions.",
          tag: "Feature",
        },
        {
          title: "Dedicated Character Backstory Field",
          description:
            "Added an explicit textarea for character lore and backstory so you can freely design rich backgrounds for your custom characters.",
          tag: "Character",
        },
        {
          title: "Auto-Fetch Character Lore Fix",
          description:
            "Smart API key routing prevents 400 API key invalid errors when auto-fetching character lore with non-Gemini active providers.",
          tag: "Fix",
        },
        {
          title: "Smooth Onboarding Experience",
          description:
            "Fixed a bug where first-time users got stuck on the welcome modal; clicking 'Start Chatting' now directly opens the conversation.",
          tag: "User",
        },
      ],
    },
  },
];

/**
 * Pembaruan paling baru (elemen pertama dari APP_UPDATES)
 */
export const LATEST_APP_UPDATE: AppUpdateInfo = APP_UPDATES[0];

/**
 * Memeriksa apakah user sudah pernah melihat info update terbaru.
 */
export function hasSeenLatestUpdate(): boolean {
  try {
    const seenId = localStorage.getItem(STORAGE_KEY);
    return seenId === LATEST_APP_UPDATE.id;
  } catch {
    return false;
  }
}

/**
 * Menandai bahwa user telah melihat update terbaru sehingga tidak muncul otomatis lagi.
 */
export function markLatestUpdateAsSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, LATEST_APP_UPDATE.id);
  } catch (e) {
    console.error("Gagal menyimpan status update", e);
  }
}
