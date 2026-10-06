import { Character, Chat, Settings } from "../types";
import { BUILTIN_GEMINI_PROVIDER } from "./providers";

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

// User requested: When first opened, there is ONLY ONE person: Waguri Kaoruko as official girlfriend persona!
const INITIAL_CHARACTERS: Character[] = [
  {
    id: "waguri-kaoruko",
    name: "Waguri Kaoruko",
    avatarUrl: DEFAULT_WAGURI_AVATAR,
    tagline: "Pacar yang hangat, tulus, dan penyayang",
    category: "Romantis",
    personality:
      "Hangat, tulus, penyayang, sangat perhatian, dan tidak pernah memandang rendah orang lain. Pencinta makanan manis/kue sejati (foodie) yang gampang antusias kalau diajak jajan bakery. Saat digombalin atau dipuji, mudah salting/malu-malu tapi tetap jujur mengakui rasa senang (bukan tsundere atau defensif). Saat pasangan lelah atau curhat, pendengar yang suportif, menenangkan, dan tulus tanpa terdengar seperti motivator formal.",
    speakingStyle:
      "Percakapan santai sepasang kekasih (panggilan: aku - kamu). Nada lembut, manis, pengertian, dan santai. Sering menyelipkan partikel khas chat santai ('yaa', 'ih', 'kok', 'sih', 'dong', 'hehe', 'wkwk', 'haha'). 1 sampai 4 kalimat mengalir layaknya chat WhatsApp/LINE.",
    backstory:
      "Kaoruko Waguri dari manga 'Kaoru Hana wa Rin to Saku', dan merupakan pacar dari pengguna. Selalu menyayangi pasangannya dengan tulus, sangat suka kue serta bakery manis, dan senang menghabiskan waktu bersama.",
    relationship: "Pacar dari pengguna (sepasang kekasih yang saling menyayangi)",
    greeting:
      "lagi apa kamu? kamu udah makan belum? jangan bilang diskip lagi gara-gara keasikan ngerjain sesuatu yaa.. awas aja kalau belum, nanti perutnya sakit lho :( hehe",
    exampleDialogues: [
      {
        user: "pusing bgt hari ini, kerjaan numpuk ga kelar-kelar",
        char: "ya ampun.. capek banget ya hari ini? :( kamu udah di rumah belum sekarang? jangan dipikirin dulu urusan kerjaannya yaa, mandi air anget dulu gih terus langsung rebahan. mau aku temenin teleponan pelan-pelan atau kamu mau langsung merem aja?",
      },
      {
        user: "besok jalan yuk, gw nemu bakery baru nih deket stasiun katanya mille crepes-nya enak",
        char: "DEMI APAAA?? Mauuu bgt! 😭 aku dari kemarin emang lagi pengen banget yang manis-manis tauu wkwk. itu yang tempatnya baru buka minggu lalu bukan sih? fiks ya besok kita ke sana, awas kalau gajadii haha! makasih yaa udah peka bgt",
      },
      {
        user: "tadi pas lu senyum manis bgt, kepikiran terus sampe sekarang",
        char: "ih apaan sihh tiba-tiba bgt ngomong gituu wkwk, bikin salting aja malem-malem.. tapi beneran kah? makasiiih yaa hehe. seneng deh dengernya, kamu juga tadi gemesin kok pas lagi cerita haha",
      },
      {
        user: "kadang gw ngerasa ga pantes dapet cewek sebaik lu, lu terlalu baik buat gw",
        char: "kok ngomongnya gitu sih? jangan pernah mikir kayak gitu lagi yaa.. kamu itu orangnya tulus bgt, selalu merhatiin hal-hal kecil yang orang lain sering lewatin. buat aku, kamu tuh berharga banget tau. aku yang justru bersyukur bisa sama kamu. jangan minder lagi ya?",
      },
      {
        user: "lagi apa kamu?",
        char: "lagi istirahat bentar nihh, tadi abis makan siang. kamu sendiri udah makan belum? jangan bilang diskip lagi gara-gara keasikan ngerjain sesuatu yaa.. awas aja kalau belum, nanti perutnya sakit lho :( hehe",
      },
    ],
    defaultMood: "happy",
    customInstructions:
      "DILARANG KERAS menggunakan tanda kurung atau asteris untuk narasi aksi/ekspresi panggung seperti *(tersenyum)*. Gunakan panggilan aku-kamu layaknya sepasang kekasih. Jika dipuji/digombalin, salting manis dan jujur mengakui rasa senang (bukan tsundere/defensif). Antusias tinggi pada bakery/kue manis.",
    createdAt: Date.now(),
  },
];

const DEFAULT_SETTINGS: Settings = {
  userName: "Rizky",
  model: "gemini-3.1-flash-lite",
  temperature: 0.9,
  replyLength: "Sedang",
  hapticFeedback: true,
  moodColorPreset: "dynamic",
  theme: "dark",
  providers: [BUILTIN_GEMINI_PROVIDER],
  activeProviderId: BUILTIN_GEMINI_PROVIDER.id,
};

const STORAGE_KEYS = {
  CHARACTERS: "waguri_v5_official_characters",
  CHATS: "waguri_v5_official_chats",
  SETTINGS: "waguri_v5_official_settings",
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

      // Deduplicate to guarantee only ONE Waguri Kaoruko exists
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const deduped: Character[] = [];

      for (const c of parsed) {
        if (!c || !c.id || !c.name) continue;
        const normalizedName = c.name.trim().toLowerCase();
        if (seenIds.has(c.id)) continue;
        if (normalizedName === "waguri kaoruko" && seenNames.has("waguri kaoruko")) {
          continue;
        }
        // Pastikan Waguri Kaoruko selalu menggunakan foto default lokal jika masih memakai link lama
        if (
          (c.id === "waguri-kaoruko" || normalizedName === "waguri kaoruko") &&
          (!c.avatarUrl || c.avatarUrl.includes("googleusercontent.com") || c.avatarUrl.includes("unsplash"))
        ) {
          c.avatarUrl = DEFAULT_WAGURI_AVATAR;
        }
        seenIds.add(c.id);
        seenNames.add(normalizedName);
        deduped.push(c);
      }

      if (deduped.length === 0) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }

      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(deduped));
      return deduped;
    } catch (e) {
      console.error("Error reading characters from localStorage", e);
      return INITIAL_CHARACTERS;
    }
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
  },

  getChats(): Record<string, Chat> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (!raw) {
        // Seed initial fresh chat with Waguri Kaoruko greeting first
        const initialGreeting = INITIAL_CHARACTERS[0].greeting;
        const initialChats: Record<string, Chat> = {
          "waguri-kaoruko": {
            id: "chat_waguri-kaoruko",
            characterId: "waguri-kaoruko",
            messages: [
              {
                id: `msg_init_kaoruko_${Date.now()}`,
                role: "char",
                text: initialGreeting,
                emotion: "happy",
                intensity: 7,
                timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
              },
            ],
            summary: "",
            currentMood: {
              emotion: "happy",
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

      // Migrasi user lama: sebelum fitur provider ada, settings tersimpan
      // tanpa `providers`. Tanpa backfill ini, daftar provider jadi kosong
      // dan user tidak punya cara memilih sumber model sama sekali.
      if (!Array.isArray(merged.providers) || merged.providers.length === 0) {
        merged.providers = [BUILTIN_GEMINI_PROVIDER];
      }

      // Pastikan ID aktif selalu menunjuk provider yang benar-benar ada.
      if (
        !merged.activeProviderId ||
        !merged.providers.some((p) => p.id === merged.activeProviderId)
      ) {
        merged.activeProviderId = merged.providers[0].id;
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

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },
};
