import { GoogleGenAI, Type } from "@google/genai";
import { CharacterVisualProfile } from "../types";

export interface CharacterLoreResult {
  name: string;
  tagline: string;
  personality: string;
  speechStyle: string;
  firstMessage: string;
  visualProfile: CharacterVisualProfile;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Meriset profil karakter secara kanon dari internet menggunakan Google Search Grounding.
 * Mengutamakan pemanggilan ke endpoint backend /api/lore (memakai GEMINI_API_KEY server atau custom apiKey),
 * dengan fallback langsung ke client-side GoogleGenAI jika dibutuhkan.
 */
export async function fetchCharacterLore(
  characterName: string,
  apiKey?: string
): Promise<CharacterLoreResult> {
  const trimmedName = characterName.trim();
  if (!trimmedName) {
    throw new Error("Nama karakter harus diisi sebelum mencari data.");
  }

  // 1. Coba panggil backend API /api/lore terlebih dahulu
  try {
    const res = await fetch(`${API_BASE}/api/lore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterName: trimmedName, apiKey }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return data as CharacterLoreResult;
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.details || errData?.error) {
        console.warn("Backend /api/lore returned error:", errData);
      }
    }
  } catch (backendErr) {
    console.warn("Backend /api/lore unreachable, attempting client SDK direct call...", backendErr);
  }

  // 2. Client-side fallback jika backend gagal atau tidak tersedia tapi apiKey tersedia
  const keyToUse = apiKey || "";
  if (!keyToUse) {
    throw new Error(
      "Gagal mengambil lore dari server. Pastikan server dev berjalan atau masukkan API Key di Pengaturan > Provider AI."
    );
  }

  const ai = new GoogleGenAI({ apiKey: keyToUse });

  const prompt = `Cari informasi resmi atau kanon anime/manga/game tentang karakter: "${trimmedName}".
Dapatkan kepribadian, gaya bicara, latar belakang (nama sekolah/organisasi), dan ciri fisik lengkap (rambut, mata, seragam sekolah atau pakaian khas).`;

  let responseText = "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tagline: { type: Type.STRING },
            personality: { type: Type.STRING },
            speechStyle: { type: Type.STRING },
            firstMessage: { type: Type.STRING },
            visualProfile: {
              type: Type.OBJECT,
              properties: {
                hair: { type: Type.STRING, description: "Hair style and color in English" },
                eyes: { type: Type.STRING, description: "Eye color in English" },
                schoolName: { type: Type.STRING, description: "Name of school or affiliation" },
                schoolUniform: { type: Type.STRING, description: "Detailed uniform or main outfit in English" },
                generalLook: { type: Type.STRING, description: "General visual aesthetic" },
              },
              required: ["hair", "eyes", "schoolName", "schoolUniform", "generalLook"],
            },
          },
          required: [
            "name",
            "tagline",
            "personality",
            "speechStyle",
            "firstMessage",
            "visualProfile",
          ],
        },
      },
    });
    responseText = response.text || "";
  } catch (searchGroundingErr: any) {
    console.warn("Client search grounding failed, falling back to gemini-3.1-flash-lite...", searchGroundingErr?.message || searchGroundingErr);
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tagline: { type: Type.STRING },
            personality: { type: Type.STRING },
            speechStyle: { type: Type.STRING },
            firstMessage: { type: Type.STRING },
            visualProfile: {
              type: Type.OBJECT,
              properties: {
                hair: { type: Type.STRING, description: "Hair style and color in English" },
                eyes: { type: Type.STRING, description: "Eye color in English" },
                schoolName: { type: Type.STRING, description: "Name of school or affiliation" },
                schoolUniform: { type: Type.STRING, description: "Detailed uniform or main outfit in English" },
                generalLook: { type: Type.STRING, description: "General visual aesthetic" },
              },
              required: ["hair", "eyes", "schoolName", "schoolUniform", "generalLook"],
            },
          },
          required: [
            "name",
            "tagline",
            "personality",
            "speechStyle",
            "firstMessage",
            "visualProfile",
          ],
        },
      },
    });
    responseText = fallbackResponse.text || "";
  }

  const parsed = JSON.parse(responseText || "{}");
  return parsed as CharacterLoreResult;
}
