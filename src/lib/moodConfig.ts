import { MoodMeta, MoodTheme, AppLanguage } from "../types";

export const MOOD_CONFIG: Record<string, MoodMeta> = {
  happy: {
    label: "Lagi seneng",
    emoji: "😊",
    glowColor: "rgba(244, 114, 182, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(244, 114, 182, 0.18) 0%, rgba(251, 113, 133, 0.12) 40%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-400/30",
  },
  playful: {
    label: "Lagi gemes / usil",
    emoji: "😜",
    glowColor: "rgba(236, 72, 153, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(236, 72, 153, 0.18) 0%, rgba(244, 114, 182, 0.12) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-400/30",
  },
  excited: {
    label: "Lagi bersemangat",
    emoji: "🤩",
    glowColor: "rgba(244, 114, 182, 0.5)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(244, 114, 182, 0.2) 0%, rgba(251, 113, 133, 0.12) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-400/30",
  },
  shy: {
    label: "Lagi salting",
    emoji: "😳",
    glowColor: "rgba(251, 113, 133, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(251, 113, 133, 0.18) 0%, rgba(244, 114, 182, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30",
  },
  annoyed: {
    label: "Lagi kesel",
    emoji: "😤",
    glowColor: "rgba(239, 68, 68, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/30",
  },
  angry: {
    label: "Lagi ngambek berat",
    emoji: "😡",
    glowColor: "rgba(220, 38, 38, 0.55)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(220, 38, 38, 0.22) 0%, rgba(153, 27, 27, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-red-600/20 text-red-700 dark:text-red-300 border-red-500/40",
  },
  sad: {
    label: "Lagi galau / sedih",
    emoji: "🥺",
    glowColor: "rgba(59, 130, 246, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.16) 0%, rgba(37, 99, 235, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30",
  },
  jealous: {
    label: "Lagi cemburu",
    emoji: "😒",
    glowColor: "rgba(244, 63, 94, 0.45)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(244, 63, 94, 0.18) 0%, rgba(251, 113, 133, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30",
  },
  bored: {
    label: "Lagi mager / santai",
    emoji: "🥱",
    glowColor: "rgba(245, 184, 56, 0.35)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(245, 184, 56, 0.12) 0%, rgba(217, 119, 6, 0.08) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30",
  },
  worried: {
    label: "Lagi cemas / perhatian",
    emoji: "😟",
    glowColor: "rgba(59, 130, 246, 0.4)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30",
  },
  neutral: {
    label: "Santai",
    emoji: "🙂",
    glowColor: "rgba(245, 184, 56, 0.35)",
    bgGradient: "radial-gradient(ellipse at 80% 20%, rgba(245, 184, 56, 0.15) 0%, rgba(229, 169, 41, 0.1) 45%, rgba(20, 17, 31, 0) 70%)",
    badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30",
  },
};

export function getMoodMeta(emotion: string = "neutral"): MoodMeta {
  const key = emotion.toLowerCase().trim();
  return MOOD_CONFIG[key] || MOOD_CONFIG.neutral;
}

/**
 * Tema dinamis berdasarkan emosi karakter:
 * - Senang / Ceria / Gemas (happy, playful, excited): Tema Pink
 * - Marah / Kesal / Ngambek (angry, annoyed): Tema Merah
 * - Sedih / Galau / Cemas (sad, worried): Tema Biru
 * - Salting / Tersipu (shy, jealous): Tema Rose / Coral
 * - Santai / Biasa aja (neutral, bored, default): Tema Amber Bakery Default
 */
export function getMoodTheme(
  emotion: string = "neutral",
  lang: AppLanguage = "id"
): MoodTheme {
  const key = emotion.toLowerCase().trim();
  const isEn = lang === "en";

  // 1. Senang / Ceria -> Pink
  if (key === "happy" || key === "playful" || key === "excited") {
    let label = isEn ? "Happy" : "Lagi Senang";
    if (key === "playful") label = isEn ? "Playful" : "Lagi Gemes";
    if (key === "excited") label = isEn ? "Excited" : "Lagi Heboh";

    return {
      themeName: "pink",
      accentColor: "#F472B6",
      accentHover: "#EC4899",
      accentSubtle: "rgba(244, 114, 182, 0.14)",
      accentBorder: "rgba(244, 114, 182, 0.35)",
      userBubbleBg: "bg-[#F472B6] text-neutral-950",
      userBubbleText: "text-neutral-950",
      label,
      emoji: key === "playful" ? "😜" : key === "excited" ? "🤩" : "😊",
      badgeStyle: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-400/30",
      glowColor: "rgba(244, 114, 182, 0.4)",
    };
  }

  // 2. Marah / Kesal / Ngambek -> Merah
  if (key === "angry" || key === "annoyed") {
    let label = isEn ? "Annoyed" : "Lagi Kesal";
    if (key === "angry") label = isEn ? "Upset" : "Lagi Ngambek";

    return {
      themeName: "red",
      accentColor: "#EF4444",
      accentHover: "#DC2626",
      accentSubtle: "rgba(239, 68, 68, 0.14)",
      accentBorder: "rgba(239, 68, 68, 0.35)",
      userBubbleBg: "bg-[#EF4444] text-white",
      userBubbleText: "text-white",
      label,
      emoji: key === "angry" ? "😡" : "😤",
      badgeStyle: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/30",
      glowColor: "rgba(239, 68, 68, 0.4)",
    };
  }

  // 3. Sedih / Galau / Cemas -> Biru
  if (key === "sad" || key === "worried") {
    let label = isEn ? "Sad" : "Lagi Galau";
    if (key === "worried") label = isEn ? "Worried" : "Lagi Cemas";

    return {
      themeName: "blue",
      accentColor: "#3B82F6",
      accentHover: "#2563EB",
      accentSubtle: "rgba(59, 130, 246, 0.14)",
      accentBorder: "rgba(59, 130, 246, 0.35)",
      userBubbleBg: "bg-[#3B82F6] text-white",
      userBubbleText: "text-white",
      label,
      emoji: key === "sad" ? "🥺" : "😟",
      badgeStyle: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30",
      glowColor: "rgba(59, 130, 246, 0.4)",
    };
  }

  // 4. Salting / Tersipu -> Rose / Coral
  if (key === "shy" || key === "jealous") {
    let label = isEn ? "Blushing" : "Lagi Salting";
    if (key === "jealous") label = isEn ? "Jealous" : "Lagi Cemburu";

    return {
      themeName: "rose",
      accentColor: "#FB7185",
      accentHover: "#F43F5E",
      accentSubtle: "rgba(251, 113, 133, 0.14)",
      accentBorder: "rgba(251, 113, 133, 0.35)",
      userBubbleBg: "bg-[#FB7185] text-neutral-950",
      userBubbleText: "text-neutral-950",
      label,
      emoji: key === "jealous" ? "😒" : "😳",
      badgeStyle: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30",
      glowColor: "rgba(251, 113, 133, 0.4)",
    };
  }

  // 5. Default -> Amber Gold
  return {
    themeName: "amber",
    accentColor: "#F5B838",
    accentHover: "#E5A929",
    accentSubtle: "rgba(245, 184, 56, 0.14)",
    accentBorder: "rgba(245, 184, 56, 0.35)",
    userBubbleBg: "bg-[#F5B838] text-neutral-950",
    userBubbleText: "text-neutral-950",
    label: isEn ? "Relaxed" : "Santai",
    emoji: "☕",
    badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30",
    glowColor: "rgba(245, 184, 56, 0.4)",
  };
}
