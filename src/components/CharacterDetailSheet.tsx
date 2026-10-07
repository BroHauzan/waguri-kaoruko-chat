import React, { useState } from "react";
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
} from "lucide-react";
import { Character, Chat } from "../types";
import { getMoodTheme } from "../lib/moodConfig";
import { ScheduledTasksModal } from "./ScheduledTasksModal";

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
  const currentEmotion = chat?.currentMood?.emotion || character.defaultMood || "neutral";
  const moodTheme = getMoodTheme(currentEmotion);
  const intensity = chat?.currentMood?.intensity ?? 7;
  const totalMessages = chat?.messages?.length || 0;
  const charMessages = (chat?.messages || []).filter((m) => m.role === "char");
  const lastCharMessage = charMessages.length > 0 ? charMessages[charMessages.length - 1] : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex justify-center lg:justify-end animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-md min-h-screen bg-neutral-100 dark:bg-[#0B0C0F] flex flex-col pb-10">
          {/* Top Portrait Character Photo Banner */}
          <div className="relative w-full h-[320px] bg-neutral-900 shrink-0">
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 left-5 w-9 h-9 rounded-lg bg-neutral-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-neutral-900/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Options / Edit Button */}
            <button
              type="button"
              onClick={onEditCharacter}
              className="absolute top-5 right-5 w-9 h-9 rounded-lg bg-neutral-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-neutral-900/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Edit Karakter"
              title="Edit Karakter"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Overlapping Content Sheet */}
          <div className="relative -mt-6 flex-1 bg-white dark:bg-[#141518] rounded-t-2xl px-5 pt-5 shadow-xl flex flex-col gap-3.5 border-t border-black/5 dark:border-white/10">
            {/* Header Card */}
            <div className="bg-neutral-50 dark:bg-[#1B1C22] rounded-xl p-4 border border-black/5 dark:border-white/10 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {character.name}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {character.tagline}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-medium px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {character.category}
                </span>
                <span>•</span>
                <span className="truncate">{character.relationship || "Teman Bicara"}</span>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onStartChat}
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-xs gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle size={18} />
                <span>Obrolan</span>
              </button>

              <button
                type="button"
                onClick={onEditCharacter}
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs gap-1.5 border border-black/5 dark:border-white/10 transition-colors cursor-pointer"
              >
                <Edit3 size={18} />
                <span>Edit</span>
              </button>

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
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs gap-1.5 border border-black/5 dark:border-white/10 transition-colors cursor-pointer"
              >
                <Share2 size={18} />
                <span>Bagikan</span>
              </button>
            </div>

            {/* Scheduled Tasks Entry Button */}
            <button
              type="button"
              onClick={() => setShowScheduledTasks(true)}
              className="w-full py-3 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#1B1C22] hover:bg-neutral-100 dark:hover:bg-[#22242B] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-amber-500" />
                <span>Instruksi & Jadwal Rutin Otomatis</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" />
            </button>

            {/* Section: Status Perasaan */}
            <div className="bg-neutral-50 dark:bg-[#1B1C22] rounded-xl p-4 border border-black/5 dark:border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-amber-500" />
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Kondisi Perasaan Saat Ini
                  </h3>
                </div>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  {moodTheme.label}
                </span>
              </div>

              {/* Emotion Intensity Meter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Intensitas Emosi</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {intensity} / 10
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
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
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Ekspresi Terakhir
                </span>
                <p className="text-xs italic text-neutral-700 dark:text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">
                  "{lastCharMessage ? lastCharMessage.text : character.greeting}"
                </p>
              </div>
            </div>

            {/* Section: Ringkasan Memori Obrolan */}
            <div className="bg-neutral-50 dark:bg-[#1B1C22] rounded-xl p-4 border border-black/5 dark:border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-500" />
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Memori & Topik Obrolan
                  </h3>
                </div>
                {chat?.lastSummarizedDate && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Tersimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {chat?.summary
                  ? chat.summary
                  : totalMessages > 1
                  ? `Telah bertukar ${totalMessages} pesan. Percakapan dari hari kemarin akan dirangkum otomatis menjadi ingatan abadi karakter saat ganti hari.`
                  : "Belum ada riwayat percakapan panjang. Obrolan akan diingat secara otomatis untuk menjaga kesinambungan topik."}
              </p>
            </div>

            {/* Section: Kepribadian */}
            <div className="bg-neutral-50 dark:bg-[#1B1C22] rounded-xl p-4 border border-black/5 dark:border-white/10 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Kepribadian & Gaya Bicara
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {character.personality || character.tagline}
              </p>
              {character.speakingStyle && (
                <div className="pt-2 border-t border-black/5 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Gaya Bicara: </span>
                  {character.speakingStyle}
                </div>
              )}
            </div>

            {/* Link to Mood Statistics */}
            {onOpenMoodStats && (
              <button
                type="button"
                onClick={onOpenMoodStats}
                className="w-full py-3 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#1B1C22] hover:bg-neutral-100 dark:hover:bg-[#22242B] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" />
                  <span>Grafik tren & dinamika emosi</span>
                </div>
                <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" />
              </button>
            )}

            {/* Bottom Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onStartChat}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-neutral-950 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                <span>Mulai Obrolan</span>
              </button>
            </div>
          </div>
        </div>
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
