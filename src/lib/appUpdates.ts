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
    id: "2026.10.08-persona-expansion-and-onboarding-fixes",
    version: "v1.5.1",
    date: "8 Oktober 2026",
    badge: "Terbaru",
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
  {
    id: "2026.10.08-main-skill-dynamic-adaptation",
    version: "v1.5.0",
    date: "8 Oktober 2026",
    badge: "Mayor",
    bannerGradient: "from-rose-500 via-pink-600 to-purple-700",
    bannerImage: "/rintaro-pfp.jpg",
    title: {
      id: "Pedoman Main Skill & Adaptasi Chat Dinamis",
      en: "Main Skill Guidelines & In-Chat Dynamic Adaptation",
    },
    subtitle: {
      id: "Gaya bahasa anti-slop natural dan adaptasi nama panggilan otomatis langsung dari chat.",
      en: "Natural anti-slop speaking style and automatic nickname adaptation directly from chat.",
    },
    highlights: {
      id: [
        {
          title: "Adaptasi Gaya Bicara Otomatis Lewat Chat",
          description:
            "Cukup minta karakter di chat (misal: 'panggil aku rin aja'), karakter langsung mematuhi panggilan tersebut dan memperbarui profilnya secara cerdas.",
          tag: "Baru",
        },
        {
          title: "Pedoman Gaya Bicara Main Skill",
          description:
            "Gaya bahasa anti-slop natural dari Main Skill (tanpa kapital awal, tanpa titik akhir, tanpa tanda seru) kini menjadi pedoman standar bawaan.",
          tag: "Karakter",
        },
        {
          title: "Onboarding Pengguna Baru",
          description:
            "Modal sambutan interaktif untuk menetapkan nama panggilan serta persona diri sebelum memulai percakapan pertama.",
          tag: "Pengguna",
        },
        {
          title: "Navigasi & Tombol Kembali Lebih Mulus",
          description:
            "Dukungan tombol back Android dan browser history yang lebih rapi tanpa keluar dari aplikasi saat di chat arsip.",
          tag: "Navigasi",
        },
      ],
      en: [
        {
          title: "In-Chat Dynamic Style Adaptation",
          description:
            "Ask the character directly in chat to change nicknames or speaking styles, and they will immediately adapt and remember it.",
          tag: "New",
        },
        {
          title: "Main Skill Anti-Slop Guidelines",
          description:
            "Natural texting guidelines from Main Skill (all lowercase, no trailing periods, no exclamation marks) are now integrated.",
          tag: "Character",
        },
        {
          title: "New User Onboarding",
          description:
            "Interactive welcome modal for setting nickname and personal persona before entering your first chat.",
          tag: "User",
        },
        {
          title: "Smooth Navigation & Hardware Back Button",
          description:
            "Better back button handling for Android and web browser history without exiting the app unexpectedly.",
          tag: "Navigation",
        },
      ],
    },
  },
  {
    id: "2026.10.08-custom-themes-nara",
    version: "v1.4.0",
    date: "8 Oktober 2026",
    badge: "Fitur",
    bannerGradient: "from-blue-600 via-indigo-600 to-violet-800",
    bannerImage: "/waguri-pfp.jpg",
    title: {
      id: "Tema Bubble Kustom & Nara Router Default",
      en: "Custom Bubble Themes & Nara Router Default",
    },
    subtitle: {
      id: "Pilihan warna bubble chat personal dan integrasi mesin AI default yang responsif.",
      en: "Personal chat bubble color choices and responsive default AI engine integration.",
    },
    highlights: {
      id: [
        {
          title: "Kustomisasi Warna Bubble Chat",
          description:
            "Pilih warna bubble chat sesuai seleramu (Amber, Biru Samudra, Emerald, Pink, Lavender, Monokrom, dll) langsung di Pengaturan.",
          tag: "Tampilan",
        },
        {
          title: "Provider AI Nara Router Bawaan",
          description:
            "Nara Router kini menjadi mesin default yang cepat dan responsif untuk percakapan harian akun gratis.",
          tag: "Mesin AI",
        },
        {
          title: "Kuota Harian Diperluas ke 200 Pesan",
          description:
            "Batas pesan harian untuk pengguna gratis ditingkatkan hingga 200 pesan per hari.",
          tag: "Kapasitas",
        },
        {
          title: "Desain Profil Minimalis",
          description:
            "Tampilan header profil karakter vertikal yang bersih dengan transisi foto lembut tanpa ornamen berlebih.",
          tag: "Desain",
        },
      ],
      en: [
        {
          title: "Custom Chat Bubble Colors",
          description:
            "Choose your preferred user bubble color (Amber, Ocean Blue, Emerald, Pink, Lavender, Monochrome, etc.) in Settings.",
          tag: "UI",
        },
        {
          title: "Nara Router AI Engine Default",
          description:
            "Nara Router is now the responsive default provider for smooth and fast daily conversations.",
          tag: "AI Engine",
        },
        {
          title: "Daily Limit Expanded to 200 Messages",
          description:
            "Free tier quota raised to 200 messages daily for relaxed all-day chatting.",
          tag: "Capacity",
        },
        {
          title: "Minimalist Character Profile",
          description:
            "Clean vertical fading album header on character profiles for a distraction-free experience.",
          tag: "Design",
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
