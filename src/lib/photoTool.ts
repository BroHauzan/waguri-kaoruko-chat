import { GoogleGenAI } from "@google/genai";
import { Character } from "../types";

export const photoTools = [
  {
    functionDeclarations: [
      {
        name: "send_photo",
        description:
          "Panggil fungsi ini saat pengguna meminta foto, selfie, PAP, atau foto suasana di sekitar karakter.",
        parameters: {
          type: "OBJECT",
          properties: {
            sceneDescription: {
              type: "STRING",
              description:
                "Deskripsi situasi/tempat/latar foto dalam bahasa Inggris (misal: sitting in high school classroom, holding a test paper, smiling shyly).",
            },
            caption: {
              type: "STRING",
              description:
                "Pesan teks yang diucapkan karakter saat mengirim foto ini (sesuai persona).",
            },
          },
          required: ["sceneDescription", "caption"],
        },
      },
    ],
  },
];

/**
 * Menyusun prompt visual terstruktur dan menghasilkan gambar karakter menggunakan Imagen 3.
 */
export async function generateCharacterPhoto(
  character: Character,
  sceneDescription: string,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const visual = character.visualProfile;

  const visualPrompt = visual
    ? `${character.name}, ${visual.hair}, ${visual.eyes}, wearing ${visual.schoolUniform}, ${visual.generalLook}`
    : `${character.name}, high quality anime aesthetic`;

  const finalPrompt = [
    "masterpiece, anime aesthetic, high quality key visual, solo",
    visualPrompt,
    `scene: ${sceneDescription}`,
    `POV phone camera selfie / candid mobile snapshot, natural daylight, depth of field`,
    "clean lines, vibrant colors",
  ].join(", ");

  try {
    // Model Imagen 3 default: imagen-3.0-generate-002
    const result = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "9:16",
        outputMimeType: "image/jpeg",
      },
    });

    const base64Data = result?.generatedImages?.[0]?.image?.imageBytes;
    if (base64Data) {
      return `data:image/jpeg;base64,${base64Data}`;
    }
  } catch (err: any) {
    console.warn("Imagen 3 generateImages error, attempting fallback...", err?.message || err);

    // Fallback percobaan dengan flash image model jika imagen quota/region issue
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: finalPrompt,
      });

      for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
    } catch (fallbackErr: any) {
      console.error("All image generation models failed:", fallbackErr?.message || fallbackErr);
    }

    throw new Error(
      "Gagal menghasilkan foto karakter. Layanan pembuatan gambar sedang sibuk."
    );
  }

  throw new Error("Tidak ada gambar yang berhasil dihasilkan.");
}
