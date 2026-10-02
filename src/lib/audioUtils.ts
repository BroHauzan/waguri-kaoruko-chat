import { AudioAttachment } from "../types";

/**
 * Format yang benar-benar diterima Gemini untuk audio inline:
 * WAV, MP3, AIFF, AAC, OGG, FLAC.
 *
 * MediaRecorder di browser hanya menghasilkan webm/opus atau mp4 — DUA-DUANYA
 * tidak ada di daftar itu. Jadi rekaman wajib dikonversi dulu ke WAV sebelum
 * dikirim, kalau tidak API akan menolaknya.
 */
export const TARGET_SAMPLE_RATE = 16000;
export const MAX_RECORDING_SECONDS = 60;
/** Batas aman payload: audio inline Gemini maksimal 20 MB per request. */
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

/** Cari MIME type rekaman yang didukung browser ini. */
export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/**
 * Decode blob rekaman jadi AudioBuffer.
 *
 * decodeAudioData butuh salinan buffer tersendiri karena ia "mengambil alih"
 * ArrayBuffer yang diberikan — memakai buffer yang sama dua kali akan gagal.
 */
async function decodeBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtx) {
    throw new Error("Browser ini tidak mendukung pemrosesan audio.");
  }

  const ctx = new AudioCtx();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    // Tutup segera; kita hanya butuh hasil decode-nya.
    ctx.close().catch(() => {});
  }
}

/**
 * Ubah AudioBuffer jadi WAV 16-bit PCM mono pada 16 kHz.
 *
 * Mono 16 kHz dipilih karena itu yang dipakai layanan transkripsi dan
 * cukup untuk suara manusia — sekaligus menjaga payload tetap kecil
 * (~32 KB per detik).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const sourceRate = buffer.sampleRate;
  const sourceLength = buffer.length;

  // Rata-ratakan semua kanal jadi mono.
  const channels = buffer.numberOfChannels;
  const mono = new Float32Array(sourceLength);
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < sourceLength; i++) {
      mono[i] += data[i] / channels;
    }
  }

  // Resample sederhana dengan interpolasi linear. Kualitasnya memadai untuk
  // suara percakapan dan jauh lebih murah daripada resampler penuh.
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const targetLength = Math.max(1, Math.floor(sourceLength / ratio));
  const resampled = new Int16Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;
    const a = mono[srcIndex] ?? 0;
    const b = mono[srcIndex + 1] ?? a;
    const sample = a + (b - a) * frac;

    // Klip ke rentang [-1, 1] lalu skala ke int16.
    const clamped = Math.max(-1, Math.min(1, sample));
    resampled[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  // Susun header WAV 44 byte standar.
  const dataSize = resampled.length * 2;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // ukuran blok fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true); // byte per detik
  view.setUint16(32, 2, true); // penyelarasan blok
  view.setUint16(34, 16, true); // bit per sampel
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  return new Blob([header, resampled.buffer], { type: "audio/wav" });
}

/**
 * Hitung waveform dari amplitudo asli, bukan tinggi acak.
 *
 * Hasilnya array nilai 0-1 yang dipakai untuk menggambar bar. Sampling
 * diambil dari puncak tiap segmen supaya bentuknya menyerupai suara asli.
 */
function extractWaveform(buffer: AudioBuffer, bars = 40): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / bars) || 1;
  const peaks: number[] = [];

  for (let i = 0; i < bars; i++) {
    const start = i * blockSize;
    let peak = 0;
    for (let j = 0; j < blockSize && start + j < data.length; j++) {
      const value = Math.abs(data[start + j]);
      if (value > peak) peak = value;
    }
    peaks.push(peak);
  }

  // Normalisasi supaya bar tertinggi selalu penuh, dan beri lantai minimum
  // agar bar pendek tetap terlihat.
  const max = Math.max(...peaks, 0.01);
  return peaks.map((p) => Math.max(0.12, Math.min(1, p / max)));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca rekaman suara."));
    reader.readAsDataURL(blob);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca rekaman suara."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Ubah blob rekaman jadi lampiran siap kirim.
 *
 * Rekaman dikonversi ke WAV 16 kHz mono karena:
 * 1. Gemini tidak menerima webm/opus hasil MediaRecorder.
 * 2. WAV bisa diputar di semua browser tanpa konversi tambahan.
 */
export async function blobToAudioAttachment(
  blob: Blob,
  fallbackDuration: number
): Promise<AudioAttachment> {
  const buffer = await decodeBlob(blob);

  const wavBlob = audioBufferToWav(buffer);
  if (wavBlob.size > MAX_AUDIO_BYTES) {
    throw new Error(
      `Rekaman terlalu besar (${Math.round(
        wavBlob.size / 1024 / 1024
      )} MB). Coba rekam lebih pendek.`
    );
  }

  const [base64, dataUrl] = await Promise.all([
    blobToBase64(wavBlob),
    blobToDataUrl(wavBlob),
  ]);

  return {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    base64,
    mimeType: "audio/wav",
    // Durasi dari buffer lebih akurat daripada penghitung waktu di UI.
    duration: buffer.duration || fallbackDuration,
    waveform: extractWaveform(buffer),
    size: wavBlob.size,
  };
}

/** Format detik jadi "0:07" untuk ditampilkan di bubble. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
