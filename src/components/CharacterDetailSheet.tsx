import React from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  MessageCircle,
  Compass,
  Share2,
  Star,
  ChevronRight,
  Sparkles,
  Edit,
} from "lucide-react";
import { Character } from "../types";

interface CharacterDetailSheetProps {
  character: Character;
  onClose: () => void;
  onStartChat: () => void;
  onOpenMoodStats?: () => void;
  onEditCharacter?: () => void;
}

export const CharacterDetailSheet: React.FC<CharacterDetailSheetProps> = ({
  character,
  onClose,
  onStartChat,
  onOpenMoodStats,
  onEditCharacter,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex justify-center animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md min-h-screen bg-[#F4F5F7] dark:bg-[#0B0C0F] flex flex-col pb-8">
        {/* Top Portrait Character Photo Banner (Matching Screen 1) */}
        <div className="relative w-full h-[360px] bg-neutral-900 shrink-0">
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

          {/* Floating Circle Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-800 dark:text-white hover:bg-white dark:hover:bg-black/70 active:scale-95 transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Floating Circle Options Button */}
          <button
            type="button"
            onClick={onEditCharacter}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-800 dark:text-white hover:bg-white dark:hover:bg-black/70 active:scale-95 transition-all cursor-pointer"
            aria-label="Edit Karakter"
            title="Edit Karakter"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Overlapping White Sheet (Screen 1) */}
        <div className="relative -mt-8 flex-1 bg-white dark:bg-[#16171B] rounded-t-[32px] px-5 pt-6 shadow-xl flex flex-col gap-4">
          {/* Amber Golden Card (Screen 1 Header) */}
          <div className="bg-[#F5B838] rounded-[24px] p-4 text-neutral-900 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold tracking-tight text-neutral-900 truncate">
                {character.name}
              </h2>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-neutral-900 shadow-2xs shrink-0">
                Online
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900/90">
              <span>Rating</span>
              <div className="flex items-center text-neutral-900">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="fill-neutral-900 text-neutral-900" />
                ))}
              </div>
            </div>
          </div>

          {/* Action Circles Row (Screen 1) */}
          <div className="flex items-center justify-around py-2">
            {/* Contact / Chat Button */}
            <button
              type="button"
              onClick={onStartChat}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#F5B838] text-neutral-950 flex items-center justify-center shadow-sm group-hover:bg-[#E5A929] group-active:scale-95 transition-all">
                <MessageCircle size={22} />
              </div>
              <span className="text-[12px] font-bold text-neutral-800 dark:text-[#E4E5EA]">Obrolan</span>
            </button>

            {/* Direction / Detail Button */}
            <button
              type="button"
              onClick={onEditCharacter}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center shadow-2xs group-hover:bg-neutral-200 dark:group-hover:bg-white/[0.14] group-active:scale-95 transition-all">
                <Compass size={22} />
              </div>
              <span className="text-[12px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">Detail</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: character.name,
                    text: character.tagline,
                  }).catch(() => {});
                }
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center shadow-2xs group-hover:bg-neutral-200 dark:group-hover:bg-white/[0.14] group-active:scale-95 transition-all">
                <Share2 size={22} />
              </div>
              <span className="text-[12px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">Bagikan</span>
            </button>
          </div>

          {/* Overall Analysis / Mood Stats Link */}
          {onOpenMoodStats && (
            <button
              type="button"
              onClick={onOpenMoodStats}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#F5B838]" />
                <span>Lihat tren & statistik mood karakter</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400 dark:text-[#71717A]" />
            </button>
          )}

          {/* Details Card (Screen 1 bottom card) */}
          <div className="bg-[#F8F9FA] dark:bg-[#1C1D22] rounded-[24px] p-4 border border-black/5 dark:border-white/10 flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
              Tentang Karakter
            </h3>

            <p className="text-[13px] text-neutral-600 dark:text-[#9B9BA3] leading-relaxed">
              {character.personality || character.tagline}
            </p>

            <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-neutral-900 dark:text-[#F2F3F7]">
                    Sapaan Khas
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93] line-clamp-1">
                    "{character.greeting}"
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartChat}
                className="px-4 py-2 rounded-full bg-[#F5B838] text-neutral-900 text-xs font-bold shadow-xs hover:bg-[#E5A929] active:scale-95 transition-all cursor-pointer"
              >
                Mulai Obrolan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
