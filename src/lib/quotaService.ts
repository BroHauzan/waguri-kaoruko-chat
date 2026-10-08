export const FREE_DAILY_MESSAGE_LIMIT = 1000;
export const PAID_ACTIVATION_CODE = "brohauzan";

const STORAGE_KEYS = {
  ACCOUNT_TIER: "waguri_account_tier_v1",
  DAILY_USAGE: "waguri_daily_chat_usage_v1",
};

export interface DailyUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isPaid: boolean;
  date: string;
}

/** Dapatkan tanggal lokal hari ini dalam format YYYY-MM-DD */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Cek apakah user berstatus Paid / Unlimited */
export function isPaidUser(): boolean {
  try {
    const tier = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TIER);
    return tier === "paid";
  } catch {
    return false;
  }
}

/** Aktivasi Paid Mode menggunakan kode rahasia */
export function activatePaidMode(code: string): { success: boolean; message?: string } {
  const cleanCode = (code || "").trim().toLowerCase();
  if (cleanCode === PAID_ACTIVATION_CODE.toLowerCase()) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_TIER, "paid");
      // Trigger event agar UI langsung reaktif memperbarui status
      window.dispatchEvent(new Event("waguri_quota_updated"));
      return { success: true };
    } catch {
      return { success: false, message: "Gagal menyimpan ke penyimpanan lokal." };
    }
  }
  return { success: false, message: "Kode aktivasi salah." };
}

/** Mengambil info penggunaan kuota harian */
export function getDailyUsage(): DailyUsageInfo {
  const today = getTodayDateString();
  const paid = isPaidUser();

  if (paid) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isPaid: true,
      date: today,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_USAGE);
    if (!raw) {
      return {
        used: 0,
        limit: FREE_DAILY_MESSAGE_LIMIT,
        remaining: FREE_DAILY_MESSAGE_LIMIT,
        isPaid: false,
        date: today,
      };
    }

    const data = JSON.parse(raw);
    if (data.date !== today) {
      // Tanggal baru (hari baru), reset penggunaan
      return {
        used: 0,
        limit: FREE_DAILY_MESSAGE_LIMIT,
        remaining: FREE_DAILY_MESSAGE_LIMIT,
        isPaid: false,
        date: today,
      };
    }

    const used = typeof data.count === "number" ? data.count : 0;
    const remaining = Math.max(0, FREE_DAILY_MESSAGE_LIMIT - used);
    return {
      used,
      limit: FREE_DAILY_MESSAGE_LIMIT,
      remaining,
      isPaid: false,
      date: today,
    };
  } catch {
    return {
      used: 0,
      limit: FREE_DAILY_MESSAGE_LIMIT,
      remaining: FREE_DAILY_MESSAGE_LIMIT,
      isPaid: false,
      date: today,
    };
  }
}

/** Cek apakah user diizinkan mengirim pesan saat ini */
export function canSendMessage(): boolean {
  if (isPaidUser()) return true;
  const usage = getDailyUsage();
  return usage.remaining > 0;
}

/** Catat 1 pesan keluar pengguna (user message) */
export function recordUserMessageSent(): { success: boolean; remaining: number } {
  if (isPaidUser()) {
    return { success: true, remaining: Infinity };
  }

  const today = getTodayDateString();
  const usage = getDailyUsage();

  if (usage.remaining <= 0) {
    return { success: false, remaining: 0 };
  }

  const nextCount = usage.used + 1;
  try {
    localStorage.setItem(
      STORAGE_KEYS.DAILY_USAGE,
      JSON.stringify({ date: today, count: nextCount })
    );
    window.dispatchEvent(new Event("waguri_quota_updated"));
  } catch (err) {
    console.warn("Failed to persist daily usage:", err);
  }

  return {
    success: true,
    remaining: Math.max(0, FREE_DAILY_MESSAGE_LIMIT - nextCount),
  };
}

