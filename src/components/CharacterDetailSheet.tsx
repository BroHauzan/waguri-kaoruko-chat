import React from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  MessageCircle,
  Edit3,
  Share2,
  ChevronRight,
  TrendingUp,
  Activity,
  BookOpen,
  Clock,
  Heart,
} from "lucide-react";
import { Character, Chat } from "../types";
import { getMoodTheme } from "../lib/moodConfig";

interface CharacterDetailSheetProps {
  character: Character;
  chat?: Chat;
  onClose: () => void;
  onStartChat: () => void;
  onOpenMoodStats?: () => void;
  onEditCharacter?: () => void;
}

export const CharacterDetailSheet: React.FC<CharacterDetailSheetProps> = ({
  character,
  chat,
  onClose,
  onStartChat,
  onOpenMoodStats,
  onEditCharacter,
}) => {
  const currentEmotion = chat?.currentMood?.emotion || character.defaultMood || "neutral";
  const moodTheme = getMoodTheme(currentEmotion);
  const intensity = chat?.currentMood?.intensity ?? 7;
  const totalMessages = chat?.messages?.length || 0;
  const charMessages = (chat?.messages || []).filter((m) => m.role === "char");
  const lastCharMessage = charMessages.length > 0 ? charMessages[charMessages.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex justify-center lg:justify-end animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md min-h-screen bg-[#F4F5F7] dark:bg-[#0B0C0F] flex flex-col pb-10">
        {/* Top Portrait Character Photo Banner */}
        <div className="relative w-full h-[340px] bg-neutral-900 shrink-0">
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

          {/* Floating Circle Options / Edit Button */}
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

        {/* Overlapping Content Sheet */}
        <div className="relative -mt-8 flex-1 bg-white dark:bg-[#16171B] rounded-t-[32px] px-5 pt-6 shadow-xl flex flex-col gap-4">
          {/* Main Card Header */}
          <div className="bg-[#F5B838] rounded-[24px] p-4 text-neutral-900 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold tracking-tight text-neutral-900 truncate">
                {character.name}
              </h2>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-neutral-900 shadow-2xs shrink-0">
                Online
              </span>
            </div>

            {/* Authentic Metadata */}
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900/90">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-950/10 text-neutral-950 font-medium">
                {character.category}
              </span>
              <span>•</span>
              <span className="truncate">{character.relationship || "Teman Bicara"}</span>
            </div>
          </div>

          {/* Action Circles Row */}
          <div className="flex items-center justify-around py-1">
            {/* Obrolan */}
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

            {/* Edit */}
            <button
              type="button"
              onClick={onEditCharacter}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center shadow-2xs group-hover:bg-neutral-200 dark:group-hover:bg-white/[0.14] group-active:scale-95 transition-all">
                <Edit3 size={20} />
              </div>
              <span className="text-[12px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">Edit</span>
            </button>

            {/* Bagikan */}
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

          {/* Section: Status & Perasaan Saat Ini (Dynamic Emotional Summary) */}
          <div className="bg-[#F8F9FA] dark:bg-[#1C1D22] rounded-[22px] p-4 border border-black/5 dark:border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#F5B838]" />
                <h3 className="text-[14px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                  Kondisi Perasaan Saat Ini
                </h3>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${moodTheme.badgeStyle}`}>
                <span>{moodTheme.emoji}</span>
                <span>{moodTheme.label}</span>
              </span>
            </div>

            {/* Emotion Intensity Meter */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A93]">
                <span>Intensitas Emosi</span>
                <span className="font-bold text-neutral-800 dark:text-[#E4E5EA]">
                  {intensity} / 10
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(10, intensity * 10))}%`,
                    backgroundColor: moodTheme.accentColor,
                  }}
                />
              </div>
            </div>

            {/* Recent Expression Quote */}
            <div className="pt-2 border-t border-black/5 dark:border-white/10">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-[#71717A] uppercase tracking-wider block mb-1">
                Ekspresi Terakhir
              </span>
              <p className="text-[13px] italic text-neutral-700 dark:text-[#D1D2D9] leading-relaxed line-clamp-2">
                "{lastCharMessage ? lastCharMessage.text : character.greeting}"
              </p>
            </div>
          </div>

          {/* Section: Ringkasan Memori Obrolan (Chat Summary) */}
          <div className="bg-[#F8F9FA] dark:bg-[#1C1D22] rounded-[22px] p-4 border border-black/5 dark:border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#F5B838]" />
                <h3 className="text-[14px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                  Memori & Topik Obrolan
                </h3>
              </div>
              {chat?.lastSummarizedDate && (
                <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Dirangkum otomatis
                </span>
              )}
            </div>
            <p className="text-[13px] text-neutral-600 dark:text-[#9B9BA3] leading-relaxed">
              {chat?.summary
                ? chat.summary
                : totalMessages > 1
                ? `Telah bertukar ${totalMessages} pesan. Percakapan dari hari kemarin akan dirangkum otomatis menjadi ingatan abadi karakter saat ganti hari.`
                : "Belum ada riwayat percakapan panjang. Obrolanmu akan diingat secara otomatis untuk menjaga kesinambungan topik."}
            </p>
          </div>

          {/* Section: Tentang Karakter & Kepribadian */}
          <div className="bg-[#F8F9FA] dark:bg-[#1C1D22] rounded-[22px] p-4 border border-black/5 dark:border-white/10 flex flex-col gap-2.5">
            <h3 className="text-[14px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
              Kepribadian & Gaya Bicara
            </h3>
            <p className="text-[13px] text-neutral-600 dark:text-[#9B9BA3] leading-relaxed">
              {character.personality || character.tagline}
            </p>
            {character.speakingStyle && (
              <div className="pt-2 border-t border-black/5 dark:border-white/10 text-xs text-neutral-500 dark:text-[#8A8A93]">
                <span className="font-semibold text-neutral-700 dark:text-[#C9CAD1]">Gaya Bicara: </span>
                {character.speakingStyle}
              </div>
            )}
          </div>

          {/* Link to Mood Statistics */}
          {onOpenMoodStats && (
            <button
              type="button"
              onClick={onOpenMoodStats}
              className="w-full py-3.5 px-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#F5B838]" />
                <span>Lihat grafik tren & dinamika emosi karakter</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400 dark:text-[#71717A]" />
            </button>
          )}

          {/* Bottom Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onStartChat}
              className="w-full py-3.5 rounded-full bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 text-sm font-bold shadow-xs active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              <span>Mulai Obrolan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
