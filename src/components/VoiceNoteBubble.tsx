import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { AudioAttachment } from "../types";
import { formatDuration } from "../lib/audioUtils";
import { haptics } from "../lib/haptics";

interface VoiceNoteBubbleProps {
  audio: AudioAttachment;
  /** Warna aksen mengikuti sisi pengirim. */
  isUser: boolean;
  /** Ikut menghormati preferensi getaran user. */
  hapticEnabled?: boolean;
}

/**
 * Pemutar voice note dengan waveform asli dari rekaman.
 *
 * Progress ditampilkan dengan mewarnai bar yang sudah dilewati, bukan
 * memindahkan satu indikator — cara ini membuat posisi terlihat jelas
 * tanpa perlu garis penanda tambahan.
 */
export const VoiceNoteBubble: React.FC<VoiceNoteBubbleProps> = ({
  audio,
  isUser,
  hapticEnabled = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  /** Bar terakhir yang sudah dilewati, untuk mendeteksi puncak amplitudo. */
  const lastBarRef = useRef(0);

  // Berhenti dan bersihkan saat bubble dilepas.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const trackProgress = () => {
    const el = audioRef.current;
    if (!el) return;

    const dur = el.duration || audio.duration || 1;
    const next = Math.min(1, el.currentTime / dur);
    setProgress(next);

    // Haptic halus saat playback melewati puncak amplitudo, mengikuti spec
    // WhatsApp. Hanya di puncak yang benar-benar tinggi supaya tidak berisik.
    const barIndex = Math.floor(next * audio.waveform.length);
    if (barIndex !== lastBarRef.current) {
      lastBarRef.current = barIndex;
      const peak = audio.waveform[barIndex];
      if (typeof peak === "number" && peak > 0.85) {
        haptics.light(hapticEnabled);
      }
    }

    rafRef.current = requestAnimationFrame(trackProgress);
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Kalau sudah habis, putar dari awal lagi.
    if (el.ended || el.currentTime >= (el.duration || audio.duration)) {
      el.currentTime = 0;
      lastBarRef.current = 0;
    }

    el.play()
      .then(() => {
        setIsPlaying(true);
        trackProgress();
      })
      .catch(() => {
        setIsPlaying(false);
      });
  };

  const bars = audio.waveform.length > 0 ? audio.waveform : Array(40).fill(0.3);
  const playedBars = Math.floor(progress * bars.length);

  // Warna bar yang belum dilewati: gelap di bubble amber milik user,
  // terang di bubble karakter.
  const idleBarClass = isUser
    ? "bg-neutral-900/35"
    : "bg-neutral-300 dark:bg-white/25";
  const activeBarClass = isUser ? "bg-neutral-900" : "bg-[#E5A929]";

  return (
    <div className="flex items-center gap-2.5 min-w-[190px]">
      <audio
        ref={audioRef}
        src={audio.dataUrl}
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          lastBarRef.current = 0;
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        }}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer ${
          isUser
            ? "bg-neutral-900/15 text-neutral-900"
            : "bg-[#F5B838] text-neutral-950"
        }`}
        aria-label={isPlaying ? "Jeda" : "Putar"}
      >
        {isPlaying ? (
          <Pause size={14} />
        ) : (
          <Play size={14} className="translate-x-[1px]" />
        )}
      </button>

      {/* Waveform: bar yang sudah dilewati berubah warna */}
      <div className="flex items-center gap-[2px] h-7 flex-1">
        {bars.map((level, i) => (
          <span
            key={i}
            style={{ height: `${Math.max(3, level * 26)}px` }}
            className={`w-[2.5px] rounded-full transition-colors duration-150 ${
              i < playedBars ? activeBarClass : idleBarClass
            }`}
          />
        ))}
      </div>

      <span
        className={`text-[11px] font-semibold tabular-nums shrink-0 ${
          isUser ? "text-neutral-900/70" : "text-neutral-500 dark:text-[#8A8A93]"
        }`}
      >
        {formatDuration(audio.duration)}
      </span>
    </div>
  );
};
