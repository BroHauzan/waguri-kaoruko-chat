import { AIProvider, Settings } from "../types";
import { isPaidUser } from "./quotaService";

/**
 * Provider bawaan Nara Router (OpenAI-compatible).
 * Default untuk semua pengguna Akun Free.
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
 * Menjamin BUILTIN_NARA_PROVIDER dan BUILTIN_GEMINI_PROVIDER selalu ada.
 */
export function getProviderList(settings: Settings): AIProvider[] {
  const list = settings.providers;
  if (!Array.isArray(list) || list.length === 0) {
    return [BUILTIN_NARA_PROVIDER, BUILTIN_GEMINI_PROVIDER];
  }

  const result = [...list];
  // Pastikan Nara Router ada
  if (!result.some((p) => p.id === BUILTIN_NARA_PROVIDER.id)) {
    result.unshift(BUILTIN_NARA_PROVIDER);
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

  // Fallback default: Nara Router jika Free, atau entri pertama
  const nara = list.find((p) => p.id === BUILTIN_NARA_PROVIDER.id);
  return !paid && nara ? nara : list[0] || BUILTIN_NARA_PROVIDER;
}

export function makeProviderId(): string {
  return `prov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
