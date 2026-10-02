import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Mic } from "lucide-react";
import {
  MAX_RECORDING_SECONDS,
  pickRecorderMimeType,
  isRecordingSupported,
  formatDuration,
} from "../lib/audioUtils";
import { haptics } from "../lib/haptics";

interface VoiceRecorderProps {
  hapticEnabled: boolean;
  /** Dipanggil setelah rekaman selesai, dengan blob mentah dari browser. */
  onRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

/**
 * Perekam suara dengan pola tahan-untuk-merekam, seperti WhatsApp.
 *
 * Geser ke kiri melewati ambang batas akan membatalkan rekaman — inilah
 * gestur yang dipakai WhatsApp, dan alasannya penting: membatalkan harus
 * semudah menjauhkan jari, bukan mencari tombol kecil.
 */
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  hapticEnabled,
  onRecorded,
  onCancel,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [slideX, setSlideX] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  /** Rekaman tidak dimulai otomatis: user harus menekan tombol dulu supaya
   *  mikrofon tidak menyala tanpa sengaja. */
  const [hasStarted, setHasStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  /** Detik terakhir, dibaca oleh `onstop` yang butuh nilai paling baru. */
  const secondsRef = useRef(0);

  const CANCEL_THRESHOLD = 80;

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Mulai merekam hanya setelah user menekan tombol.
  useEffect(() => {
    if (!hasStarted) return;

    let isMounted = true;

    const start = async () => {
      if (!isRecordingSupported()) {
        setPermissionError("Browser ini tidak mendukung perekaman suara.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        // Analyser untuk waveform langsung, supaya bar bergerak mengikuti
        // suara asli — bukan animasi palsu.
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(data);
            // Ambil rata-rata pita rendah-menengah tempat suara manusia berada.
            let sum = 0;
            const count = 32;
            for (let i = 0; i < count; i++) sum += data[i];
            const avg = sum / count / 255;
            setLevels((prev) => [...prev.slice(-39), Math.max(0.1, avg)]);
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // Waveform langsung bersifat opsional; rekaman tetap jalan.
        }

        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined
        );

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          cleanup();
          if (!cancelledRef.current && blob.size > 0) {
            onRecorded(blob, secondsRef.current);
          } else {
            onCancel();
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        haptics.light(hapticEnabled);

        timerRef.current = window.setInterval(() => {
          setSeconds((s) => {
            const next = s + 1;
            if (next >= MAX_RECORDING_SECONDS) {
              // Batas tercapai — hentikan otomatis dan kirim.
              cancelledRef.current = false;
              mediaRecorderRef.current?.stop();
            }
            return next;
          });
        }, 1000);
      } catch (err: any) {
        if (!isMounted) return;
        const name = err?.name;
        setPermissionError(
          name === "NotAllowedError"
            ? "Izin mikrofon ditolak. Aktifkan di pengaturan browser untuk merekam suara."
            : name === "NotFoundError"
            ? "Tidak ada mikrofon yang terdeteksi."
            : "Gagal mengakses mikrofon."
        );
      }
    };

    start();

    return () => {
      isMounted = false;
      cancelledRef.current = true;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
    // Hanya bergantung pada `hasStarted`: memulai ulang rekaman tiap render
    // akan mematikan mikrofon berulang kali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Simpan titik awal supaya gerakan bisa dibandingkan terhadapnya.
    startXRef.current = e.clientX;
    setSlideX(0);
    // Tangkap pointer: tanpa ini, jari yang keluar dari elemen akan
    // memutus pelacakan dan pembatalan tidak terdeteksi.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    // Hanya geser ke kiri yang berarti membatalkan.
    setSlideX(Math.min(0, dx));
  };

  const handlePointerUp = () => {
    const shouldCancel = slideX < -CANCEL_THRESHOLD;
    cancelledRef.current = shouldCancel;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
      onCancel();
    }
  };

  const isCancelling = slideX < -CANCEL_THRESHOLD;

  if (permissionError) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto px-3 pb-3 animate-slide-up">
        <div className="bg-white dark:bg-[#16171B] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
              <Mic size={17} />
            </div>
            <p className="text-[13px] text-neutral-700 dark:text-[#C9CAD1] leading-relaxed pt-1">
              {permissionError}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-full bg-[#F5B838] text-neutral-950 font-bold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Layar awal: konfirmasi dulu sebelum mikrofon dinyalakan.
  if (!hasStarted) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto px-3 pb-3 animate-slide-up">
        <div className="bg-white dark:bg-[#16171B] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F5B838]/20 text-[#E5A929] flex items-center justify-center shrink-0">
              <Mic size={19} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                Kirim pesan suara
              </span>
              <span className="text-[12px] text-neutral-500 dark:text-[#8A8A93]">
                Maksimal {MAX_RECORDING_SECONDS} detik
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-full text-xs font-semibold text-neutral-600 dark:text-[#8A8A93] bg-[#F0F1F5] dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 transition-colors cursor-pointer"
            >
              Mulai Rekam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto px-3 pb-3 animate-slide-up">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="bg-white dark:bg-[#16171B] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-3 flex items-center gap-3 touch-none select-none"
      >
        {/* Indikator geser-untuk-batal */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isCancelling
              ? "bg-red-500 text-white"
              : "bg-red-50 dark:bg-red-500/15 text-red-500"
          }`}
        >
          <Trash2 size={17} />
        </div>

        {/* Titik merah berdenyut + timer */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[13px] font-semibold text-neutral-900 dark:text-[#F2F3F7] tabular-nums">
            {formatDuration(seconds)}
          </span>
        </div>

        {/* Waveform langsung dari mikrofon */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-8 overflow-hidden">
          {levels.length === 0 ? (
            <span className="text-[11px] text-neutral-400 dark:text-[#71717A]">
              Bicara sekarang...
            </span>
          ) : (
            levels.map((level, i) => (
              <span
                key={i}
                style={{ height: `${Math.max(3, level * 30)}px` }}
                className="w-[2.5px] rounded-full bg-[#F5B838] shrink-0"
              />
            ))
          )}
        </div>

        {/* Sisa waktu */}
        <span className="text-[11px] text-neutral-400 dark:text-[#71717A] tabular-nums shrink-0">
          -{formatDuration(Math.max(0, MAX_RECORDING_SECONDS - seconds))}
        </span>
      </div>

      <p
        className={`text-center text-[11px] mt-2 font-medium transition-colors ${
          isCancelling
            ? "text-red-500"
            : "text-neutral-500 dark:text-[#8A8A93]"
        }`}
      >
        {isCancelling
          ? "Lepas untuk membatalkan"
          : "Geser ke kiri untuk membatalkan · lepas untuk kirim"}
      </p>
    </div>
  );
};
