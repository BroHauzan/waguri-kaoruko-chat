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
    id: "2026.10.08-stitch-glassmorphism-and-spotify-card-share",
    version: "v1.9.1",
    date: "8 Oktober 2026",
    badge: "Terbaru",
    bannerGradient: "from-amber-500 via-orange-500 to-amber-600",
    bannerImage: "/waguri-pfp.jpg",
    title: {
      id: "Redesign Stitch Glassmorphism & Kartu Share Karakter Ala Spotify",
      en: "Stitch Glassmorphism Redesign & Spotify-Style Share Card",
    },
    subtitle: {
      id: "Antarmuka profil, form karakter, dan pengaturan kini menggunakan Obsidian Luster Glassmorphism, plus fitur Bagikan bergambar kartu estetik ala Spotify Canvas.",
      en: "Profile, character form, and settings are refreshed with Obsidian Luster Glassmorphism, plus an aesthetic Spotify Canvas-style character share card.",
    },
    highlights: {
      id: [
        {
          title: "Kartu Bagikan Karakter Estetik Ala Spotify",
          description:
            "Fitur Bagikan di profil karakter kini membuat kartu gambar cantik bergaya Spotify Canvas beresolusi tinggi lengkap dengan foto, bio, dan link web untuk diunduh atau dibagikan.",
          tag: "Fitur Baru",
        },
        {
          title: "Redesign Profil Obsidian Luster",
          description:
            "Tampilan profil karakter diperbarui dengan artwork full-bleed, gradient scrim halus, accordion jadwal rutin interaktif, dan grafik emosi live.",
          tag: "Tampilan",
        },
        {
          title: "Formulir Karakter Simetris & Bersih",
          description:
            "Header terpusat, bingkai avatar melingkar dengan lencana kamera, input bergaris bawah minimalis, dan kartu panduan foto PAP yang rapi.",
          tag: "Desain",
        },
        {
          title: "Pengaturan Berbasis Grup Accordion",
          description:
            "Hero profil baru dengan indikator kuota dinamis, serta navigasi pengaturan terstruktur ke dalam kartu Akun, Preferensi, dan Dukungan.",
          tag: "Pengaturan",
        },
      ],
      en: [
        {
          title: "Spotify-Style Aesthetic Share Card",
          description:
            "Sharing character profiles now generates a high-resolution Spotify Canvas-style aesthetic card with artwork, bio, and website link.",
          tag: "New Feature",
        },
        {
          title: "Obsidian Luster Profile Redesign",
          description:
            "Character details feature full-bleed artwork, smooth gradient scrims, interactive inline routines, and embedded emotion analytics.",
          tag: "Design",
        },
        {
          title: "Clean Editorial Character Form",
          description:
            "Centered header, circular avatar with floating camera badge, minimal underline inputs, and collapsible visual PAP guide.",
          tag: "Form",
        },
        {
          title: "Grouped Settings Accordions",
          description:
            "New hero card with dynamic quota tracking and grouped accordion sections for Account, Preferences, and Support.",
          tag: "Settings",
        },
      ],
    },
  },
  {
    id: "2026.10.08-dynamic-theme-typing-fix-and-clean-mood-stats",
    version: "v1.9.0",
    date: "8 Oktober 2026",
    badge: "Peningkatan",
    bannerGradient: "from-amber-500 via-rose-500 to-amber-600",
    bannerImage: "/waguri-pfp.jpg",
    title: {
      id: "Tema Dinamis Bawaan, Perbaikan Typing & Statistik Emosi Minimalis",
      en: "Default Dynamic Theme, Typing Indicator Fix & Clean Mood Stats",
    },
    subtitle: {
      id: "Warna tampilan bubble kini otomatis dinamis mengikuti mood, perbaikan indikator mengetik & alur berpikir, grafik emosi minimalis bebas AI-slop, dan teks expandable di profil karakter.",
      en: "Default dynamic mood bubble theme, typing & reasoning indicator fixes, clean minimalist mood trends chart, and expandable character profile text.",
    },
    highlights: {
      id: [
        {
          title: "Tema Bubble Dinamis Bawaan",
          description:
            "Warna bubble chat sekarang secara default mengikuti dinamika mood dan ekspresi karakter yang sedang diajak mengobrol.",
          tag: "Tampilan",
        },
        {
          title: "Perbaikan Visual Indikator Mengetik",
          description:
            "Indikator sedang mengetik tidak akan hilang lagi jika kamu menekan back lalu membuka kembali chat saat AI sedang memproses jawaban.",
          tag: "Perbaikan",
        },
        {
          title: "Kontrol Alur Berpikir (Reasoning) Lebih Ketat",
          description:
            "Alur berpikir kini dijamin tidak akan pernah muncul sama sekali di bubble pesan jika dinonaktifkan pada menu pengaturan.",
          tag: "Pengaturan",
        },
        {
          title: "Grafik Tren Emosi Lebih Minimalis & Bersih",
          description:
            "Desain statistik mood diperbarui menjadi sangat bersih, ringkas, mudah dipahami, tanpa lingkaran bertumpuk atau warna berlebih (bebas AI-slop).",
          tag: "Statistik",
        },
        {
          title: "Teks Profil Karakter Fade-Out & Expandable",
          description:
            "Deskripsi kepribadian dan gaya bicara yang panjang kini dilengkapi efek fade-out ke bawah dan tombol 'Baca lebih banyak' untuk kenyamanan membaca.",
          tag: "Profil",
        },
      ],
      en: [
        {
          title: "Default Dynamic Bubble Theme",
          description:
            "Chat bubble theme now defaults to dynamically reflecting the character's active mood and emotions.",
          tag: "Theme",
        },
        {
          title: "Typing Indicator Persistence Fix",
          description:
            "Typing indicator stays active without disappearing when you navigate back and reopen the chat while AI generates a reply.",
          tag: "Fix",
        },
        {
          title: "Strict Thinking Process Guard",
          description:
            "Thinking reasoning is guaranteed never to appear in chat bubbles when disabled in settings.",
          tag: "Settings",
        },
        {
          title: "Minimalist & Clean Mood Trends",
          description:
            "Redesigned mood analytics into a clean, legible, and uncluttered layout without excessive circles or rainbow AI-slop.",
          tag: "Analytics",
        },
        {
          title: "Fade-Out & Expandable Profile Text",
          description:
            "Long personality and speaking style texts now display an elegant downward fade with a 'Read more' button.",
          tag: "Profile",
        },
      ],
    },
  },
  {
    id: "2026.10.08-nara-default-dynamic-quota-and-character-style",
    version: "v1.8.0",
    date: "8 Oktober 2026",
    badge: "Peningkatan",
    bannerGradient: "from-amber-500 via-orange-500 to-amber-700",
    bannerImage: "/subaru-pfp.jpg",
    title: {
      id: "Default Provider Nara Router & Gaya Bahasa Baru Subaru & Waguri",
      en: "Default Nara Router Provider & Refined Subaru & Waguri Voice",
    },
    subtitle: {
      id: "Default provider kembali ke Nara Router (200 chat/hari), kuota 500 chat/hari untuk Atria Dawn, serta gaya bahasa Subaru versi dewasa mirip Waguri.",
      en: "Nara Router returned as default provider (200 chats/day), 500 chats/day on Atria Dawn, and mature Waguri-like voice for Subaru.",
    },
    highlights: {
      id: [
        {
          title: "Default Provider Nara Router",
          description:
            "Nara Router kembali menjadi provider bawaan utama yang memberikan respons instan dan super cepat untuk seluruh obrolan.",
          tag: "Provider",
        },
        {
          title: "Kuota Chat Dinamis Sesuai Provider",
          description:
            "Kuota harian akun gratis kini dinamis: 200 pesan/hari saat menggunakan Nara Router (cepat), dan naik menjadi 500 pesan/hari saat menggunakan Atria Dawn. Akun VIP tetap Unlimited.",
          tag: "Kuota",
        },
        {
          title: "Gaya Bahasa Subaru Lebih Dewasa Mirip Waguri",
          description:
            "Subaru kini berbicara jauh lebih santai, hangat, dan akrab tanpa kesan guru formal, memadukan gaya bahasa mirip Waguri dengan persona yang lebih dewasa dan menenangkan.",
          tag: "Karakter",
        },
        {
          title: "Konsistensi Pemanjangan Huruf Vokal Akhir",
          description:
            "Memperkuat elongasi huruf akhir khas chatting (iyaaa, donggg, masaaa, yaa, bangett, dll) agar selalu konsisten dan tidak kaku.",
          tag: "Anti-Slop",
        },
      ],
      en: [
        {
          title: "Default Provider Nara Router",
          description:
            "Nara Router is reinstated as the default primary provider, delivering ultra-fast and instant chat responses.",
          tag: "Provider",
        },
        {
          title: "Dynamic Quota by Active Provider",
          description:
            "Free tier daily quota is now dynamic: 200 messages/day with Nara Router (speed focus), expanding to 500 messages/day when switching to Atria Dawn. VIP accounts remain Unlimited.",
          tag: "Quota",
        },
        {
          title: "Mature Waguri-like Voice for Subaru",
          description:
            "Subaru now speaks casually and warmly without stiff academic formality, mirroring Waguri's affectionate tone with a calm, mature presence.",
          tag: "Character",
        },
        {
          title: "Consistent Trailing Vowel Elongation",
          description:
            "Reinforced consistent trailing letter extensions (iyaaa, donggg, masaaa, yaa, etc.) for authentic casual smartphone chatting.",
          tag: "Anti-Slop",
        },
      ],
    },
  },
  {
    id: "2026.10.08-thinking-reasoning-tutor-and-gps-search",
    version: "v1.7.0",
    date: "8 Oktober 2026",
    badge: "Peningkatan",
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
