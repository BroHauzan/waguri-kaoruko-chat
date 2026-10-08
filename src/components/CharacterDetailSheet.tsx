import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  MoreHorizontal,
  MessageCircle,
  Edit3,
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";
import { Character, Chat } from "../types";
import { getMoodTheme } from "../lib/moodConfig";
import { ScheduledTasksModal } from "./ScheduledTasksModal";
import { haptics } from "../lib/haptics";

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
  const [showScheduledTasks, setShowScheduledTasks] = useState(false);
  const [isExpandedProfileText, setIsExpandedProfileText] = useState(false);
  const currentEmotion = chat?.currentMood?.emotion || character.defaultMood || "neutral";
  const moodTheme = getMoodTheme(currentEmotion);
  const intensity = chat?.currentMood?.intensity ?? 7;
  const totalMessages = chat?.messages?.length || 0;
  const charMessages = (chat?.messages || []).filter((m) => m.role === "char");
  const lastCharMessage = charMessages.length > 0 ? charMessages[charMessages.length - 1] : null;

  const profileTextContent = (character.personality || character.tagline || "") + (character.speakingStyle || "");
  const isLongText = profileTextContent.length > 120;

  const handleShare = () => {
    haptics.light(true);
    if (navigator.share) {
      navigator
        .share({
          title: character.name,
          text: character.tagline || `Obrolan bersama ${character.name}`,
        })
        .catch(() => {});
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex justify-center lg:justify-end animate-fade-in overflow-y-auto">
        {/* Main Profile Panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md min-h-screen bg-[#F4F5F7] dark:bg-[#0B0C0F] text-neutral-900 dark:text-[#F2F3F7] flex flex-col pb-12 shadow-2xl overflow-x-hidden"
        >
          {/* ========================================================
              1. HEADER IMAGE WITH SMOOTH FADE (Minimalist Album Artwork)
              ======================================================== */}
          <div className="relative w-full h-[360px] sm:h-[390px] shrink-0 overflow-hidden bg-neutral-950">
            {/* Foto Profil Full-Bleed memudar halus ke arah bawah */}
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover object-top select-none"
              style={{
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
              }}
            />

            {/* Gradient Overlay Lembut untuk Kontras Navigasi Atas */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Gradient Overlay Lembut Bawah menyatu ke Background */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#F4F5F7]/80 to-[#F4F5F7] dark:via-[#0B0C0F]/80 dark:to-[#0B0C0F] pointer-events-none" />

            {/* Top Navigation Bar Minimalis */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Kembali"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onEditCharacter?.();
                }}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Edit Karakter"
                title="Edit Karakter"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* ========================================================
              2. TYPOGRAPHY & DETAIL INFO (Clean, No-Pill Minimalist)
              ======================================================== */}
          <div className="px-5 -mt-10 relative z-10 flex flex-col gap-4">
            {/* Header Text Block (Murni Tipografi Bersih) */}
            <div className="flex flex-col gap-1">
              {/* Status Online & Metadata (Teks Inline Elegan, Tanpa Kapsul Shape) */}
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-[#8A8A93]">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
                {character.category && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span>{character.category}</span>
                  </>
                )}
                {character.relationship && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="truncate max-w-[220px]">{character.relationship}</span>
                  </>
                )}
              </div>

              {/* Nama Karakter */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-[#F2F3F7] tracking-tight leading-tight">
                {character.name}
              </h1>

              {/* Tagline / Deskripsi Singkat */}
              {character.tagline && (
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-[#A1A2AA] leading-relaxed mt-0.5">
                  {character.tagline}
                </p>
              )}
            </div>

            {/* Quick Action Buttons Minimalis */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onStartChat();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <MessageCircle size={16} />
                <span>Obrolan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onEditCharacter?.();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-200/70 dark:bg-white/[0.06] hover:bg-neutral-300/70 dark:hover:bg-white/[0.1] text-neutral-800 dark:text-[#E4E5EA] font-semibold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <Edit3 size={15} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-200/70 dark:bg-white/[0.06] hover:bg-neutral-300/70 dark:hover:bg-white/[0.1] text-neutral-800 dark:text-[#E4E5EA] font-semibold text-xs transition-colors cursor-pointer active:scale-95"
              >
                <Share2 size={15} />
                <span>Bagikan</span>
              </button>
            </div>

            {/* Jadwal Rutin Otomatis */}
            <button
              type="button"
              onClick={() => {
                haptics.light(true);
                setShowScheduledTasks(true);
              }}
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#16171B] hover:bg-neutral-50 dark:hover:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-[#F5B838] shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-[#F2F3F7] leading-tight">
                    Jadwal Rutin Otomatis
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93] mt-0.5">
                    Sapaan pagi, malam, atau waktu tertentu
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
            </button>

            {/* Kondisi Perasaan Saat Ini */}
            <div className="bg-white dark:bg-[#16171B] rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-[#E4E5EA]">
                  <Activity size={15} className="text-[#F5B838]" />
                  <span>Kondisi Perasaan</span>
                </div>
                <span className="text-neutral-600 dark:text-[#A1A2AA] font-medium">
                  {moodTheme.label}
                </span>
              </div>

              {/* Intensity Meter Minimalis */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                  <span>Intensitas</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                    {intensity} / 10
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-white/[0.08] overflow-hidden">
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
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] font-semibold text-neutral-400 dark:text-[#8A8A93] uppercase tracking-wider block mb-1">
                  Ekspresi Terakhir
                </span>
                <p className="text-xs italic text-neutral-700 dark:text-[#D1D2D9] leading-relaxed break-words whitespace-pre-wrap">
                  "{lastCharMessage ? lastCharMessage.text : character.greeting}"
                </p>
              </div>
            </div>

            {/* Memori Obrolan */}
            <div className="bg-white dark:bg-[#16171B] rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-[#E4E5EA]">
                  <BookOpen size={15} className="text-[#F5B838]" />
                  <span>Memori Obrolan</span>
                </div>
                {chat?.lastSummarizedDate && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Tersimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 dark:text-[#A1A2AA] leading-relaxed">
                {chat?.summary
                  ? chat.summary
                  : totalMessages > 1
                  ? `Telah bertukar ${totalMessages} pesan. Percakapan akan dirangkum otomatis saat ganti hari.`
                  : "Belum ada riwayat percakapan panjang."}
              </p>
            </div>

            {/* Kepribadian & Gaya Bicara */}
            <div className="bg-white dark:bg-[#16171B] rounded-2xl p-4 border border-black/5 dark:border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-[#E4E5EA]">
                <Sparkles size={15} className="text-[#F5B838]" />
                <span>Kepribadian & Gaya Bicara</span>
              </div>

              <div
                className={`relative transition-all duration-300 ${
                  !isExpandedProfileText && isLongText
                    ? "max-h-24 overflow-hidden"
                    : ""
                }`}
              >
                <p className="text-xs text-neutral-600 dark:text-[#A1A2AA] leading-relaxed whitespace-pre-line">
                  {character.personality || character.tagline}
                </p>
                {character.speakingStyle && (
                  <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-500 dark:text-[#8A8A93]">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Gaya Bicara:{" "}
                    </span>
                    {character.speakingStyle}
                  </div>
                )}

                {/* Fade out mask ke bawah jika teks panjang dan belum diekspansi */}
                {!isExpandedProfileText && isLongText && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#16171B] to-transparent pointer-events-none" />
                )}
              </div>

              {/* Tombol Baca Lebih Banyak / Sembunyikan */}
              {isLongText && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.light(true);
                    setIsExpandedProfileText((prev) => !prev);
                  }}
                  className="mt-0.5 text-[11px] font-semibold text-[#F5B838] hover:text-[#E5A929] flex items-center gap-1 cursor-pointer transition-colors self-start select-none"
                >
                  <span>
                    {isExpandedProfileText ? "Sembunyikan" : "Baca lebih banyak"}
                  </span>
                  {isExpandedProfileText ? (
                    <ChevronUp size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                </button>
              )}
            </div>

            {/* Statistik Emosi */}
            {onOpenMoodStats && (
              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onOpenMoodStats();
                }}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#16171B] hover:bg-neutral-50 dark:hover:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-neutral-700 dark:text-[#C9CAD1] font-semibold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={16} className="text-[#F5B838]" />
                  <span>Grafik tren & statistik emosi</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-600" />
              </button>
            )}

            {/* Bottom Sticky Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onStartChat();
                }}
                className="w-full py-3 rounded-xl bg-[#F5B838] hover:bg-[#E5A929] active:scale-98 text-neutral-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <MessageCircle size={16} />
                <span>Mulai Percakapan</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scheduled Tasks Modal */}
      <ScheduledTasksModal
        isOpen={showScheduledTasks}
        onClose={() => setShowScheduledTasks(false)}
        character={character}
      />
    </>
  );
};
