import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  MoreHorizontal,
  MessageCircle,
  Edit3,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  Plus,
} from "lucide-react";
import { Character, Chat, ScheduledTask } from "../types";
import { getMoodTheme } from "../lib/moodConfig";
import { storage } from "../lib/storage";
import { haptics } from "../lib/haptics";
import { MoodTrendsChart } from "./MoodTrendsChart";
import { SpotifyShareModal } from "./SpotifyShareModal";

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
  const [isExpandedProfileText, setIsExpandedProfileText] = useState(false);
  const [isRoutineExpanded, setIsRoutineExpanded] = useState(false);
  const [isEmotionStatsExpanded, setIsEmotionStatsExpanded] = useState(false);
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Scheduled tasks state
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [newRoutineTime, setNewRoutineTime] = useState("07:00");
  const [newRoutineInstruction, setNewRoutineInstruction] = useState("");
  const [newRoutineRepeatDaily, setNewRoutineRepeatDaily] = useState(true);

  const loadTasks = () => {
    const list = storage.getScheduledTasks(character.id);
    setScheduledTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, [character.id]);

  const currentEmotion = chat?.currentMood?.emotion || character.defaultMood || "neutral";
  const moodTheme = getMoodTheme(currentEmotion);
  const intensity = chat?.currentMood?.intensity ?? 7;
  const totalMessages = chat?.messages?.length || 0;
  const charMessages = (chat?.messages || []).filter((m) => m.role === "char");
  const lastCharMessage = charMessages.length > 0 ? charMessages[charMessages.length - 1] : null;

  const profileTextContent =
    (character.personality || character.tagline || "") +
    (character.speakingStyle ? `\n\nGaya Bicara: ${character.speakingStyle}` : "");
  const isLongText = profileTextContent.length > 120;

  const activeRoutinesCount = scheduledTasks.filter((t) => t.enabled).length;

  const handleShare = () => {
    haptics.light(true);
    setShowShareModal(true);
  };

  const handleToggleRoutine = (task: ScheduledTask) => {
    haptics.light(true);
    storage.toggleScheduledTask(task.id, !task.enabled);
    loadTasks();
  };

  const handleDeleteRoutine = (taskId: string) => {
    haptics.light(true);
    storage.deleteScheduledTask(taskId);
    loadTasks();
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineInstruction.trim()) return;
    haptics.light(true);
    const newTask: ScheduledTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      characterId: character.id,
      title: "Jadwal Rutin",
      time: newRoutineTime,
      instruction: newRoutineInstruction.trim(),
      enabled: true,
      repeatDaily: newRoutineRepeatDaily,
      createdAt: Date.now(),
    };
    storage.saveScheduledTask(newTask);
    setNewRoutineInstruction("");
    setNewRoutineTime("07:00");
    setNewRoutineRepeatDaily(true);
    setIsCreatingRoutine(false);
    loadTasks();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex justify-center lg:justify-end animate-fade-in overflow-y-auto">
      {/* Main Profile Panel */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-md min-h-screen bg-[#F4F5F7] dark:bg-[#090A0F] text-neutral-900 dark:text-slate-100 flex flex-col pb-28 shadow-2xl overflow-x-hidden selection:bg-[#F5B838]/30 selection:text-neutral-900 dark:selection:text-white"
      >
        {/* ========================================================
            1. HERO PROFILE AREA (Full-bleed immersive header with Stitch Scrims)
            ======================================================== */}
        <div className="relative w-full min-h-[420px] flex flex-col justify-between mb-5">
          {/* Full-bleed background image */}
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-cover object-top select-none"
          />

          {/* Multi-stop subtle gradient scrims: top protection for buttons and bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-[#F4F5F7] dark:to-[#090A0F] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#F4F5F7] via-[#F4F5F7]/85 to-transparent dark:from-[#090A0F] dark:via-[#090A0F]/80 dark:to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 backdrop-blur-xs [mask-image:linear-gradient(to_top,black_40%,transparent)] pointer-events-none" />

          {/* Top Floating Transparent Navigation Header */}
          <header className="relative z-30 flex items-center justify-between pt-3 pb-2 px-4">
            <button
              type="button"
              onClick={() => {
                haptics.light(true);
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/90 shadow-sm cursor-pointer"
              aria-label="Kembali"
            >
              <ChevronLeft size={20} className="stroke-[2.2]" />
            </button>

            <div className="text-xs uppercase tracking-widest font-semibold text-white/80 drop-shadow-sm">
              Profil Karakter
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.light(true);
                onEditCharacter?.();
              }}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/90 shadow-sm cursor-pointer"
              aria-label="Edit Karakter"
              title="Edit Karakter"
            >
              <MoreHorizontal size={20} />
            </button>
          </header>

          {/* Hero Profile Content & Action at base of image */}
          <div className="relative z-10 px-5 pb-3 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white drop-shadow-sm">
                {character.name}
              </h1>
              <span className="inline-flex items-center justify-center text-[#F5B838] shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path
                    clipRule="evenodd"
                    d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    fillRule="evenodd"
                  />
                </svg>
              </span>
            </div>

            {character.tagline && (
              <p className="text-sm text-neutral-700 dark:text-neutral-200/90 leading-snug line-clamp-2 mb-3.5 font-normal">
                {character.tagline}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center text-xs font-medium text-neutral-600 dark:text-neutral-400 select-none">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Online</span>
                {character.category && (
                  <>
                    <span className="mx-2 text-neutral-400 dark:text-neutral-600">•</span>
                    <span>{character.category}</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  haptics.light(true);
                  onStartChat();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 font-bold text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span>Mulai Chat</span>
                <span className="text-sm font-bold leading-none">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. QUICK ACTIONS (Edit Profil & Bagikan)
            ======================================================== */}
        <div className="px-5 mb-5 relative z-10">
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => {
                haptics.light(true);
                onEditCharacter?.();
              }}
              className="w-full py-2.5 rounded-2xl bg-white dark:bg-white/[0.07] hover:bg-neutral-50 dark:hover:bg-white/[0.12] border border-black/5 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-white flex items-center justify-center gap-2 active:scale-98 transition shadow-xs cursor-pointer"
            >
              <Edit3 size={15} className="text-neutral-500 dark:text-neutral-300" />
              <span>Edit Profil</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            3. EDITORIAL DETAILS LIST
            ======================================================== */}
        <div className="px-5 space-y-6 pt-1">
          {/* SECTION 1: KONDISI SAAT INI (Editorial Mood & Thought) */}
          <section className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-neutral-500 dark:text-neutral-400">
                Kondisi Saat Ini
              </span>
              <span className="text-[11px] font-semibold text-[#B45309] dark:text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                {moodTheme.label}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                  Tingkat Antusiasme
                </h2>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-300">
                  <span className="text-[#F5B838] font-bold">{intensity}</span> / 10
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#F5B838] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, intensity * 10))}%` }}
                />
              </div>
            </div>

            <div className="pl-3.5 border-l-2 border-[#F5B838]/40 py-1 mt-2">
              <p className="text-xs text-neutral-700 dark:text-neutral-300/90 italic leading-relaxed">
                “{lastCharMessage ? lastCharMessage.text : character.greeting}”
              </p>
            </div>
          </section>

          {/* SECTION 2: MEMORI OBROLAN (Editorial Context) */}
          <section className="p-4 rounded-2xl bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Memori Obrolan
              </h3>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.04]">
                {totalMessages} Pesan Tersimpan
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              {chat?.summary
                ? chat.summary
                : totalMessages > 1
                ? `Telah bertukar ${totalMessages} pesan. Rangkuman intisari percakapan akan otomatis diperbarui dan diarsipkan saat pergantian hari.`
                : "Belum ada riwayat percakapan panjang."}
            </p>
          </section>

          {/* SECTION 3: KEPRIBADIAN & GAYA BICARA (With Smooth Fade & Toggle) */}
          <section className="p-4 rounded-2xl bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Kepribadian &amp; Gaya Bicara
              </h3>
            </div>

            <div className="relative">
              <div
                className={`text-xs text-neutral-600 dark:text-neutral-300/90 leading-relaxed whitespace-pre-line transition-all duration-300 ${
                  !isExpandedProfileText && isLongText
                    ? "max-h-[82px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
                    : ""
                }`}
              >
                {character.personality || character.tagline}
                {character.speakingStyle && (
                  <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Gaya Bicara:{" "}
                    </span>
                    {character.speakingStyle}
                  </div>
                )}
              </div>

              {isLongText && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.light(true);
                    setIsExpandedProfileText((prev) => !prev);
                  }}
                  className="w-full pt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#F5B838] hover:text-[#E5A929] transition active:scale-98 cursor-pointer select-none"
                >
                  <span>{isExpandedProfileText ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}</span>
                  {isExpandedProfileText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>

            {/* Personality Tags Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-[11px] text-neutral-700 dark:text-neutral-300 font-normal">
                Santai &amp; Akrab
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-[11px] text-neutral-700 dark:text-neutral-300 font-normal">
                Foodie Lover
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-[11px] text-neutral-700 dark:text-neutral-300 font-normal">
                Super Suportif
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-[11px] text-neutral-700 dark:text-neutral-300 font-normal">
                Bestie
              </span>
            </div>
          </section>

          {/* SECTION 4: JADWAL RUTIN OTOMATIS (Inline Accordion + Embedded Creation Form) */}
          <section className="rounded-2xl bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/5 shadow-xs overflow-hidden">
            {/* Trigger Row */}
            <div
              onClick={() => {
                haptics.light(true);
                setIsRoutineExpanded((prev) => !prev);
              }}
              className="py-3 px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-[18px] h-[18px] text-[#F5B838] shrink-0 stroke-[1.75]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white leading-tight">
                      Jadwal Rutin Otomatis
                    </span>
                    <span className="text-[#B45309] dark:text-[#F5B838] bg-amber-500/10 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {activeRoutinesCount > 0 ? `${activeRoutinesCount} Aktif` : "0 Aktif"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Sapaan pagi, malam, atau waktu tertentu
                  </div>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
                  isRoutineExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {/* Expanded Routine Content Panel */}
            <AnimatePresence>
              {isRoutineExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 pt-1 border-t border-black/5 dark:border-white/5 space-y-3"
                >
                  {/* Routine List */}
                  {scheduledTasks.length === 0 ? (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 py-2 italic text-center">
                      Belum ada jadwal rutin yang dibuat.
                    </div>
                  ) : (
                    scheduledTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
                              {task.time}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                              {task.repeatDaily ? "Setiap hari" : "Satu kali"}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            {task.title || "Jadwal Rutin"}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {task.instruction}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                          {/* Active Amber Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleRoutine(task)}
                            className={`w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer shadow-xs transition-colors ${
                              task.enabled ? "bg-[#F5B838] justify-end" : "bg-neutral-300 dark:bg-neutral-700 justify-start"
                            }`}
                            aria-label="Aktifkan atau nonaktifkan jadwal"
                          >
                            <div className="w-4 h-4 rounded-full bg-white dark:bg-neutral-950 shadow-xs" />
                          </button>

                          {/* Trash Icon */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(task.id)}
                            className="text-neutral-400 hover:text-red-500 transition p-1 cursor-pointer"
                            aria-label="Hapus jadwal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Inline Creation Trigger Button */}
                  {!isCreatingRoutine ? (
                    <button
                      type="button"
                      onClick={() => setIsCreatingRoutine(true)}
                      className="flex items-center gap-1.5 text-[#B45309] dark:text-[#F5B838] text-xs font-semibold cursor-pointer hover:underline pt-1 select-none"
                    >
                      <Plus size={14} />
                      <span>Tambah rutinitas baru</span>
                    </button>
                  ) : (
                    /* Inline Creation Form */
                    <form
                      onSubmit={handleSaveRoutine}
                      className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-xl p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={newRoutineTime}
                            onChange={(e) => setNewRoutineTime(e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setNewRoutineRepeatDaily((prev) => !prev)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                            newRoutineRepeatDaily
                              ? "bg-amber-500/15 border-amber-500/30 text-[#B45309] dark:text-[#F5B838]"
                              : "bg-neutral-200 dark:bg-white/5 border-transparent text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {newRoutineRepeatDaily ? "Setiap hari" : "Hanya sekali"}
                        </button>
                      </div>

                      <textarea
                        value={newRoutineInstruction}
                        onChange={(e) => setNewRoutineInstruction(e.target.value)}
                        placeholder={`Instruksi: apa yang perlu ${character.name} sampaikan?`}
                        rows={2}
                        className="bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg p-2.5 w-full outline-none focus:border-[#F5B838] resize-none"
                      />

                      <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingRoutine(false)}
                          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          Simpan Jadwal
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* SECTION 5: GRAFIK TREN & STATISTIK EMOSI (Inline Accordion Hosting MoodTrendsChart) */}
          <section className="rounded-2xl bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/5 shadow-xs overflow-hidden">
            <div
              onClick={() => {
                haptics.light(true);
                setIsEmotionStatsExpanded((prev) => !prev);
              }}
              className="py-3 px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-[18px] h-[18px] text-[#F5B838] shrink-0 stroke-[1.75]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 20V10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 20V4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white leading-tight">
                      Grafik Tren &amp; Statistik Emosi
                    </span>
                    <span className="text-[#B45309] dark:text-[#F5B838] bg-amber-500/10 text-xs px-2 py-0.5 rounded-full font-semibold">
                      Live
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Analisis dinamika perasaan percakapan
                  </div>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
                  isEmotionStatsExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            <AnimatePresence>
              {isEmotionStatsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border-t border-black/5 dark:border-white/5"
                >
                  <MoodTrendsChart chat={chat} character={character} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* ========================================================
            4. STICKY BOTTOM BAR (Stitch Floating Capsule Dock)
            ======================================================== */}
        <footer className="fixed bottom-3 inset-x-4 max-w-[400px] mx-auto z-40 pointer-events-auto">
          <div className="p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                haptics.light(true);
                onStartChat();
              }}
              className="w-full py-3 px-5 rounded-full bg-[#F5B838] hover:bg-[#E5A929] active:scale-98 transition-all text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <MessageCircle size={18} />
              <span>Kirim Pesan</span>
            </button>
          </div>
        </footer>
      </motion.div>

    </div>
  );
};

