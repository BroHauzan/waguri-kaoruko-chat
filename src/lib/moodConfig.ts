import { MoodMeta } from "../types";

export const MOOD_CONFIG: Record<string, MoodMeta> = {
  happy: {
    label: "Lagi seneng ✨",
    emoji: "😊",
    glowColor: "rgba(245, 158, 11, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.16) 0%, rgba(107, 91, 210, 0.12) 40%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-amber-500/20 text-amber-200 border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
  },
  playful: {
    label: "Lagi gemes / usil 😜",
    emoji: "😜",
    glowColor: "rgba(236, 72, 153, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(236, 72, 153, 0.18) 0%, rgba(139, 92, 246, 0.12) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-pink-500/20 text-pink-200 border-pink-400/30 shadow-[0_0_15px_rgba(236,72,153,0.25)]",
  },
  excited: {
    label: "Lagi heboh 🔥",
    emoji: "🤩",
    glowColor: "rgba(249, 115, 22, 0.5)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(249, 115, 22, 0.2) 0%, rgba(168, 85, 247, 0.12) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-orange-500/20 text-orange-200 border-orange-400/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]",
  },
  shy: {
    label: "Lagi salting 😳",
    emoji: "😳",
    glowColor: "rgba(244, 63, 94, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(244, 63, 94, 0.18) 0%, rgba(107, 91, 210, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-rose-500/20 text-rose-200 border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
  },
  annoyed: {
    label: "Lagi kesel 😤",
    emoji: "😤",
    glowColor: "rgba(239, 68, 68, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(239, 68, 68, 0.18) 0%, rgba(99, 102, 241, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-red-500/20 text-red-200 border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]",
  },
  angry: {
    label: "Lagi ngambek berat 💢",
    emoji: "😡",
    glowColor: "rgba(220, 38, 38, 0.55)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(220, 38, 38, 0.22) 0%, rgba(79, 70, 229, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-red-600/25 text-red-300 border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.35)]",
  },
  sad: {
    label: "Lagi galau 🥺",
    emoji: "🥺",
    glowColor: "rgba(59, 130, 246, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.16) 0%, rgba(107, 91, 210, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-blue-500/20 text-blue-200 border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.25)]",
  },
  jealous: {
    label: "Lagi cemburu 👀",
    emoji: "😒",
    glowColor: "rgba(168, 85, 247, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-purple-500/20 text-purple-200 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
  },
  bored: {
    label: "Lagi mager 🥱",
    emoji: "🥱",
    glowColor: "rgba(148, 163, 184, 0.35)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(148, 163, 184, 0.12) 0%, rgba(107, 91, 210, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-slate-500/20 text-slate-200 border-slate-400/30 shadow-[0_0_15px_rgba(148,163,184,0.2)]",
  },
  worried: {
    label: "Lagi cemas 😟",
    emoji: "😟",
    glowColor: "rgba(234, 179, 8, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(234, 179, 8, 0.15) 0%, rgba(107, 91, 210, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-yellow-500/20 text-yellow-200 border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.25)]",
  },
  neutral: {
    label: "Biasa aja ☕",
    emoji: "🙂",
    glowColor: "rgba(139, 124, 246, 0.35)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(139, 124, 246, 0.15) 0%, rgba(233, 165, 107, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-violet-500/20 text-violet-200 border-violet-400/30 shadow-[0_0_15px_rgba(139,124,246,0.2)]",
  },
};

export function getMoodMeta(emotion: string = "neutral"): MoodMeta {
  const key = emotion.toLowerCase().trim();
  return MOOD_CONFIG[key] || MOOD_CONFIG.neutral;
}
