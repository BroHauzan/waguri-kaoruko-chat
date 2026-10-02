import React, { useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Character } from "../types";

interface InAppNotificationBannerProps {
  character: Character;
  messageText: string;
  onClick: () => void;
  onDismiss: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  character,
  messageText,
  onClick,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-3 inset-x-0 z-[100] px-4 pointer-events-none flex justify-center animate-slide-down">
      <div
        onClick={onClick}
        className="pointer-events-auto w-full max-w-sm bg-white/95 dark:bg-[#16171B]/95 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl p-3 shadow-xl shadow-black/10 dark:shadow-black/50 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1C1D22] active:scale-[0.98] transition-all"
      >
        {/* Character Avatar with Online Dot */}
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10 shadow-2xs">
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16171B]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight truncate flex items-center gap-1.5">
              <span>{character.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F5B838] text-neutral-900 rounded-full">
                Baru
              </span>
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">sekarang</span>
          </div>
          <p className="text-[12px] text-neutral-600 dark:text-[#9B9BA3] line-clamp-1 leading-snug">
            {messageText}
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center text-neutral-600 dark:text-[#9B9BA3]">
            <ChevronRight size={15} />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="w-7 h-7 rounded-full hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 dark:text-[#71717A] hover:text-neutral-800 dark:hover:text-white transition-colors"
            aria-label="Tutup notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
