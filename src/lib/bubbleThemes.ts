export type BubbleThemeId =
  | "amber"
  | "blue"
  | "emerald"
  | "pink"
  | "purple"
  | "rose"
  | "orange"
  | "monochrome"
  | "dynamic";

export interface BubbleThemeOption {
  id: BubbleThemeId;
  name: string;
  nameEn: string;
  previewColor: string;
  userBubbleBg: string;
  accentColor: string;
}

export const BUBBLE_THEMES: Record<BubbleThemeId, BubbleThemeOption> = {
  amber: {
    id: "amber",
    name: "Amber Warm",
    nameEn: "Amber Warm",
    previewColor: "#F5B838",
    userBubbleBg: "bg-[#F5B838] text-neutral-950",
    accentColor: "#F5B838",
  },
  blue: {
    id: "blue",
    name: "Ocean Blue",
    nameEn: "Ocean Blue",
    previewColor: "#3B82F6",
    userBubbleBg: "bg-[#3B82F6] text-white",
    accentColor: "#3B82F6",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green",
    nameEn: "Emerald Green",
    previewColor: "#10B981",
    userBubbleBg: "bg-[#10B981] text-white",
    accentColor: "#10B981",
  },
  pink: {
    id: "pink",
    name: "Sakura Pink",
    nameEn: "Sakura Pink",
    previewColor: "#F472B6",
    userBubbleBg: "bg-[#F472B6] text-neutral-950",
    accentColor: "#F472B6",
  },
  purple: {
    id: "purple",
    name: "Lavender",
    nameEn: "Lavender",
    previewColor: "#8B5CF6",
    userBubbleBg: "bg-[#8B5CF6] text-white",
    accentColor: "#8B5CF6",
  },
  rose: {
    id: "rose",
    name: "Rose Coral",
    nameEn: "Rose Coral",
    previewColor: "#FB7185",
    userBubbleBg: "bg-[#FB7185] text-neutral-950",
    accentColor: "#FB7185",
  },
  orange: {
    id: "orange",
    name: "Sunset Orange",
    nameEn: "Sunset Orange",
    previewColor: "#F97316",
    userBubbleBg: "bg-[#F97316] text-white",
    accentColor: "#F97316",
  },
  monochrome: {
    id: "monochrome",
    name: "Monokrom",
    nameEn: "Monochrome",
    previewColor: "#27272A",
    userBubbleBg: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950",
    accentColor: "#71717A",
  },
  dynamic: {
    id: "dynamic",
    name: "Dinamis (Ikuti Mood Karakter)",
    nameEn: "Dynamic (Follow Character Mood)",
    previewColor: "linear-gradient(135deg, #F472B6 0%, #3B82F6 50%, #F5B838 100%)",
    userBubbleBg: "",
    accentColor: "#F5B838",
  },
};

export const BUBBLE_THEME_LIST: BubbleThemeOption[] = Object.values(BUBBLE_THEMES);

/**
 * Mengambil class background & text bubble user yang efektif
 * sesuai preferensi tema pilihan user atau fallback ke mood karakter.
 */
export function getEffectiveUserBubbleBg(
  themeId: BubbleThemeId = "amber",
  fallbackMoodBg: string
): string {
  if (themeId === "dynamic" || !BUBBLE_THEMES[themeId] || !BUBBLE_THEMES[themeId].userBubbleBg) {
    return fallbackMoodBg;
  }
  return BUBBLE_THEMES[themeId].userBubbleBg;
}

