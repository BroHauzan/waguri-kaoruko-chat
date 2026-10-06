import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Search,
  QrCode,
  Pencil,
  Sparkles,
  MessageSquareText,
  Palette,
  Globe,
  Bell,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Vibrate,
  Sliders,
  AlertTriangle,
  Trash2,
  X,
  Cpu,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Character, Chat, Settings, ThemeMode, AppLanguage } from "../types";
import { haptics } from "../lib/haptics";
import { ProviderManager } from "./ProviderManager";
import { getActiveProvider } from "../lib/providers";
import { applyTheme } from "../lib/useTheme";
import { getDictionary, t } from "../lib/i18n";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPushLikeNotification,
} from "../lib/pushNotification";

interface SettingsScreenProps {
  settings: Settings;
  characters?: Character[];
  chats?: Record<string, Chat>;
  onBack?: () => void;
  onSaveSettings: (settings: Settings) => void;
  onClearAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onBack,
  onSaveSettings,
  onClearAllData,
}) => {
  const [userName, setUserName] = useState(settings.userName || "Hauzan");
  const [model] = useState(settings.model || "gemini-3.1-flash-lite");
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.8);
  const [replyLength, setReplyLength] = useState(settings.replyLength || "Sedang");
  const [hapticFeedback, setHapticFeedback] = useState(settings.hapticFeedback !== false);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || "dark");
  const [language, setLanguage] = useState<AppLanguage>(settings.language || "id");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());

  // Modal & Sheet States
  const [activeModal, setActiveModal] = useState<
    "none" | "profile" | "model" | "chatStyle" | "theme" | "language" | "notifications" | "advanced" | "qr"
  >("none");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [emojiStatus, setEmojiStatus] = useState("✨");

  // Sinkronkan state lokal saat prop settings dari parent berubah
  useEffect(() => {
    if (settings.theme && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    if (settings.language && settings.language !== language) {
      setLanguage(settings.language);
    }
  }, [settings.language]);

  const dict = getDictionary(language);

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: dict.themeLight, icon: Sun },
    { id: "dark", label: dict.themeDark, icon: Moon },
    { id: "auto", label: dict.themeAuto, icon: Monitor },
  ];

  const languageOptions: { id: AppLanguage; label: string; flag: string }[] = [
    { id: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
    { id: "en", label: "English", flag: "🇬🇧" },
  ];

  const conversationPresets = [
    {
      temp: 0.6,
      label: language === "en" ? "Focused & Consistent" : "Fokus & Konsisten",
      desc: language === "en" ? "Structured, calm, and predictable replies" : "Jawaban teratur, tenang, dan runtut",
    },
    {
      temp: 0.8,
      label: language === "en" ? "Natural & Flowing" : "Natural & Mengalir",
      desc: language === "en" ? "Warm, casual, and true-to-life (Recommended)" : "Hangat, luwes, dan seperti obrolan nyata (Disarankan)",
      recommended: true,
    },
    {
      temp: 1.1,
      label: language === "en" ? "Spontaneous & Expressive" : "Spontan & Ekspresif",
      desc: language === "en" ? "Lively, expressive, and full of pleasant surprises" : "Variatif, kaya emosi, dan penuh kejutan",
    },
  ];

  const activeProvider = getActiveProvider(settings);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const handleTempChange = (newVal: number) => {
    setTemperature(newVal);
    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature: newVal,
      replyLength,
      hapticFeedback,
      theme,
      language,
    });
  };

  const handleSelectLength = (len: "Pendek" | "Sedang" | "Panjang") => {
    setReplyLength(len);
    haptics.light(hapticFeedback);
    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature,
      replyLength: len,
      hapticFeedback,
      theme,
      language,
    });
    const lenLabel =
      len === "Pendek"
        ? dict.replyLengthShort
        : len === "Sedang"
        ? dict.replyLengthMedium
        : dict.replyLengthLong;
    showToast(t("replyLengthToast", language, { val: lenLabel }));
  };

  const handleSelectTheme = (next: ThemeMode) => {
    setTheme(next);
    applyTheme(next);
    haptics.light(hapticFeedback);

    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature,
      replyLength,
      hapticFeedback,
      theme: next,
      language,
    });

    const valLabel =
      next === "light"
        ? dict.themeLight
        : next === "dark"
        ? dict.themeDark
        : dict.themeAuto;
    showToast(t("themeToast", language, { val: valLabel }));
  };

  const handleSelectLanguage = (nextLang: AppLanguage) => {
    setLanguage(nextLang);
    haptics.light(hapticFeedback);

    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature,
      replyLength,
      hapticFeedback,
      theme,
      language: nextLang,
    });

    const langName = nextLang === "en" ? "English" : "Bahasa Indonesia";
    showToast(t("langToast", nextLang, { val: langName }));
  };

  const toggleHaptics = () => {
    const newVal = !hapticFeedback;
    setHapticFeedback(newVal);
    haptics.light(newVal);
    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature,
      replyLength,
      hapticFeedback: newVal,
      theme,
      language,
    });
    showToast(
      newVal
        ? language === "en"
          ? "Haptic feedback enabled"
          : "Getaran haptik aktif"
        : language === "en"
        ? "Haptic feedback disabled"
        : "Getaran haptik dinonaktifkan"
    );
  };

  // Helper untuk subtitle menu
  const getThemeSubtitle = () => {
    if (theme === "light") return dict.themeLight;
    if (theme === "dark") return dict.themeDark;
    return dict.themeAuto;
  };

  const getLanguageSubtitle = () => {
    return language === "en" ? "English" : "Bahasa Indonesia";
  };

  const getReplyLengthSubtitle = () => {
    const lengthStr =
      replyLength === "Pendek"
        ? dict.replyLengthShort
        : replyLength === "Sedang"
        ? dict.replyLengthMedium
        : dict.replyLengthLong;
    return `${lengthStr} • ${temperature.toFixed(1)} temp`;
  };

  const getNotifSubtitle = () => {
    return notifPermission === "granted"
      ? language === "en" ? "Enabled for background replies" : "Aktif untuk balasan di latar belakang"
      : language === "en" ? "Notifications disabled" : "Notifikasi belum diaktifkan";
  };

  // Menu item definitions
  const menuItems = [
    {
      id: "model" as const,
      icon: Sparkles,
      title: language === "en" ? "AI Model & Provider" : "Model & Provider AI",
      subtitle: `${activeProvider.name} • ${activeProvider.model || model}`,
      onClick: () => setActiveModal("model"),
    },
    {
      id: "chatStyle" as const,
      icon: MessageSquareText,
      title: language === "en" ? "Chat & Response Style" : "Chat & Gaya Respons",
      subtitle: getReplyLengthSubtitle(),
      onClick: () => setActiveModal("chatStyle"),
    },
    {
      id: "theme" as const,
      icon: Palette,
      title: language === "en" ? "Appearance & Theme" : "Tampilan & Tema",
      subtitle: getThemeSubtitle(),
      onClick: () => setActiveModal("theme"),
    },
    {
      id: "language" as const,
      icon: Globe,
      title: language === "en" ? "App Language" : "Bahasa Aplikasi",
      subtitle: getLanguageSubtitle(),
      onClick: () => setActiveModal("language"),
    },
    {
      id: "notifications" as const,
      icon: Bell,
      title: language === "en" ? "Reply Notifications" : "Notifikasi Balasan",
      subtitle: getNotifSubtitle(),
      onClick: () => setActiveModal("notifications"),
    },
  ];

  const filteredMenuItems = searchQuery.trim()
    ? menuItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F] text-neutral-900 dark:text-[#F2F3F7] transition-colors duration-200">
      {/* Toast Notifikasi Ringan Floating */}
      {toastMsg && (
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-down">
          <div className="liquid-glass-strong px-4 py-2 rounded-full shadow-lg border border-black/5 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-[#F2F3F7] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5B838]" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* 1. TOP ACTION BAR (WhatsApp Hierarchy) */}
      <header className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-transparent">
        <div className="flex items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 text-neutral-700 dark:text-[#D1D2D9] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              title={language === "en" ? "Back" : "Kembali"}
              aria-label={language === "en" ? "Back" : "Kembali"}
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <h1 className="text-lg font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight ml-1">
            {language === "en" ? "Settings" : "Pengaturan"}
          </h1>
        </div>

        {/* Action Icons: Search, QR Code, Pencil */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setShowSearchInput((prev) => !prev)}
            className="p-2 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            title={language === "en" ? "Search" : "Cari"}
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("qr")}
            className="p-2 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            title={language === "en" ? "QR Code" : "Kode QR"}
          >
            <QrCode size={20} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("profile")}
            className="p-2 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            title={language === "en" ? "Edit Profile" : "Edit Profil"}
          >
            <Pencil size={20} />
          </button>
        </div>
      </header>

      {/* Expandable Search Input Bar */}
      {showSearchInput && (
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-[#16171B]/60 backdrop-blur-md animate-fade-in">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search settings..." : "Cari pengaturan..."}
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-sm bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F5B838]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CENTERED PROFILE HEADER (WhatsApp Android Hierarchy) */}
      <section className="flex flex-col items-center pt-5 pb-6 px-4">
        {/* Pill Badge di atas Avatar */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-200/70 dark:bg-white/10 text-neutral-700 dark:text-[#C9CAD1] shadow-2xs backdrop-blur-xs">
            <span>{emojiStatus}</span>
            <span>{language === "en" ? "Today in emoji..." : "Hari ini dalam emoji..."}</span>
          </div>
        </div>

        {/* Large Rounded Avatar */}
        <div
          onClick={() => setActiveModal("profile")}
          className="relative w-24 h-24 rounded-full border-2 border-black/10 dark:border-white/15 overflow-hidden shadow-sm cursor-pointer group hover:border-[#F5B838] transition-all"
        >
          <img
            src="/rintaro-pfp.jpg"
            alt={userName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Pencil size={18} className="text-white drop-shadow" />
          </div>
        </div>

        {/* Profile Name with Dropdown Chevron */}
        <button
          type="button"
          onClick={() => setActiveModal("profile")}
          className="mt-3 flex items-center gap-1.5 cursor-pointer group"
        >
          <span className="text-xl font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight group-hover:text-[#F5B838] transition-colors">
            {userName}
          </span>
          <ChevronDown
            size={18}
            className="text-neutral-500 dark:text-[#8A8A93] group-hover:text-[#F5B838] transition-colors"
          />
        </button>

        {/* Username Handle */}
        <span className="text-sm text-neutral-500 dark:text-[#8A8A93] mt-0.5 font-medium">
          @{userName.toLowerCase().replace(/\s+/g, "") || "user"}
        </span>
      </section>

      {/* Divider Separator */}
      <div className="h-[1px] w-full bg-black/5 dark:bg-white/5 mb-1" />

      {/* 3. FLAT LIST MENU ITEMS (Clean WhatsApp-style flat list) */}
      <div className="flex-1 flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="py-3.5 px-4 flex items-center gap-4 text-left cursor-pointer active:bg-neutral-200/50 dark:active:bg-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
            >
              {/* Ikon Kiri Netral */}
              <div className="w-6 h-6 flex items-center justify-center text-neutral-500 dark:text-[#8A8A93] shrink-0">
                <Icon size={22} strokeWidth={1.8} />
              </div>

              {/* Teks Judul & Subtitle */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="font-medium text-base text-neutral-900 dark:text-[#F2F3F7] leading-tight">
                  {item.title}
                </span>
                <span className="text-xs text-neutral-500 dark:text-[#8A8A93] truncate">
                  {item.subtitle}
                </span>
              </div>

              <ChevronRight size={18} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
            </button>
          );
        })}

        {/* Haptic Toggle as Flat List Item */}
        <div className="py-3.5 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-6 h-6 flex items-center justify-center text-neutral-500 dark:text-[#8A8A93] shrink-0">
              <Vibrate size={22} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-base text-neutral-900 dark:text-[#F2F3F7] leading-tight">
                {dict.hapticsTitle}
              </span>
              <span className="text-xs text-neutral-500 dark:text-[#8A8A93]">
                {dict.hapticsDesc}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHaptics}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              hapticFeedback ? "bg-[#F5B838]" : "bg-neutral-200 dark:bg-white/[0.15]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                hapticFeedback ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Developer / Advanced AI Engine Section */}
        <button
          type="button"
          onClick={() => setActiveModal("advanced")}
          className="py-3.5 px-4 flex items-center gap-4 text-left cursor-pointer active:bg-neutral-200/50 dark:active:bg-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-6 h-6 flex items-center justify-center text-neutral-500 dark:text-[#8A8A93] shrink-0">
            <Sliders size={22} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base text-neutral-900 dark:text-[#F2F3F7] leading-tight">
                {dict.advancedTitle}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-white/[0.08] text-neutral-600 dark:text-[#9B9BA3]">
                {language === "en" ? "Developer" : "Lanjutan"}
              </span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-[#8A8A93] truncate">
              {language === "en" ? "API keys, fine-tuning temperature, and endpoints" : "API keys, temperature fine-tuning, dan custom URL"}
            </span>
          </div>
          <ChevronRight size={18} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
        </button>

        {/* Danger Zone: Reset Data */}
        <button
          type="button"
          onClick={() => setShowResetConfirmModal(true)}
          className="py-3.5 px-4 flex items-center gap-4 text-left cursor-pointer active:bg-red-50 dark:active:bg-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors"
        >
          <div className="w-6 h-6 flex items-center justify-center text-red-500 shrink-0">
            <Trash2 size={22} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="font-medium text-base text-red-600 dark:text-red-400 leading-tight">
              {dict.resetBtn}
            </span>
            <span className="text-xs text-red-500/80 dark:text-red-400/80">
              {dict.resetAppDesc}
            </span>
          </div>
        </button>
      </div>

      {/* Spacer bawah untuk floating tab bar */}
      <div className="h-12" />

      {/* ========================================================
          MODAL & BOTTOM SHEET DIALOGS (Clean WhatsApp / Project Style)
          ======================================================== */}

      {/* 1. Modal Edit Profil */}
      <AnimatePresence>
        {activeModal === "profile" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <h3 className="text-base font-bold">
                  {language === "en" ? "Edit Profile" : "Edit Profil"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#F5B838]">
                    <img src="/rintaro-pfp.jpg" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-[#8A8A93]">
                    {dict.nicknameLabel}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F5B838]"
                    placeholder={dict.nicknamePlaceholder}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-[#8A8A93]">
                    {language === "en" ? "Today's Emoji Mood" : "Mood Emoji Hari Ini"}
                  </label>
                  <div className="flex gap-2">
                    {["✨", "😊", "🍰", "☕", "🌸", "🔥"].map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setEmojiStatus(emo)}
                        className={`text-lg p-2 rounded-xl transition-all cursor-pointer ${
                          emojiStatus === emo
                            ? "bg-[#F5B838] scale-110 shadow-xs"
                            : "bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSettings({
                      ...settings,
                      userName,
                      theme,
                      language,
                      temperature,
                      replyLength,
                      hapticFeedback,
                    });
                    showToast(dict.nicknameSavedToast);
                    setActiveModal("none");
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#F5B838] text-neutral-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {language === "en" ? "Save Changes" : "Simpan Perubahan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal QR Code Profil */}
      <AnimatePresence>
        {activeModal === "qr" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col items-center gap-4 text-center text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F5B838]">
                <img src="/rintaro-pfp.jpg" alt={userName} className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-bold">{userName}</span>
                <span className="text-xs text-neutral-500 dark:text-[#8A8A93]">@{userName.toLowerCase().replace(/\s+/g, "")}</span>
              </div>

              {/* QR Dummy visual */}
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-neutral-200">
                <QrCode size={160} className="text-neutral-950" />
              </div>

              <p className="text-xs text-neutral-500 dark:text-[#8A8A93]">
                {language === "en"
                  ? "Scan to connect or import settings."
                  : "Pindai kode QR untuk terhubung atau bagikan profil."}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal Model & Provider AI */}
      <AnimatePresence>
        {activeModal === "model" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {language === "en" ? "AI Model & Provider" : "Model & Provider AI"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <ProviderManager
                settings={settings}
                hapticFeedback={hapticFeedback}
                onSaveSettings={onSaveSettings}
                showToast={showToast}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal Chat & Gaya Respons */}
      <AnimatePresence>
        {activeModal === "chatStyle" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                    <MessageSquareText size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {dict.chatStyleTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Panjang Balasan */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium">
                  {dict.replyLengthLabel}
                </span>
                <div className="grid grid-cols-3 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
                  {(["Pendek", "Sedang", "Panjang"] as const).map((len) => {
                    const isSelected = replyLength === len;
                    const label =
                      len === "Pendek"
                        ? dict.replyLengthShort
                        : len === "Sedang"
                        ? dict.replyLengthMedium
                        : dict.replyLengthLong;
                    return (
                      <button
                        key={len}
                        type="button"
                        onClick={() => handleSelectLength(len)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#F5B838] text-neutral-950 shadow-xs font-bold"
                            : "text-neutral-600 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-[#71717A]">
                  {dict.replyLengthDesc}
                </p>
              </div>

              {/* Preset Ekspresi */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium">
                  {language === "en" ? "Character Expression Mood" : "Sifat & Nada Respons Karakter"}
                </span>

                <div className="flex flex-col gap-2">
                  {conversationPresets.map((preset) => {
                    const isSelected = Math.abs(temperature - preset.temp) < 0.12;
                    return (
                      <button
                        key={preset.temp}
                        type="button"
                        onClick={() => {
                          handleTempChange(preset.temp);
                          haptics.light(hapticFeedback);
                          showToast(
                            language === "en"
                              ? `Response style: ${preset.label}`
                              : `Gaya respon: ${preset.label}`
                          );
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-500/[0.08] dark:bg-[#F5B838]/15 border-[#F5B838] shadow-2xs"
                            : "bg-[#F0F1F5]/60 dark:bg-white/[0.04] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isSelected
                                  ? "text-neutral-900 dark:text-white"
                                  : "text-neutral-700 dark:text-[#D1D2D9]"
                              }`}
                            >
                              {preset.label}
                            </span>
                            {preset.recommended && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5B838] text-neutral-950">
                                {language === "en" ? "Recommended" : "Rekomendasi"}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                            {preset.desc}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#F5B838] text-neutral-950 flex items-center justify-center shrink-0 ml-2">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Modal Tampilan & Tema */}
      <AnimatePresence>
        {activeModal === "theme" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                    <Palette size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {dict.appearanceTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 bg-[#F0F1F5] dark:bg-white/[0.06] p-1.5 rounded-2xl gap-1">
                {themeOptions.map((opt) => {
                  const isActive = theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTheme(opt.id)}
                      className="relative py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="themePillModal"
                          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                          className="absolute inset-0 rounded-xl bg-[#F5B838] shadow-xs"
                        />
                      )}
                      <span
                        className={`relative z-10 flex flex-col items-center justify-center gap-1.5 ${
                          isActive
                            ? "text-neutral-950 font-bold"
                            : "text-neutral-600 dark:text-[#8A8A93]"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{opt.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                {dict.themeDesc}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Modal Bahasa Aplikasi */}
      <AnimatePresence>
        {activeModal === "language" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {dict.languageTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {languageOptions.map((opt) => {
                  const isActive = language === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectLanguage(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-amber-500/[0.08] dark:bg-[#F5B838]/15 border-[#F5B838] shadow-2xs"
                          : "bg-[#F0F1F5]/60 dark:bg-white/[0.04] border-black/5 dark:border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.flag}</span>
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </div>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-[#F5B838] text-neutral-950 flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                {dict.langDesc}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Modal Notifikasi Balasan */}
      <AnimatePresence>
        {activeModal === "notifications" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {dict.notificationsTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                {dict.notificationsDesc}
              </p>

              <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-semibold">
                  {language === "en" ? "Permission Status" : "Status Izin"}
                </span>
                {notifPermission === "granted" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Check size={12} />
                    <span>{dict.notifActive}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await requestNotificationPermission();
                      setNotifPermission(granted ? "granted" : "denied");
                      if (granted) {
                        showToast(
                          language === "en"
                            ? "Notifications enabled!"
                            : "Notifikasi aktif!"
                        );
                      }
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5B838] text-neutral-950 cursor-pointer active:scale-95 transition-all"
                  >
                    {dict.notifRequest}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await sendPushLikeNotification("Waguri Kaoruko", {
                    body:
                      language === "en"
                        ? "Test notification successful! Replies will arrive even when your screen is locked."
                        : "Tes notifikasi berhasil! Balasan akan tetap masuk saat layar ditutup.",
                    characterId: "waguri-kaoruko",
                  });
                  showToast(
                    language === "en"
                      ? "Test notification sent!"
                      : "Notifikasi uji coba terkirim!"
                  );
                }}
                className="w-full py-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[#E5A929] cursor-pointer"
              >
                {language === "en" ? "Send Test Notification" : "Kirim Notifikasi Uji Coba"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Modal Opsi Lanjutan & Developer */}
      <AnimatePresence>
        {activeModal === "advanced" && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center">
                    <Sliders size={16} />
                  </div>
                  <h3 className="text-base font-bold">
                    {dict.advancedTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14]"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                {dict.advancedDesc}
              </p>

              {/* Slider Temperature Fine-Tuning */}
              <div className="bg-[#F0F1F5]/60 dark:bg-white/[0.04] p-3.5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-neutral-500 dark:text-[#8A8A93]" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-[#E4E5EA]">
                      {language === "en" ? "Temperature Fine-Tuning" : "Fine-Tuning Kreativitas (Temperature)"}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E5A929]">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => handleTempChange(parseFloat(e.target.value))}
                  className="w-full accent-[#F5B838] cursor-pointer"
                />
                <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                  {language === "en"
                    ? "0.0 is deterministic and strict, 0.8 is balanced for roleplay, 1.5+ is very creative and random."
                    : "Nilai 0.0 deterministik & kaku, 0.8 seimbang untuk roleplay, 1.5+ sangat acak."}
                </span>
              </div>

              {/* Provider Manager */}
              <ProviderManager
                settings={settings}
                hapticFeedback={hapticFeedback}
                onSaveSettings={onSaveSettings}
                showToast={showToast}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Reset Data */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 text-neutral-900 dark:text-[#F2F3F7]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle size={18} />
                  <h3 className="text-base font-bold">
                    {dict.resetConfirmTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-600 dark:text-[#9B9BA3] flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-[#A1A1AA] leading-relaxed">
                {dict.resetConfirmDesc}
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-white/[0.14] transition-all cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirmModal(false);
                    onClearAllData();
                  }}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {dict.resetConfirmBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
