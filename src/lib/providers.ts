import { AIProvider, Settings } from "../types";
import { isPaidUser } from "./quotaService";

export const ATRIA_API_KEYS = [
  "atr_HlXNzlKb09Mi3a9eM8hWBaN1DrT5uzu7",
  "atr_LpDwanXdzDf0-j_hkBfPzU9aH_XFX7xp",
  "atr_Rl-b8A40ryFcTwIQvJEOsEKyLi66KcED",
  "atr_tsM2na9EhSG6uol7QFVsqGRYwe2rwPi7",
  "atr_3gqX1egrAg5F0DCmMvUUzby4sxnMURQA",
  "atr_pm48VZ6kW6Uw0wlX5r--drfsiT6s1zzB",
  "atr_xuEX2NUa4iNw4u-32AyM7aBQJISESurv",
  "atr_RVP95pol_56B-5PaQ_IMigE0zWavGlIB",
  "atr_uBraTieXmzZRrNq_zb_gS6UmO0nqLfKU",
  "atr_QwtaE8p5g0AUMZlo9D3dv8iZ5IN0lmcy",
];

/**
 * Provider bawaan Atria Dawn (OpenAI-compatible).
 * Kuota 500 chat / hari untuk akun gratis.
 */
export const BUILTIN_ATRIA_PROVIDER: AIProvider = {
  id: "builtin-atria",
  name: "Atria Dawn",
  type: "openai-compatible",
  baseUrl: "https://api.atria-asi.ai/v1",
  apiKey: ATRIA_API_KEYS[0],
  model: "Atria-Dawn-Preview",
  imageModel: "gemini-3.1-flash-lite-image",
  isBuiltin: true,
  createdAt: 0,
};

/**
 * Provider bawaan Nara Router (OpenAI-compatible).
 * Default utama untuk semua pengguna (respons super cepat, kuota 200 chat / hari).
 */
export const BUILTIN_NARA_PROVIDER: AIProvider = {
  id: "builtin-nara",
  name: "Nara Router",
  type: "openai-compatible",
  baseUrl: "https://router.bynara.id/v1",
  apiKey: "sk-nry-sgXTu4Sl3NdCFsL7V3c4t4Og7bjlXvEgXk1Tq39Vs4I",
  model: "combo/waguriapp",
  imageModel: "gemini-3.1-flash-lite-image",
  isBuiltin: true,
  createdAt: 0,
};

/**
 * Provider bawaan Gemini.
 * Eksklusif hanya tersedia untuk pengguna Akun Paid (VIP).
 */
export const BUILTIN_GEMINI_PROVIDER: AIProvider = {
  id: "builtin-gemini",
  name: "Gemini",
  type: "gemini",
  baseUrl: "",
  apiKey: "",
  model: "gemini-3.1-flash-lite",
  imageModel: "gemini-3.1-flash-lite-image",
  isBuiltin: true,
  createdAt: 0,
};

/** Pintasan model teks Gemini yang sering dipakai */
export const GEMINI_MODEL_PRESETS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/** Pintasan model gambar Gemini / Imagen yang sering dipakai */
export const GEMINI_IMAGE_MODEL_PRESETS = [
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "imagen-3.0-generate-002",
];

/** Cek apakah suatu provider memerlukan akun Paid */
export function isProviderPaidOnly(provider: AIProvider): boolean {
  return provider.type === "gemini" || provider.id === BUILTIN_GEMINI_PROVIDER.id;
}

/** Cek apakah user saat ini diizinkan menggunakan provider tersebut */
export function isProviderAllowedForCurrentTier(provider: AIProvider): boolean {
  if (isProviderPaidOnly(provider)) {
    return isPaidUser();
  }
  return true;
}

/**
 * Mengembalikan daftar provider yang tersedia.
 * Menjamin BUILTIN_NARA_PROVIDER, BUILTIN_ATRIA_PROVIDER, dan BUILTIN_GEMINI_PROVIDER selalu ada.
 */
export function getProviderList(settings: Settings): AIProvider[] {
  const list = settings.providers;
  if (!Array.isArray(list) || list.length === 0) {
    return [BUILTIN_NARA_PROVIDER, BUILTIN_ATRIA_PROVIDER, BUILTIN_GEMINI_PROVIDER];
  }

  const result = [...list];
  // Pastikan Nara Router ada di paling atas sebagai default provider
  if (!result.some((p) => p.id === BUILTIN_NARA_PROVIDER.id)) {
    result.unshift(BUILTIN_NARA_PROVIDER);
  }
  // Pastikan Atria Dawn ada
  if (!result.some((p) => p.id === BUILTIN_ATRIA_PROVIDER.id)) {
    result.splice(1, 0, BUILTIN_ATRIA_PROVIDER);
  }
  // Pastikan Gemini ada
  if (!result.some((p) => p.id === BUILTIN_GEMINI_PROVIDER.id)) {
    result.push(BUILTIN_GEMINI_PROVIDER);
  }

  return result;
}

/**
 * Provider aktif dengan validasi tier akun:
 * - Jika akun Free, Gemini dilarang dan otomatis fallback ke Nara Router.
 * - Jika akun Paid, bebas menggunakan provider apa pun.
 */
export function getActiveProvider(settings: Settings): AIProvider {
  const list = getProviderList(settings);
  const paid = isPaidUser();

  const chosen = list.find((p) => p.id === settings.activeProviderId);

  // Jika akun Free mencoba memakai Gemini, arahkan ke Nara Router
  if (!paid && chosen && isProviderPaidOnly(chosen)) {
    const nara = list.find((p) => p.id === BUILTIN_NARA_PROVIDER.id);
    return nara || BUILTIN_NARA_PROVIDER;
  }

  if (chosen) {
    return chosen;
  }

  // Fallback default: Nara Router
  const nara = list.find((p) => p.id === BUILTIN_NARA_PROVIDER.id);
  return nara || list[0] || BUILTIN_NARA_PROVIDER;
}

export function makeProviderId(): string {
  return `prov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
