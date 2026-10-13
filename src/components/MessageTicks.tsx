import React from "react";
import { Check, CheckCheck } from "lucide-react";

export type ReadState = "sending" | "sent" | "read";

interface MessageTicksProps {
  state: ReadState;
  /** `onBubble` = berada di dalam bubble berwarna, `onCanvas` = di latar biasa. */
  tone?: "onBubble" | "onCanvas";
  /** Menandakan apakah bubble user berlatar gelap (text-white) */
  isDarkBubble?: boolean;
}

/**
 * Indikator status pesan, ditiru dari centang WhatsApp.
 *
 * WhatsApp memakai biru `#53BDEB` untuk status dibaca. Di app ini warna
 * brand-nya amber, jadi status dibaca memakai amber agar tetap konsisten
 * dengan identitas sendiri — polanya sama, warnanya milik kita.
 *
 * - satu centang  = terkirim ke server
 * - dua centang   = karakter sudah membalas (menandakan pesan terbaca)
 * - jam pasir     = masih diproses
 */
export const MessageTicks: React.FC<MessageTicksProps> = ({
  state,
  tone = "onCanvas",
  isDarkBubble = false,
}) => {
  // Di atas bubble, sesuaikan warna dengan keterbacaan (terang vs gelap)
  const sentClass =
    tone === "onBubble"
      ? isDarkBubble
        ? "text-white/60"
        : "text-neutral-900/55"
      : "text-neutral-400 dark:text-[#71717A]";
  const readClass =
    tone === "onBubble"
      ? isDarkBubble
        ? "text-white"
        : "text-neutral-900"
      : "text-[#E5A929]";

  if (state === "sending") {
    return (
      <span
        className={`text-[10px] leading-none ${sentClass}`}
        aria-label="Mengirim"
      >
        ⏱
      </span>
    );
  }

  if (state === "read") {
    return (
      <CheckCheck
        size={14}
        strokeWidth={2.6}
        className={readClass}
        aria-label="Sudah dibaca"
      />
    );
  }

  return (
    <Check
      size={14}
      strokeWidth={2.6}
      className={sentClass}
      aria-label="Terkirim"
    />
  );
};
