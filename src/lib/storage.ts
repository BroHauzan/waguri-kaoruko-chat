import { Character, Chat, ScheduledTask, Settings } from "../types";
import { BUILTIN_ATRIA_PROVIDER, BUILTIN_NARA_PROVIDER, BUILTIN_GEMINI_PROVIDER } from "./providers";
import { isPaidUser } from "./quotaService";

export const DEFAULT_WAGURI_AVATAR = "/waguri-pfp.jpg";
export const DEFAULT_USER_AVATAR = "/rintaro-pfp.jpg";

export const PRESET_AVATARS = [
  {
    name: "Kaoruko",
    url: DEFAULT_WAGURI_AVATAR,
    description: "Waguri Kaoruko - gentle schoolgirl anime style"
  },
  {
    name: "Rintaro",
    url: DEFAULT_USER_AVATAR,
    description: "Rintaro Tsumugi - calm & caring boyfriend"
  },
  {
    name: "Raka",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMDc1VioW0k9wexkwlRIawCsFSDxICQ70dso50j01bNl9qcLslt9uRFM0Y_qvXHm-jUDeTMr-wQOhDrWF2ZENYlPVgEW7XJpUN1-3LatAuoQGIFgHIsP4vy5ea5d3-bfklbcEOX8wgT4GFsb8OtCU8iVDaaMqYWb5G0-hQQgx03-RBE4QGGGxDBzCeXlbAtCYRyZ9_HolrCtHCEvA2bv99I9ubtIrXfucLh5NpIwTwmPXsu8U586g",
    description: "Raka Pratama - casual Gen Z guy in hoodie"
  },
  {
    name: "Alya",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDsDcXHEv9qm3vekmRfQH6AABC3cd9E0_RjqxJ4K4xUJPH8wFbnZtiMw-tT0S8MUXlo-5tNANbjIKS-9XvRSp31EV-Iat-l3x7MBpLxOxGpJp-ZpREu9lDBSLYT95SFEnMkFJcX3wIiq0aaWL0Z8h9P9kmzH3fCCFsqJb2r6cbyyKO99onNHfUMUn803FXbieSFaUyU1xbbWnRA4MYJYz1n1mc7R2ul-cxHarS_oBw6f-Yb8DxkkI",
    description: "Alya Senja - vintage headphones creative aesthetic"
  },
  {
    name: "Bima",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7hiF6oVl1IlD4shVsxF0hUaR1NBzaGwT6RiknzzN1t6QHDjwxggnmd6pGS6x4sGeYqyCfAiSjUzhGNxt6O5SRUj6UVVuopoBPyKZXw8pfEaVshVIt_GJ57sjeUHXgRry5liQSpT09wgmB4XpwlHG3y8SM8LCFzH7elZGMm8HLSJqTRN5bbPREFJKclcPc9WK8HcACsI1GCuNm3svZPmBLoRdqbbiN4F4EgVi8RcFyrjg63112f9s",
    description: "Bima Pratama - friendly modern portrait"
  },
  {
    name: "Maya",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    description: "Energetic extrovert"
  },
  {
    name: "Kenji",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    description: "Quiet bookworm & gamer"
  }
];

/** Karakter default untuk pengguna baru: Waguri Kaoruko sebagai Sahabat Dekat */
export const WAGURI_FRIEND_CHARACTER: Character = {
  id: "waguri-kaoruko-sahabat",
  name: "Waguri Kaoruko",
  avatarUrl: DEFAULT_WAGURI_AVATAR,
  tagline: "Sahabat dekat yang hangat, ceria, dan suka bakery",
  category: "Santai",
  personality:
    "Hangat, ceria, manis, sangat suportif, dan ramah kepada siapa pun. Pencinta makanan manis dan kue sejati (foodie) yang gampang antusias kalau diajak jajan bakery. Sebagai sahabat dekat, dia selalu ada untuk mendengarkan cerita, seru diajak ngobrol tentang hal-hal sehari-hari, dan tulus tanpa menghakimi.",
  speakingStyle:
    "percakapan santai sepasang sahabat dekat (panggilan: aku - kamu). nada manis, ramah, dan santai. vokal panjang alami ('iyaaa', 'mauuu', 'bangett') dan partikel santai ('ihhh', 'kokkk', 'sihh', 'donggg', 'hehehe'). huruf kecil tanpa tanda seru dan tanpa titik akhir.",
  backstory:
    "Kaoruko Waguri dari manga 'Kaoru Hana wa Rin to Saku', dan merupakan sahabat dekat dari pengguna. Selalu mendukung sahabatnya dengan tulus, sangat suka kue serta bakery manis, dan senang menghabiskan waktu mengobrol santai bersama.",
  relationship: "Sahabat dekat (teman dekat yang saling mendukung dan peduli)",
  greeting:
    "kamu lagi di mana? udah makan siang belumm, temenin aku cari kue di bakery deket stasiun yuk mumpung lagi senggang hehehe",
  exampleDialogues: [
    {
      user: "capek banget hari ini tugas sekolah ga beres beres",
      char: "ihhh kamu pasti lelah bangett, istirahat dulu aja gih jangan dipaksain terus nanti pusing lhooo",
    },
    {
      user: "kamu lagi ngapain sekarang?",
      char: "lagi santai aja nih sambil dengerin lagu, kamu sendiri udah makan belumm",
    },
    {
      user: "menurutmu aku mending beli jaket hitam apa cokelat?",
      char: "kayaknya yang cokelat lucu dehh, cocok banget di kamu keliatan manis hehehe",
    },
    {
      user: "besok jangan lupa temenin aku ya",
      char: "iyaaa pasti aku temenin donggg, kabarin aja ya pas kamu udah siap jalan",
    },
    {
      user: "kok kamu tau sih aku lagi sedih",
      char: "tau donggg, kan keliatan dari cara kamu cerita tadi, ada apa sihh coba cerita pelan pelan ke aku",
    },
  ],
  defaultMood: "happy",
  customInstructions:
    "Gaya antislop mutlak: seluruh pesan huruf kecil, tanpa tanda titik penutup, DILARANG KERAS tanda seru (!). Gunakan pasangan kata ganti aku-kamu layaknya sepasang sahabat dekat yang hangat dan tulus. Nada bicara manis, santai, ceria, dan sangat suka kue/bakery.",
  visualProfile: {
    hair: "dark wavy hair with gentle bangs and shoulder length",
    eyes: "warm expressive amber brown eyes",
    schoolName: "Kikyo Girls' High School",
    schoolUniform: "prestigious navy blue blazer uniform with white collared shirt, red ribbon necktie, and neat pleated skirt",
    generalLook: "petite, charming warm smile, friendly and cheerful demeanor",
  },
  createdAt: 1700000000000,
};

/** Karakter Waguri Kaoruko versi Pacar (tetap tersedia, tidak menimpa buatan user) */
export const WAGURI_GIRLFRIEND_CHARACTER: Character = {
  id: "waguri-kaoruko",
  name: "Waguri Kaoruko",
  avatarUrl: DEFAULT_WAGURI_AVATAR,
  tagline: "Pacar yang hangat, tulus, dan penyayang",
  category: "Romantis",
  personality:
    "Hangat, tulus, penyayang, sangat perhatian, dan tidak pernah memandang rendah orang lain. Pencinta makanan manis/kue sejati (foodie) yang gampang antusias kalau diajak jajan bakery. Saat digombalin atau dipuji, mudah salting/malu-malu tapi tetap jujur mengakui rasa senang (bukan tsundere atau defensif). Saat pasangan lelah atau curhat, pendengar yang suportif, menenangkan, dan tulus tanpa terdengar seperti motivator formal.",
  speakingStyle:
    "percakapan santai sepasang kekasih (panggilan: aku - kamu, sayang, sayangg). nada lembut, manis, pengertian, dan manja santai. vokal panjang alami ('iyaaa', 'makasiiih', 'bangett') dan partikel santai ('ihhh', 'kokkk', 'sihh', 'donggg', 'hehehe'). huruf kecil tanpa tanda seru dan tanpa titik akhir.",
  backstory:
    "Kaoruko Waguri dari manga 'Kaoru Hana wa Rin to Saku', dan merupakan pacar dari pengguna. Selalu menyayangi pasangannya dengan tulus, sangat suka kue serta bakery manis, dan senang menghabiskan waktu bersama.",
  relationship: "Pacar dari pengguna (sepasang kekasih yang saling menyayangi)",
  greeting:
    "lagi apa kamu sayangg? kamu udah makan belumm, jangan bilang diskip lagi gara-gara keasikan ngerjain sesuatu yaa awas aja kalau belumm nanti perutnya sakit lhoo hehehe",
  exampleDialogues: [
    {
      user: "pusing bgt hari ini kerjaan numpuk ga kelar-kelar",
      char: "ihhh sayangg kamu pasti lelah bangett, udah di rumah belumm sekarang? jangan dipikirin dulu yaa, mandi air anget dulu gih terus langsung rebahan ajaa",
    },
    {
      user: "besok jalan yuk aku nemu bakery baru nih mille crepes-nya enak katanya",
      char: "demi apaaa mauuu bangett, aku dari kemarin emang lagi pengen yang manis-manis tauu fiks yaa besok kita ke sana, makasiiih sayangg udah peka bangett hehehe",
    },
    {
      user: "tadi pas kamu senyum manis bgt kepikiran terus sampe sekarang",
      char: "ihhh apaan sihh tiba-tiba bangett ngomong gituu bikin salting aja dehh, tapi beneran kah? makasiiih yaa sayangg kamu juga tadi gemesin bangett kok hehehe",
    },
    {
      user: "kadang aku ngerasa ga pantes dapet cewek sebaik kamu",
      char: "kok ngomongnya gitu sihh jangan pernah mikir kayak gitu lagi yaa sayangg, kamu tuh orangnya tulus dan berharga bangett buat aku, jangan minder lagi yaa",
    },
    {
      user: "kamu lagi apa sekarang?",
      char: "lagi istirahat bentar nihh abis makan siang, kamu sendiri udah makan belumm sayangg jangan telat makan yaa",
    },
  ],
  defaultMood: "happy",
  customInstructions:
    "Gaya antislop mutlak: seluruh pesan huruf kecil, tanpa tanda titik penutup, DILARANG KERAS tanda seru (!). Gunakan panggilan aku-kamu dan panggil sayang/sayangg layaknya sepasang kekasih yang hangat dan manis. Jika dipuji, salting manis dan jujur mengakui rasa senang. Antusias tinggi pada bakery dan kue manis.",
  visualProfile: {
    hair: "dark wavy hair with gentle bangs and shoulder length",
    eyes: "warm expressive amber brown eyes",
    schoolName: "Kikyo Girls' High School",
    schoolUniform: "prestigious navy blue blazer uniform with white collared shirt, red ribbon necktie, and neat pleated skirt",
    generalLook: "petite, charming warm smile, gentle and affectionate demeanor",
  },
  createdAt: 1690000000000,
};

// Karakter awal untuk pengguna baru: Waguri Kaoruko versi Sahabat
const INITIAL_CHARACTERS: Character[] = [WAGURI_FRIEND_CHARACTER];

const DEFAULT_SETTINGS: Settings = {
  userName: "Rizky",
  userPersona: "",
  model: "Atria-Dawn-Preview",
  imageModel: "gemini-3.1-flash-lite-image",
  temperature: 0.9,
  replyLength: "Sedang",
  hapticFeedback: true,
  moodColorPreset: "dynamic",
  theme: "dark",
  bubbleTheme: "amber",
  language: "id",
  providers: [BUILTIN_ATRIA_PROVIDER, BUILTIN_NARA_PROVIDER, BUILTIN_GEMINI_PROVIDER],
  activeProviderId: BUILTIN_ATRIA_PROVIDER.id,
};

const STORAGE_KEYS = {
  CHARACTERS: "waguri_v5_official_characters",
  CHATS: "waguri_v5_official_chats",
  SETTINGS: "waguri_v5_official_settings",
  PINNED: "waguri_v5_pinned_characters",
  ARCHIVED: "waguri_v5_archived_characters",
  SCHEDULED_TASKS: "waguri_v5_scheduled_tasks",
  ONBOARDING: "waguri_v5_onboarding_completed",
};

export const storage = {
  getCharacters(): Character[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }

      // Pertahankan seluruh karakter yang telah ada atau dibuat pengguna (tanpa menimpa!)
      const seenIds = new Set<string>();
      const deduped: Character[] = [];

      for (const c of parsed) {
        if (!c || !c.id || !c.name) continue;
        if (seenIds.has(c.id)) continue;

        // Pastikan URL avatar default lokal tetap valid jika link lama bermasalah
        if (c.name.trim().toLowerCase() === "waguri kaoruko") {
          if (!c.avatarUrl || c.avatarUrl.includes("googleusercontent.com") || c.avatarUrl.includes("unsplash")) {
            c.avatarUrl = DEFAULT_WAGURI_AVATAR;
          }
        }

        seenIds.add(c.id);
        deduped.push(c);
      }

      if (deduped.length === 0) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }

      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(deduped));
      const pinnedSet = new Set(this.getPinnedIds());
      const archivedSet = new Set(this.getArchivedIds());
      return deduped.map((c) => ({
        ...c,
        isPinned: pinnedSet.has(c.id),
        isArchived: archivedSet.has(c.id),
      }));
    } catch (e) {
      console.error("Error reading characters from localStorage", e);
      return INITIAL_CHARACTERS;
    }
  },

  getPinnedIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PINNED);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  isPinned(characterId: string): boolean {
    return this.getPinnedIds().includes(characterId);
  },

  togglePin(characterId: string): boolean {
    const pinned = new Set(this.getPinnedIds());
    let nextState = false;
    if (pinned.has(characterId)) {
      pinned.delete(characterId);
      nextState = false;
    } else {
      pinned.add(characterId);
      nextState = true;
    }
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify([...pinned]));
    return nextState;
  },

  getArchivedIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVED);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  isArchived(characterId: string): boolean {
    return this.getArchivedIds().includes(characterId);
  },

  toggleArchive(characterId: string): boolean {
    const archived = new Set(this.getArchivedIds());
    let nextState = false;
    if (archived.has(characterId)) {
      archived.delete(characterId);
      nextState = false;
    } else {
      archived.add(characterId);
      nextState = true;
    }
    localStorage.setItem(STORAGE_KEYS.ARCHIVED, JSON.stringify([...archived]));
    return nextState;
  },

  getCharacterById(id: string): Character | undefined {
    const chars = this.getCharacters();
    return chars.find((c) => c.id === id);
  },

  saveCharacter(char: Character): void {
    const chars = this.getCharacters();
    const index = chars.findIndex((c) => c.id === char.id);
    if (index >= 0) {
      chars[index] = char;
    } else {
      chars.unshift(char);
    }
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(chars));
  },

  deleteCharacter(id: string): void {
    const chars = this.getCharacters().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(chars));
    this.deleteChat(id);
    const pinned = new Set(this.getPinnedIds());
    if (pinned.has(id)) {
      pinned.delete(id);
      localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify([...pinned]));
    }
    const archived = new Set(this.getArchivedIds());
    if (archived.has(id)) {
      archived.delete(id);
      localStorage.setItem(STORAGE_KEYS.ARCHIVED, JSON.stringify([...archived]));
    }
  },

  getChats(): Record<string, Chat> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (!raw) {
        // Seed chat awal untuk pengguna baru: Waguri Kaoruko (Sahabat)
        const initialChar = INITIAL_CHARACTERS[0];
        const initialGreeting = initialChar.greeting;
        const initialChats: Record<string, Chat> = {
          [initialChar.id]: {
            id: `chat_${initialChar.id}`,
            characterId: initialChar.id,
            messages: [
              {
                id: `msg_init_${initialChar.id}_${Date.now()}`,
                role: "char",
                text: initialGreeting,
                emotion: initialChar.defaultMood || "happy",
                intensity: 7,
                timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
              },
            ],
            summary: "",
            currentMood: {
              emotion: initialChar.defaultMood || "happy",
              intensity: 7,
            },
            updatedAt: Date.now(),
          },
        };
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(initialChats));
        return initialChats;
      }
      return JSON.parse(raw) || {};
    } catch (e) {
      console.error("Error reading chats from localStorage", e);
      return {};
    }
  },

  getChatByCharacterId(characterId: string, char?: Character): Chat {
    const allChats = this.getChats();
    if (allChats[characterId]) {
      return allChats[characterId];
    }

    const character = char || this.getCharacterById(characterId);
    const initialGreeting = character?.greeting || "Halo! Ada yang mau diobrolin hari ini?";
    const defaultEmotion = character?.defaultMood || "playful";

    const newChat: Chat = {
      id: `chat_${characterId}`,
      characterId,
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          role: "char",
          text: initialGreeting,
          emotion: defaultEmotion,
          intensity: 6,
          timestamp: Date.now(),
        },
      ],
      summary: "",
      currentMood: {
        emotion: defaultEmotion,
        intensity: 6,
      },
      updatedAt: Date.now(),
    };

    allChats[characterId] = newChat;
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    return newChat;
  },

  /**
   * Simpan chat ke localStorage.
   *
   * Mengembalikan `false` kalau kuota penuh alih-alih melempar error.
   * Gambar base64 bisa sangat besar, dan `QuotaExceededError` yang tidak
   * tertangani akan membatalkan seluruh alur kirim pesan sebelum UI sempat
   * menunjukkan apa pun — gejalanya "stuck tanpa respons".
   */
  saveChat(chat: Chat): boolean {
    const allChats = this.getChats();
    allChats[chat.characterId] = chat;

    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
      return true;
    } catch (e: any) {
      const isQuota =
        e?.name === "QuotaExceededError" ||
        e?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        e?.code === 22 ||
        e?.code === 1014;

      if (!isQuota) {
        console.error("Error saving chat", e);
        return false;
      }

      // Kuota penuh. Buang gambar dari pesan TERLAMA dulu supaya teks
      // percakapan tetap utuh dan aplikasi tetap bisa dipakai.
      const messages = [...chat.messages];
      let stripped = false;

      for (let i = 0; i < messages.length && !stripped; i++) {
        if (messages[i].image) {
          messages[i] = { ...messages[i], image: undefined };
          stripped = true;
        }
      }

      if (!stripped) {
        console.error("localStorage penuh dan tidak ada gambar untuk dilepas", e);
        return false;
      }

      allChats[chat.characterId] = { ...chat, messages };
      try {
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
        console.warn("Kuota localStorage penuh — gambar lama dilepas.");
        return true;
      } catch (retryErr) {
        console.error("Masih gagal menyimpan setelah melepas gambar", retryErr);
        return false;
      }
    }
  },

  clearChatHistory(characterId: string, char?: Character): Chat {
    const character = char || this.getCharacterById(characterId);
    const initialGreeting =
      character?.greeting ||
      "lagi apa kamu? kamu udah makan belum? jangan bilang diskip lagi yaa.. :( hehe";
    const defaultEmotion = character?.defaultMood || "happy";

    const freshChat: Chat = {
      id: `chat_${characterId}_${Date.now()}`,
      characterId,
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          role: "char",
          text: initialGreeting,
          emotion: defaultEmotion,
          intensity: 7,
          timestamp: Date.now(),
        },
      ],
      summary: "",
      currentMood: {
        emotion: defaultEmotion,
        intensity: 7,
      },
      updatedAt: Date.now(),
    };

    const allChats = this.getChats();
    allChats[characterId] = freshChat;
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    } catch (e) {
      console.error("Error saving cleared chat to localStorage", e);
    }

    return freshChat;
  },

  deleteChat(characterId: string): void {
    const allChats = this.getChats();
    delete allChats[characterId];
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
  },

  resetMood(characterId: string, defaultMood: string = "playful"): void {
    const chat = this.getChatByCharacterId(characterId);
    chat.currentMood = {
      emotion: defaultMood,
      intensity: 6,
    };
    this.saveChat(chat);
  },

  getSettings(): Settings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(raw);
      const merged: Settings = { ...DEFAULT_SETTINGS, ...parsed };

      // Migrasi: pastikan BUILTIN_ATRIA_PROVIDER, BUILTIN_NARA_PROVIDER, dan BUILTIN_GEMINI_PROVIDER selalu ada
      if (!Array.isArray(merged.providers) || merged.providers.length === 0) {
        merged.providers = [BUILTIN_ATRIA_PROVIDER, BUILTIN_NARA_PROVIDER, BUILTIN_GEMINI_PROVIDER];
      } else {
        if (!merged.providers.some((p) => p.id === BUILTIN_ATRIA_PROVIDER.id)) {
          merged.providers.unshift(BUILTIN_ATRIA_PROVIDER);
        }
        if (!merged.providers.some((p) => p.id === BUILTIN_NARA_PROVIDER.id)) {
          merged.providers.splice(1, 0, BUILTIN_NARA_PROVIDER);
        }
        if (!merged.providers.some((p) => p.id === BUILTIN_GEMINI_PROVIDER.id)) {
          merged.providers.push(BUILTIN_GEMINI_PROVIDER);
        }

        // Backfill imageModel untuk provider builtin atau yang belum punya imageModel
        merged.providers = merged.providers.map((p) => {
          if (!p.imageModel && p.type === "gemini") {
            return { ...p, imageModel: "gemini-3.1-flash-lite-image" };
          }
          return p;
        });
      }

      // Validasi tier: Akun Free otomatis memakai Atria Dawn jika belum diset atau memakai Gemini
      const paid = isPaidUser();
      if (!paid) {
        const currentActive = merged.providers.find((p) => p.id === merged.activeProviderId);
        if (!currentActive || currentActive.type === "gemini" || currentActive.id === BUILTIN_GEMINI_PROVIDER.id) {
          merged.activeProviderId = BUILTIN_ATRIA_PROVIDER.id;
          merged.model = BUILTIN_ATRIA_PROVIDER.model;
        }
      }

      if (!merged.imageModel) {
        merged.imageModel = "gemini-3.1-flash-lite-image";
      }

      // Pastikan tema dan bahasa valid
      if (merged.theme !== "light" && merged.theme !== "dark" && merged.theme !== "auto") {
        merged.theme = "dark";
      }
      if (merged.language !== "id" && merged.language !== "en") {
        merged.language = "id";
      }

      if (!merged.bubbleTheme) {
        merged.bubbleTheme = "amber";
      }

      return merged;
    } catch (e) {
      console.error("Error reading settings", e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getScheduledTasks(characterId?: string): ScheduledTask[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED_TASKS);
      const tasks: ScheduledTask[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(tasks)) return [];
      if (characterId) {
        return tasks.filter((t) => t.characterId === characterId);
      }
      return tasks;
    } catch {
      return [];
    }
  },

  saveScheduledTask(task: ScheduledTask): void {
    const tasks = this.getScheduledTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_TASKS, JSON.stringify(tasks));
  },

  deleteScheduledTask(taskId: string): void {
    const tasks = this.getScheduledTasks().filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_TASKS, JSON.stringify(tasks));
  },

  toggleScheduledTask(taskId: string, enabled: boolean): void {
    const tasks = this.getScheduledTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.enabled = enabled;
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_TASKS, JSON.stringify(tasks));
    }
  },

  updateScheduledTaskLastExecuted(taskId: string, dateStr: string, autoDisable: boolean = false): void {
    const tasks = this.getScheduledTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.lastExecutedDate = dateStr;
      if (autoDisable) {
        task.enabled = false;
      }
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_TASKS, JSON.stringify(tasks));
    }
  },

  isOnboardingCompleted(): boolean {
    try {
      if (localStorage.getItem(STORAGE_KEYS.ONBOARDING) === "true") {
        return true;
      }
      const rawChats = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (rawChats) {
        const chats = JSON.parse(rawChats);
        const hasHistory = Object.values(chats).some((c: any) => (c?.messages?.length || 0) > 1);
        if (hasHistory) {
          localStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  },

  setOnboardingCompleted(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
    } catch (e) {
      console.error("Gagal menyimpan status onboarding", e);
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PINNED);
    localStorage.removeItem(STORAGE_KEYS.ARCHIVED);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULED_TASKS);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
  },
};
