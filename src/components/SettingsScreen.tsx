import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  Vibrate,
  Check,
  Bell,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sliders,
  AlertTriangle,
  MessageSquare,
  Globe,
  X,
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
  onSaveSettings: (settings: Settings) => void;
  onClearAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSaveSettings,
  onClearAllData,
}) => {
  const [userName, setUserName] = useState(settings.userName || "Rizky");
  const [model] = useState(settings.model || "gemini-3.1-flash-lite");
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.8);
  const [replyLength, setReplyLength] = useState(settings.replyLength || "Sedang");
  const [hapticFeedback, setHapticFeedback] = useState(settings.hapticFeedback !== false);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || "dark");
  const [language, setLanguage] = useState<AppLanguage>(settings.language || "id");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

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

  /** Provider yang sedang dipakai */
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
    // LANGSUNG sinkronkan ke DOM seketika
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

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Toast Notifikasi Ringan Floating */}
      {toastMsg && (
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-down">
          <div className="liquid-glass-strong px-4 py-2 rounded-full shadow-lg border border-black/5 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-[#F2F3F7] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5B838]" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header — Konsisten dengan tab 'Akun' */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[20px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
          {dict.settingsHeading}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-0.5">
          {dict.settingsSubheading}
        </p>
      </div>

      <div className="px-5 space-y-4">
        {/* Section: Profil Pengguna */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-white/[0.1] border border-black/10 dark:border-white/10 shrink-0">
            <img
              src="/rintaro-pfp.jpg"
              alt="Profil Kamu"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-neutral-400 dark:text-[#71717A] font-medium">
              {dict.nicknameLabel}
            </span>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={() => {
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
              }}
              className="w-full text-base font-bold text-neutral-900 dark:text-[#F2F3F7] bg-transparent focus:outline-none"
              placeholder={dict.nicknamePlaceholder}
            />
          </div>
        </div>

        {/* Section: Tampilan / Tema */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <Sun size={16} />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
              {dict.appearanceTitle}
            </span>
          </div>

          <div className="grid grid-cols-3 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
            {themeOptions.map((opt) => {
              const isActive = theme === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTheme(opt.id)}
                  className="relative py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="themePill"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      className="absolute inset-0 rounded-xl bg-[#F5B838] shadow-xs"
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "text-neutral-950 font-bold"
                        : "text-neutral-600 dark:text-[#8A8A93]"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
            {dict.themeDesc}
          </p>
        </div>

        {/* Section: Bahasa / Language */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <Globe size={16} />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
              {dict.languageTitle}
            </span>
          </div>

          <div className="grid grid-cols-2 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
            {languageOptions.map((opt) => {
              const isActive = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectLanguage(opt.id)}
                  className="relative py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="languagePill"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      className="absolute inset-0 rounded-xl bg-[#F5B838] shadow-xs"
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center gap-2 ${
                      isActive
                        ? "text-neutral-950 font-bold"
                        : "text-neutral-600 dark:text-[#8A8A93]"
                    }`}
                  >
                    <span className="text-sm">{opt.flag}</span>
                    <span>{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
            {dict.langDesc}
          </p>
        </div>

        {/* Section: Preferensi Obrolan (User-Centric & Imersif) */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-white/10">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
              {dict.chatStyleTitle}
            </span>
          </div>

          {/* Panjang Balasan */}
          <div className="flex flex-col gap-1.5">
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
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Preset Gaya Percakapan (Pengganti Slider Teknis) */}
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
        </div>

        {/* Section: Notifikasi Balasan (User-Centric, bebas jargon backend) */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                <Bell size={16} />
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                {dict.notificationsTitle}
              </span>
            </div>
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
          <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
            {dict.notificationsDesc}
          </p>
          <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex justify-end">
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
              className="text-xs font-semibold text-[#E5A929] hover:underline cursor-pointer"
            >
              {language === "en"
                ? "Send Test Notification"
                : "Kirim Notifikasi Uji Coba"}
            </button>
          </div>
        </div>

        {/* Section: Haptik Feedback */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center">
              <Vibrate size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
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
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
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

        {/* Section: Opsi Pengembang & Mesin AI (Accordion Terisolasi) */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl border border-black/5 dark:border-white/10 shadow-xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center">
                <Sliders size={16} />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                    {dict.advancedTitle}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-[#9B9BA3]">
                    {language === "en" ? "Advanced" : "Lanjutan"}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-[#8A8A93]">
                  Provider: {activeProvider.name} ({activeProvider.model || model})
                </span>
              </div>
            </div>
            {showAdvanced ? (
              <ChevronUp size={18} className="text-neutral-400" />
            ) : (
              <ChevronDown size={18} className="text-neutral-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 pt-1 border-t border-neutral-100 dark:border-white/10 flex flex-col gap-4 animate-fade-in">
              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                {dict.advancedDesc}
              </p>

              {/* Provider Manager */}
              <ProviderManager
                settings={settings}
                hapticFeedback={hapticFeedback}
                onSaveSettings={onSaveSettings}
                showToast={showToast}
              />

              {/* Slider Temperature Detail untuk Developer */}
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
            </div>
          )}
        </div>

        {/* Section: Zona Bahaya (Isolasi visual tegas) */}
        <div className="bg-red-500/[0.04] dark:bg-red-500/[0.06] rounded-3xl p-4.5 border border-red-200/80 dark:border-red-500/25 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700 dark:text-red-300">
                {dict.dangerZoneTitle}
              </span>
              <span className="text-[11px] text-red-600/80 dark:text-red-400/80">
                {language === "en"
                  ? "Irreversible action on local data"
                  : "Tindakan berisiko tinggi terhadap data lokal"}
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-600 dark:text-[#A1A1AA] leading-relaxed">
            {dict.resetAppDesc}
          </p>
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="w-full py-3 rounded-2xl bg-white dark:bg-[#1A181D] hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Trash2 size={14} />
            <span>{dict.resetBtn}</span>
          </button>
        </div>

        {/* Bottom spacer to guarantee clear separation above floating navigation bar */}
        <div className="h-8" />
      </div>

      {/* Modal Konfirmasi 2-Tahap Reset Data (Bukan browser confirm biasa) */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16171B] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle size={18} />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-[#F2F3F7]">
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
