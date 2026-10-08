export interface UpdateHighlight {
  title: string;
  description: string;
  tag?: string;
}

export interface AppUpdateInfo {
  id: string;
  version: string;
  date: string;
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
 * Konfigurasi update terkini aplikasi.
 * Setiap kali ada update baru, ubah `id`, `version`, dan deskripsi `highlights` di sini.
 * Pop-up changelog akan otomatis tampil SEKALI untuk setiap pengguna.
 */
export const LATEST_APP_UPDATE: AppUpdateInfo = {
  id: "2026.10.08-custom-themes-nara",
  version: "v1.4.0",
  date: "8 Oktober 2026",
  title: {
    id: "Yang Baru di Pembaruan Ini",
    en: "What's New in This Update",
  },
  subtitle: {
    id: "Pembaruan fitur, tampilan minimalis, dan peningkatan performa.",
    en: "Feature updates, minimalist UI, and performance improvements.",
  },
  highlights: {
    id: [
      {
        title: "Kustomisasi Warna Bubble Chat",
        description:
          "Pilih warna bubble chat sesuai selera Anda (Amber, Biru, Hijau, Pink, Lavender, Monokrom, dll) di menu Pengaturan tanpa terikat mood karakter.",
        tag: "Baru",
      },
      {
        title: "Provider AI Nara Router",
        description:
          "AI Nara Router kini menjadi mesin default yang lebih gesit dan responsif untuk percakapan sehari-hari.",
        tag: "Peningkatan",
      },
      {
        title: "Kuota Harian Lebih Luas",
        description:
          "Batas percakapan untuk akun gratis kini diperlonggar hingga 200 pesan setiap hari.",
        tag: "Kapasitas",
      },
      {
        title: "Desain Profil Minimalis",
        description:
          "Transisi foto profil vertikal yang bersih dan penghapusan ornamen visual berlebih demi pengalaman membaca yang nyaman.",
        tag: "Tampilan",
      },
    ],
    en: [
      {
        title: "Custom Chat Bubble Colors",
        description:
          "Choose your preferred user bubble color (Amber, Ocean Blue, Emerald, Pink, Lavender, Monochrome, etc.) in Settings without depending on character mood.",
        tag: "New",
      },
      {
        title: "Nara Router AI Engine",
        description:
          "Nara Router is now the default intelligent provider, offering faster and more responsive daily conversations.",
        tag: "Improved",
      },
      {
        title: "Expanded Daily Free Quota",
        description:
          "Daily message limit for free accounts has been expanded up to 200 messages per day.",
        tag: "Capacity",
      },
      {
        title: "Minimalist Character Profile",
        description:
          "Smooth vertical fade album-style profile header and cleaned-up minimalist UI for distraction-free chats.",
        tag: "UI",
      },
    ],
  },
};

/**
 * Memeriksa apakah user sudah pernah melihat info update saat ini.
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
 * Menandai bahwa user telah melihat update ini sehingga tidak muncul lagi.
 */
export function markLatestUpdateAsSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, LATEST_APP_UPDATE.id);
  } catch (e) {
    console.error("Gagal menyimpan status update", e);
  }
}

