import { MoodColorPreset } from "../types";

export interface ColorPresetConfig {
  id: MoodColorPreset;
  name: string;
  subtitle: string;
  description: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  blob1Color: string;
  blob2Color: string;
  blob3Color: string;
  previewColors: [string, string, string];
}

export const MOOD_COLOR_PRESETS: Record<MoodColorPreset, ColorPresetConfig> = {
  dynamic: {
    id: "dynamic",
    name: "Dinamis Mood",
    subtitle: "Otomatis",
    description: "Warna latar otomatis bertransisi mengikuti suasana hati karakter",
    gradientFrom: "#18152e",
    gradientVia: "#141528",
    gradientTo: "#101626",
    blob1Color: "rgba(139, 92, 246, 0.22)",
    blob2Color: "rgba(236, 72, 153, 0.16)",
    blob3Color: "rgba(59, 130, 246, 0.15)",
    previewColors: ["#8B7CF6", "#EC4899", "#3B82F6"],
  },
  "bakery-warm": {
    id: "bakery-warm",
    name: "Bakery Warm",
    subtitle: "Hangat & Manis",
    description: "Nuansa hangat aroma roti bakery, karamel madu, dan kayu manis",
    gradientFrom: "#251810",
    gradientVia: "#1c110b",
    gradientTo: "#120b07",
    blob1Color: "rgba(245, 158, 11, 0.28)",
    blob2Color: "rgba(234, 88, 12, 0.22)",
    blob3Color: "rgba(251, 191, 36, 0.18)",
    previewColors: ["#F59E0B", "#EA580C", "#FBBF24"],
  },
  "night-sky": {
    id: "night-sky",
    name: "Night Sky",
    subtitle: "Indigo Tenang",
    description: "Langit malam berbintang dengan sentuhan indigo tenang dan misterius",
    gradientFrom: "#0c1328",
    gradientVia: "#090e1e",
    gradientTo: "#050813",
    blob1Color: "rgba(99, 102, 241, 0.26)",
    blob2Color: "rgba(59, 130, 246, 0.22)",
    blob3Color: "rgba(168, 85, 247, 0.18)",
    previewColors: ["#6366F1", "#3B82F6", "#A855F7"],
  },
  "soft-sunset": {
    id: "soft-sunset",
    name: "Soft Sunset",
    subtitle: "Jingga & Violet",
    description: "Gradasi senja lembut perpaduan jingga hangat dan violet manis",
    gradientFrom: "#26111f",
    gradientVia: "#1d0c18",
    gradientTo: "#130810",
    blob1Color: "rgba(244, 63, 94, 0.26)",
    blob2Color: "rgba(249, 115, 22, 0.20)",
    blob3Color: "rgba(217, 70, 239, 0.16)",
    previewColors: ["#F43F5E", "#F97316", "#D946EF"],
  },
  "emerald-garden": {
    id: "emerald-garden",
    name: "Emerald Garden",
    subtitle: "Hijau Zamrud",
    description: "Hijaunya taman teh segar dan zamrud menenangkan pikiran",
    gradientFrom: "#0c1f19",
    gradientVia: "#081712",
    gradientTo: "#050f0c",
    blob1Color: "rgba(16, 185, 129, 0.26)",
    blob2Color: "rgba(20, 184, 166, 0.20)",
    blob3Color: "rgba(52, 211, 153, 0.16)",
    previewColors: ["#10B981", "#14B8A6", "#34D399"],
  },
  "rose-quartz": {
    id: "rose-quartz",
    name: "Rose Quartz",
    subtitle: "Pastel Pink",
    description: "Nuansa merah muda pastel romantis, anggun, dan manis",
    gradientFrom: "#25121f",
    gradientVia: "#1c0d17",
    gradientTo: "#12080f",
    blob1Color: "rgba(244, 114, 182, 0.26)",
    blob2Color: "rgba(251, 113, 133, 0.22)",
    blob3Color: "rgba(232, 121, 249, 0.16)",
    previewColors: ["#F472B6", "#FB7185", "#E879F9"],
  },
};
