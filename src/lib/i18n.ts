import { AppLanguage } from "../types";

export const translations = {
  id: {
    // Navigation Tabs
    navChats: "Pesan",
    navChatsTitle: "Pesan Obrolan",
    navCreate: "Buat",
    navCreateTitle: "Buat Karakter Baru",
    navSettings: "Akun",
    navSettingsTitle: "Pengaturan & Profil",

    // Chats List Screen
    chatsHeading: "Pesan",
    searchPlaceholder: "Cari percakapan atau karakter...",
    cancel: "Batal",
    add: "Tambah",
    newBadge: "Baru",
    typing: "sedang mengetik...",
    noChatsFound: "Tidak Ada Obrolan Ditemukan",
    noChatsPrompt: "Mulai percakapan baru dengan menekan tombol tambah.",
    deleteChatConfirm: "Hapus percakapan dengan {name}?",

    // Chat Screen Header & Menus
    online: "Online",
    back: "Kembali",
    actionMenuTitle: "Menu Tindakan",
    viewCharacterProfile: "Lihat Profil Karakter",
    moodStatsAndTrends: "Statistik & Tren Mood",
    customInstructionsSystem: "Instruksi Khusus (System)",
    clearChatHistory: "Bersihkan Isi Chat",
    clearChatConfirmTitle: "Bersihkan Semua Pesan?",
    clearChatConfirmDesc: "Seluruh pesan dengan {name} akan dihapus, tetapi karakter tetap tersimpan.",
    clearChatConfirmBtn: "Bersihkan",

    // Chat Screen Input & Bubble
    messagePlaceholder: "Message",
    attachmentTitle: "Lampiran",
    photoAttachment: "Kirim foto",
    takePhoto: "Ambil Foto",
    chooseFromGallery: "Pilih dari Galeri",
    loadingImage: "Memuat gambar...",
    voiceNoteTitle: "Pesan suara",
    photoTitle: "Foto",
    you: "Kamu",
    recordingAudio: "Merekam...",
    slideCancel: "Geser ke kiri untuk membatalkan",
    recordingUnsupported: "Browser ini tidak mendukung perekaman suara. Coba ketik pesanmu.",
    audioTooShort: "Perekaman terlalu singkat untuk dikirim.",
    copyText: "Salin Teks",
    copiedToast: "Teks disalin ke clipboard",
    reply: "Balas",
    deleteMessage: "Hapus Pesan",
    today: "Hari ini",
    yesterday: "Kemarin",

    // Desktop Empty State
    desktopEmptyTitle: "Pilih obrolan",
    desktopEmptyDesc: "Pilih karakter di daftar sebelah kiri untuk lanjut ngobrol.",
    desktopEmptyBtn: "Buat Karakter",

    // Settings Screen
    settingsHeading: "Akun & Pengaturan",
    settingsSubheading: "Kelola profil, gaya percakapan, dan preferensi aplikasi",
    nicknameLabel: "Nama Panggilan Kamu",
    nicknamePlaceholder: "Namamu...",
    nicknameSavedToast: "Nama panggilan disimpan!",

    // Settings: Appearance / Theme
    appearanceTitle: "Tampilan",
    themeLight: "Terang",
    themeDark: "Gelap",
    themeAuto: "Otomatis",
    themeDesc: "\"Otomatis\" mengikuti pengaturan mode gelap atau terang dari perangkatmu.",
    themeToast: "Tema: {val}",

    // Settings: Language
    languageTitle: "Bahasa Tampilan",
    langId: "Bahasa Indonesia",
    langEn: "English",
    langDesc: "Pilih bahasa tampilan antarmuka aplikasi.",
    langToast: "Bahasa diubah ke {val}",

    // Settings: Chat Style
    chatStyleTitle: "Gaya Interaksi Obrolan",
    replyLengthLabel: "Panjang Balasan",
    replyLengthShort: "Pendek",
    replyLengthMedium: "Sedang",
    replyLengthLong: "Panjang",
    replyLengthDesc: "Pilihan ini menentukan seberapa panjang AI akan merespons chatmu.",
    replyLengthToast: "Panjang balasan: {val}",

    // Settings: Haptics & Notif
    hapticsTitle: "Getaran Haptik",
    hapticsDesc: "Getaran halus saat mengetik, mengirim pesan, dan berinteraksi.",
    notificationsTitle: "Notifikasi Chat",
    notificationsDesc: "Terima pesan dari karakter saat aplikasi tidak dibuka.",
    notifActive: "Aktif",
    notifRequest: "Minta Izin",
    notifBlocked: "Diblokir",

    // Settings: Advanced & Danger Zone
    advancedTitle: "Opsi Lanjutan & Developer",
    advancedDesc: "Atur provider LLM (Gemini, OpenRouter, Custom URL), API key, dan temperatur respons AI.",
    dangerZoneTitle: "Zona Bahaya",
    resetAppTitle: "Hapus Semua Data Aplikasi",
    resetAppDesc: "Menghapus semua karakter buatan, riwayat chat, dan pengaturan kembali ke awal.",
    resetBtn: "Reset ke Pengaturan Awal",
    resetConfirmTitle: "Reset Semua Data?",
    resetConfirmDesc: "Tindakan ini tidak bisa dibatalkan. Seluruh riwayat obrolan, karakter yang kamu buat, dan API key akan dihapus secara permanen.",
    resetConfirmBtn: "Ya, Hapus Semua",

    // Character Form
    charCreateTitle: "Buat Karakter Baru",
    charEditTitle: "Edit Karakter",
    charCreateSubtitle: "Rancang kepribadian, gaya bicara, dan latar belakang pacar impianmu",
    charEditSubtitle: "Perbarui detail profil dan gaya interaksi karakter ini",
    charAvatarLabel: "Foto Profil Karakter",
    charUploadDevice: "Upload dari Perangkat",
    charUploadCompressing: "Mengompres & memproses gambar...",
    charOrChoosePreset: "Atau pilih preset foto:",
    charNameLabel: "Nama Karakter",
    charNamePlaceholder: "Misal: Waguri Kaoruko, Alya, dll.",
    charNameError: "Nama karakter wajib diisi!",
    charTaglineLabel: "Bio Singkat / Tagline",
    charTaglinePlaceholder: "Misal: Pacar yang hangat dan penuh perhatian",
    charPersonalityLabel: "Kepribadian & Sifat",
    charPersonalityPlaceholder: "Jelaskan sifatnya secara detail...",
    charSpeakingStyleLabel: "Gaya Bicara & Nada Obrolan",
    charSpeakingStylePlaceholder: "Cara dia merespons chatmu...",
    charGreetingLabel: "Pesan Pembuka (Pertama Kali Chat)",
    charGreetingPlaceholder: "Pesan pertama saat mulai mengobrol...",
    charSaveBtn: "Simpan Karakter",
    charCancelBtn: "Batal",
  },
  en: {
    // Navigation Tabs
    navChats: "Chats",
    navChatsTitle: "Chat Messages",
    navCreate: "Create",
    navCreateTitle: "Create New Character",
    navSettings: "Settings",
    navSettingsTitle: "Settings & Profile",

    // Chats List Screen
    chatsHeading: "Messages",
    searchPlaceholder: "Search chats or characters...",
    cancel: "Cancel",
    add: "Add",
    newBadge: "New",
    typing: "typing...",
    noChatsFound: "No Chats Found",
    noChatsPrompt: "Start a new conversation by tapping the add button.",
    deleteChatConfirm: "Delete conversation with {name}?",

    // Chat Screen Header & Menus
    online: "Online",
    back: "Back",
    actionMenuTitle: "Action Menu",
    viewCharacterProfile: "View Character Profile",
    moodStatsAndTrends: "Mood Stats & Trends",
    customInstructionsSystem: "Custom Instructions (System)",
    clearChatHistory: "Clear Chat History",
    clearChatConfirmTitle: "Clear All Messages?",
    clearChatConfirmDesc: "All messages with {name} will be removed, but the character will remain saved.",
    clearChatConfirmBtn: "Clear",

    // Chat Screen Input & Bubble
    messagePlaceholder: "Message",
    attachmentTitle: "Attachment",
    photoAttachment: "Send photo",
    takePhoto: "Take Photo",
    chooseFromGallery: "Choose from Gallery",
    loadingImage: "Loading image...",
    voiceNoteTitle: "Voice message",
    photoTitle: "Photo",
    you: "You",
    recordingAudio: "Recording...",
    slideCancel: "Slide left to cancel",
    recordingUnsupported: "This browser does not support audio recording. Please type your message.",
    audioTooShort: "Recording is too short to send.",
    copyText: "Copy Text",
    copiedToast: "Text copied to clipboard",
    reply: "Reply",
    deleteMessage: "Delete Message",
    today: "Today",
    yesterday: "Yesterday",

    // Desktop Empty State
    desktopEmptyTitle: "Select a chat",
    desktopEmptyDesc: "Choose a character from the list on the left to continue chatting.",
    desktopEmptyBtn: "Create Character",

    // Settings Screen
    settingsHeading: "Account & Settings",
    settingsSubheading: "Manage profile, conversation style, and app preferences",
    nicknameLabel: "Your Nickname",
    nicknamePlaceholder: "Your name...",
    nicknameSavedToast: "Nickname saved!",

    // Settings: Appearance / Theme
    appearanceTitle: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeAuto: "Auto",
    themeDesc: "\"Auto\" follows your device's light or dark mode setting.",
    themeToast: "Theme: {val}",

    // Settings: Language
    languageTitle: "Display Language",
    langId: "Bahasa Indonesia",
    langEn: "English",
    langDesc: "Choose the application interface display language.",
    langToast: "Language set to {val}",

    // Settings: Chat Style
    chatStyleTitle: "Chat Interaction Style",
    replyLengthLabel: "Reply Length",
    replyLengthShort: "Short",
    replyLengthMedium: "Medium",
    replyLengthLong: "Long",
    replyLengthDesc: "Determines how long the AI response will be in conversations.",
    replyLengthToast: "Reply length: {val}",

    // Settings: Haptics & Notif
    hapticsTitle: "Haptic Feedback",
    hapticsDesc: "Subtle vibrations when typing, sending messages, and interacting.",
    notificationsTitle: "Chat Notifications",
    notificationsDesc: "Receive character messages when the app is in the background.",
    notifActive: "Active",
    notifRequest: "Request",
    notifBlocked: "Blocked",

    // Settings: Advanced & Danger Zone
    advancedTitle: "Advanced & Developer Options",
    advancedDesc: "Configure LLM providers (Gemini, OpenRouter, Custom URL), API keys, and AI response temperature.",
    dangerZoneTitle: "Danger Zone",
    resetAppTitle: "Reset All App Data",
    resetAppDesc: "Removes all custom characters, chat histories, and resets settings to defaults.",
    resetBtn: "Reset to Factory Defaults",
    resetConfirmTitle: "Reset All Data?",
    resetConfirmDesc: "This action cannot be undone. All conversations, custom characters, and API key configurations will be permanently cleared.",
    resetConfirmBtn: "Yes, Reset Everything",

    // Character Form
    charCreateTitle: "Create New Character",
    charEditTitle: "Edit Character",
    charCreateSubtitle: "Design your dream companion's personality, speaking style, and backstory",
    charEditSubtitle: "Update profile details and interaction style for this character",
    charAvatarLabel: "Character Profile Picture",
    charUploadDevice: "Upload from Device",
    charUploadCompressing: "Compressing & processing image...",
    charOrChoosePreset: "Or choose a photo preset:",
    charNameLabel: "Character Name",
    charNamePlaceholder: "E.g.: Waguri Kaoruko, Alya, etc.",
    charNameError: "Character name is required!",
    charTaglineLabel: "Short Bio / Tagline",
    charTaglinePlaceholder: "E.g.: Warm and caring girlfriend",
    charPersonalityLabel: "Personality & Traits",
    charPersonalityPlaceholder: "Describe traits and personality in detail...",
    charSpeakingStyleLabel: "Speaking Style & Tone",
    charSpeakingStylePlaceholder: "How they respond to your messages...",
    charGreetingLabel: "Opening Greeting (First Message)",
    charGreetingPlaceholder: "First greeting when starting a conversation...",
    charSaveBtn: "Save Character",
    charCancelBtn: "Cancel",
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

export function t(
  key: TranslationKey,
  lang: AppLanguage = "id",
  params?: Record<string, string>
): string {
  const dict = translations[lang] || translations.id;
  let str = dict[key] || translations.id[key] || (key as string);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });
  }
  return str;
}

export function getDictionary(lang: AppLanguage = "id") {
  return translations[lang] || translations.id;
}
