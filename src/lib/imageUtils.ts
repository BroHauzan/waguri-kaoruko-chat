import { ImageAttachment } from "../types";

/** Batas sisi terpanjang gambar setelah dikompres. */
const MAX_DIMENSION = 1024;
/** Kualitas JPEG hasil kompresi (0-1). */
const JPEG_QUALITY = 0.82;
/** Batas ukuran file mentah yang diterima (sebelum dikompres). */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
/** Batas khusus GIF. GIF tidak dikompres (kompresi membekukan animasinya),
 *  jadi ukurannya harus dibatasi jauh lebih ketat — base64-nya masuk utuh ke
 *  localStorage yang kuotanya hanya ~5 MB. */
const MAX_GIF_BYTES = 2 * 1024 * 1024; // 2 MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("File bukan gambar yang valid."));
    img.src = dataUrl;
  });
}

/**
 * Ubah file gambar jadi lampiran siap kirim.
 *
 * Gambar dikecilkan dan dikompres dulu. Ini bukan sekadar optimasi: seluruh
 * chat disimpan di localStorage yang kuotanya hanya ~5 MB, jadi satu foto
 * kamera 4 MB mentah bisa langsung menghabiskan jatah seluruh percakapan.
 * GIF dilewatkan tanpa kompresi supaya animasinya tidak hilang.
 */
export async function fileToImageAttachment(
  file: File
): Promise<ImageAttachment> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File yang dipilih bukan gambar.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran gambar terlalu besar (maks ${Math.round(
        MAX_UPLOAD_BYTES / 1024 / 1024
      )} MB).`
    );
  }

  const originalDataUrl = await readAsDataUrl(file);

  // GIF: pertahankan apa adanya, kompresi akan membekukan animasinya.
  if (file.type === "image/gif") {
    if (file.size > MAX_GIF_BYTES) {
      throw new Error(
        `GIF terlalu besar (maks ${Math.round(
          MAX_GIF_BYTES / 1024 / 1024
        )} MB). GIF tidak dikompres agar animasinya tetap jalan.`
      );
    }
    const base64 = originalDataUrl.split(",")[1] || "";
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataUrl: originalDataUrl,
      base64,
      mimeType: file.type,
      size: file.size,
    };
  }

  const img = await loadImage(originalDataUrl);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(img.width || 1, img.height || 1)
  );
  const targetW = Math.max(1, Math.round((img.width || 1) * scale));
  const targetH = Math.max(1, Math.round((img.height || 1) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas tidak tersedia — kirim file aslinya saja.
    const base64 = originalDataUrl.split(",")[1] || "";
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataUrl: originalDataUrl,
      base64,
      mimeType: file.type,
      size: file.size,
    };
  }

  // Latar putih supaya PNG transparan tidak jadi hitam saat dikonversi JPEG.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Selalu keluarkan JPEG. Mempertahankan PNG untuk gambar ber-transparansi
  // terdengar benar, tapi screenshot PNG bisa tetap multi-MB setelah
  // diperkecil — dan base64-nya lalu memblokir main thread saat disimpan.
  // JPEG jauh lebih kecil dan cukup untuk keperluan chat.
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  const base64 = dataUrl.split(",")[1] || "";
  // Perkiraan ukuran byte dari panjang base64.
  const size = Math.round((base64.length * 3) / 4);

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    base64,
    mimeType: "image/jpeg",
    size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Kompres file foto yang diunggah untuk avatar profil / karakter (PFP).
 * Dipotong / discale menjadi persegi beresolusi optimal (maks 400x400)
 * dengan kompresi JPEG kualitas 0.82 agar sangat ringan disimpan di localStorage (~20-40 KB).
 */
export async function compressAvatarImage(
  file: File,
  maxSize: number = 400,
  quality: number = 0.82
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File yang dipilih bukan gambar.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran file terlalu besar (maks ${Math.round(
        MAX_UPLOAD_BYTES / 1024 / 1024
      )} MB).`
    );
  }

  const rawDataUrl = await readAsDataUrl(file);
  const img = await loadImage(rawDataUrl);

  const origW = img.width || 1;
  const origH = img.height || 1;

  // Crop tengah menjadi square 1:1 untuk profile photo
  const cropDim = Math.min(origW, origH);
  const cropX = Math.max(0, Math.round((origW - cropDim) / 2));
  const cropY = Math.max(0, Math.round((origH - cropDim) / 2));

  const targetDim = Math.min(maxSize, cropDim);

  const canvas = document.createElement("canvas");
  canvas.width = targetDim;
  canvas.height = targetDim;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return rawDataUrl;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetDim, targetDim);
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropDim,
    cropDim,
    0,
    0,
    targetDim,
    targetDim
  );

  return canvas.toDataURL("image/jpeg", quality);
}

