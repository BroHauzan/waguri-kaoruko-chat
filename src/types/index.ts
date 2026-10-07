export type CharacterCategory = 'Semua' | 'Santai' | 'Roleplay' | 'Curhat' | 'Lucu' | 'Romantis';

export interface ExampleDialogue {
  user: string;
  char: string;
}

export interface CharacterVisualProfile {
  hair: string;          // Contoh: "dark wavy hair with bangs"
  eyes: string;          // Contoh: "warm amber brown eyes"
  schoolName: string;    // Contoh: "Kikyo Girls' High School"
  schoolUniform: string; // Contoh: "prestigious blazer uniform, ribbon tie, neat pleated skirt"
  generalLook: string;   // Contoh: "petite, cute gentle smile, expressive"
}

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  tagline: string;
  category: CharacterCategory;
  personality: string;        // sifat inti
  speakingStyle: string;      // gaya ngomong
  backstory: string;
  relationship: string;      // hubungan dengan user
  greeting: string;           // pesan pertama
  exampleDialogues: ExampleDialogue[]; // 3-5 pasang
  defaultMood: string;        // happy, neutral, playful, dll
  customInstructions?: string; // instruksi khusus per karakter
  visualProfile?: CharacterVisualProfile; // Profil visual untuk foto / PAP
  isPinned?: boolean;         // Obrolan disematkan / favorit
  isArchived?: boolean;       // Obrolan diarsipkan
  createdAt: number;
}

/** Gambar yang dilampirkan ke sebuah pesan. `dataUrl` dipakai untuk
 *  menampilkan di UI; `base64` + `mimeType` dikirim ke model. */
export interface ImageAttachment {
  id: string;
  /** Data URL lengkap, mis. "data:image/png;base64,..." */
  dataUrl: string;
  /** Bagian base64 tanpa prefix, siap dikirim ke API. */
  base64: string;
  mimeType: string;
  /** Ukuran dalam byte, untuk ditampilkan. */
  size: number;
}

/** Rekaman suara yang dilampirkan ke sebuah pesan. */
export interface AudioAttachment {
  id: string;
  /** Data URL untuk memutar ulang di UI. */
  dataUrl: string;
  /** Bagian base64 tanpa prefix, siap dikirim ke API. */
  base64: string;
  /** Selalu audio/wav — Gemini tidak menerima audio/webm dari MediaRecorder,
   *  jadi rekaman dikonversi dulu sebelum dikirim. */
  mimeType: string;
  /** Durasi rekaman dalam detik. */
  duration: number;
  /** Tinggi bar waveform ternormalisasi (0-1), dihitung dari amplitudo asli. */
  waveform: number[];
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'char';
  text: string;
  emotion?: string;
  intensity?: number;
  timestamp: number;
  /** Lampiran gambar (opsional). */
  image?: ImageAttachment;
  /** Lampiran suara (opsional). */
  audio?: AudioAttachment;
  /** Reaksi emoji tunggal pada pesan ini, ditiru dari WhatsApp. */
  reaction?: string;
  /** Pesan yang dibalas (kutipan), ditiru dari fitur reply WhatsApp. */
  replyTo?: {
    id: string;
    text: string;
    isUser: boolean;
  };
  /** Untuk pesan user: apakah karakter sudah membalasnya. Dipakai untuk
   *  menampilkan centang dua sebagai penanda "sudah dibaca". */
  readByCharacter?: boolean;
}

export interface Chat {
  id: string;
  characterId: string;
  messages: Message[];
  summary: string;            // ringkasan obrolan lama
  currentMood: {
    emotion: string;
    intensity: number;
  };
  updatedAt: number;
  lastSummarizedMessageId?: string; // ID pesan terakhir yang sudah masuk ringkasan memori
  lastSummarizedDate?: string;      // Tanggal terakhir ringkasan otomatis dijalankan (YYYY-MM-DD)
}

export type MoodColorPreset =
  | 'dynamic'
  | 'bakery-warm'
  | 'night-sky'
  | 'soft-sunset'
  | 'emerald-garden'
  | 'rose-quartz';

export type ThemeMode = 'light' | 'dark' | 'auto';

/** `gemini` = Google SDK resmi. `openai-compatible` = endpoint REST apa pun
 *  yang mengikuti format /chat/completions (OpenRouter, Groq, DeepSeek,
 *  Together, LM Studio, Ollama, vLLM, dan sejenisnya). */
export type ProviderType = 'gemini' | 'openai-compatible';

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  /** Hanya dipakai oleh provider openai-compatible. */
  baseUrl: string;
  /** Kosong pada provider Gemini bawaan = pakai GEMINI_API_KEY dari server. */
  apiKey: string;
  /** Model teks chat (default: gemini-3.1-flash-lite) */
  model: string;
  /** Model khusus generasi foto/gambar (default: gemini-3.1-flash-lite-image) */
  imageModel?: string;
  /** Provider bawaan tidak bisa dihapus. */
  isBuiltin?: boolean;
  createdAt: number;
}

export type AppLanguage = 'id' | 'en';

export interface Settings {
  userName: string;
  model: string;
  imageModel?: string;
  temperature: number;
  replyLength: 'Pendek' | 'Sedang' | 'Panjang';
  apiKey?: string;
  hapticFeedback?: boolean;
  moodColorPreset?: MoodColorPreset;
  theme?: ThemeMode;
  language?: AppLanguage;
  /** Daftar provider AI yang bisa dipilih user. Disimpan di localStorage. */
  providers?: AIProvider[];
  /** ID provider yang sedang dipakai. */
  activeProviderId?: string;
}

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'annoyed'
  | 'excited'
  | 'shy'
  | 'jealous'
  | 'bored'
  | 'worried'
  | 'neutral'
  | 'playful';

export interface MoodMeta {
  label: string;
  emoji: string;
  glowColor: string;
  bgGradient: string;
  badgeStyle: string;
}

export interface MoodTheme {
  themeName: string;
  accentColor: string;
  accentHover: string;
  accentSubtle: string;
  accentBorder: string;
  userBubbleBg: string;
  userBubbleText: string;
  label: string;
  emoji: string;
  badgeStyle: string;
  glowColor: string;
}

export interface ScheduledTask {
  id: string;
  characterId: string;
  title: string;
  time: string; // HH:mm
  instruction: string;
  enabled: boolean;
  repeatDaily: boolean;
  lastExecutedDate?: string; // YYYY-MM-DD
  createdAt: number;
}
