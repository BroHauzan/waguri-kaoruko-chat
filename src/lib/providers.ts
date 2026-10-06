import { AIProvider, Settings } from "../types";

/**
 * Provider bawaan yang selalu ada. API key-nya sengaja dikosongkan supaya
 * server memakai `GEMINI_API_KEY` dari .env. Kalau user mengisi key di sini,
 * key itu yang menang.
 */
export const BUILTIN_GEMINI_PROVIDER: AIProvider = {
  id: "builtin-gemini",
  name: "Gemini (bawaan)",
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

/** Selalu mengembalikan minimal satu provider supaya UI tidak pernah kosong. */
export function getProviderList(settings: Settings): AIProvider[] {
  const list = settings.providers;
  if (!Array.isArray(list) || list.length === 0) {
    return [BUILTIN_GEMINI_PROVIDER];
  }
  return list;
}

/** Provider aktif, dengan fallback aman ke entri pertama. */
export function getActiveProvider(settings: Settings): AIProvider {
  const list = getProviderList(settings);
  return list.find((p) => p.id === settings.activeProviderId) || list[0];
}

export function makeProviderId(): string {
  return `prov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
