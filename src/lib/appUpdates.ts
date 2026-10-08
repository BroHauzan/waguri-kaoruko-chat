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
  id: "2026.10.08-main-skill-dynamic-adaptation",
  version: "v1.5.0",
  date: "8 Oktober 2026",
  title: {
    id: "Yang Baru di Pembaruan Ini",
    en: "What's New in This Update",
  },
  subtitle: {
    id: "Pedoman gaya bahasa Main Skill, auto-adaptasi gaya dari chat, dan onboarding pengguna baru.",
    en: "Main Skill speaking guidelines, in-chat dynamic style adaptation, and user onboarding.",
  },
  highlights: {
    id: [
      {
        title: "Adaptasi Gaya Bicara Otomatis Lewat Chat",
        description:
          "Cukup minta karakter di chat (misal: 'bisa ga kamu panggil aku rin aja' atau 'gaya bicaramu lebih cuek'), maka karakter langsung mematuhi sebutan tersebut dan data gaya bicara karakter otomatis diperbarui.",
        tag: "Baru",
      },
      {
        title: "Pedoman Gaya Bicara Main Skill",
        description:
          "Gaya bahasa anti-slop natural dari Main Skill kini menjadi pedoman standar saat membuat atau mengisi lore karakter secara otomatis, dengan kebebasan penuh bagi Anda untuk mengeditnya secara manual.",
        tag: "Karakter",
      },
      {
        title: "Onboarding Pengguna Baru",
        description:
          "Pengguna baru dapat langsung mengatur nama panggilan dan persona awal sebelum memulai percakapan.",
        tag: "Pengguna",
      },
      {
        title: "Perbaikan Navigasi Obrolan",
        description:
          "Aplikasi tidak lagi langsung mengarahkan ke obrolan tertentu di awal, dan tombol kembali (back) pada chat arsip kini bekerja dengan benar tanpa keluar dari aplikasi.",
        tag: "Navigasi",
      },
    ],
    en: [
      {
        title: "In-Chat Dynamic Speaking Style Adaptation",
        description:
          "Simply ask the character in chat (e.g. 'can you call me rin instead' or 'talk more casually'), and the character will immediately adopt it and auto-update their speaking style data.",
        tag: "New",
      },
      {
        title: "Main Skill Conversation Guidelines",
        description:
          "Natural anti-slop texting guidelines from Main Skill are now built into character creation and auto-fetch lore, while keeping full manual editing freedom for you.",
        tag: "Character",
      },
      {
        title: "New User Onboarding",
        description:
          "First-time visitors can set their display name and optional persona right away before chatting.",
        tag: "User",
      },
      {
        title: "Smooth Navigation & Back Button Fix",
        description:
          "New sessions land cleanly on the chat list, and pressing back in archived chats now smoothly returns to the previous screen without exiting the app.",
        tag: "Navigation",
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

