import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Trash2,
  CheckCircle,
  Vibrate,
  BarChart2,
  Check,
  Bell,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Character, Chat, Settings, ThemeMode } from "../types";
import { haptics } from "../lib/haptics";
import { MoodTrendsChart } from "./MoodTrendsChart";
import { ProviderManager } from "./ProviderManager";
import { getActiveProvider } from "../lib/providers";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPushLikeNotification,
} from "../lib/pushNotification";

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Terang", icon: Sun },
  { id: "dark", label: "Gelap", icon: Moon },
  { id: "auto", label: "Otomatis", icon: Monitor },
];

interface SettingsScreenProps {
  settings: Settings;
  characters?: Character[];
  chats?: Record<string, Chat>;
  onSaveSettings: (settings: Settings) => void;
  onClearAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  characters = [],
  chats = {},
  onSaveSettings,
  onClearAllData,
}) => {
  const [userName, setUserName] = useState(settings.userName || "Rizky");
  const [model] = useState(settings.model || "gemini-3.1-flash-lite");
  const [temperature, setTemperature] = useState(settings.temperature ?? 1.0);
  const [replyLength, setReplyLength] = useState(settings.replyLength || "Sedang");
  const [hapticFeedback, setHapticFeedback] = useState(settings.hapticFeedback !== false);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || "dark");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());

  const defaultCharId =
    characters.find((c) => c.id === "waguri-kaoruko")?.id ||
    characters[0]?.id ||
    "waguri-kaoruko";
  const [trackedCharId, setTrackedCharId] = useState<string>(defaultCharId);

  const activeTrackedChar =
    characters.find((c) => c.id === trackedCharId) ||
    characters[0] || {
      id: "waguri-kaoruko",
      name: "Waguri Kaoruko",
    };
  const activeTrackedChat = chats[activeTrackedChar.id];

  /** Provider yang sedang dipakai — model aktif dibaca dari sini. */
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
    });
    showToast(`Panjang balasan: ${len}`);
  };

  const handleSelectTheme = (next: ThemeMode) => {
    setTheme(next);
    haptics.light(hapticFeedback);
    onSaveSettings({
      ...settings,
      userName,
      model,
      temperature,
      replyLength,
      hapticFeedback,
      theme: next,
    });
    showToast(
      next === "light"
        ? "Tema: Terang"
        : next === "dark"
        ? "Tema: Gelap"
        : "Tema: Ikut Sistem"
    );
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
    });
    showToast(newVal ? "Getaran haptik aktif" : "Getaran haptik dinonaktifkan");
  };

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-slide-down">
          <div className="px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg pointer-events-auto flex items-center gap-2 bg-neutral-900 dark:bg-[#2A2B31] text-white">
            <CheckCircle size={15} className="text-[#F5B838]" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[20px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
          Pengaturan
        </h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Section: Tampilan / Tema */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <Sun size={16} />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
              Tampilan
            </span>
          </div>

          <div className="grid grid-cols-3 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
            {THEME_OPTIONS.map((opt) => {
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
                        ? "text-neutral-950"
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
            "Otomatis" mengikuti pengaturan terang/gelap dari sistem kamu.
          </p>
        </div>

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
            <span className="text-xs text-neutral-400 dark:text-[#71717A] font-medium">Panggilan Kamu</span>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={() => {
                onSaveSettings({ ...settings, userName });
                showToast("Nama panggilan disimpan!");
              }}
              className="w-full text-base font-bold text-neutral-900 dark:text-[#F2F3F7] bg-transparent focus:outline-none"
              placeholder="Namamu..."
            />
          </div>
        </div>

        {/* Section: Provider AI */}
        <ProviderManager
          settings={settings}
          hapticFeedback={hapticFeedback}
          onSaveSettings={onSaveSettings}
          showToast={showToast}
        />

        {/* Section: Parameter Model */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">Parameter Model</span>
            <span className="px-3 py-1.5 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA]">
              {activeProvider.model || model}
            </span>
          </div>

          {/* Temperature Slider */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium">Kreativitas (Temperature)</span>
              <span className="text-xs font-bold text-[#E5A929]">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => handleTempChange(parseFloat(e.target.value))}
              className="w-full accent-[#F5B838]"
            />
          </div>

          {/* Panjang Balasan */}
          <div className="flex flex-col gap-1.5 pt-2">
            <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium">Panjang Balasan</span>
            <div className="grid grid-cols-3 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
              {(["Pendek", "Sedang", "Panjang"] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => handleSelectLength(len)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    replyLength === len
                      ? "bg-[#F5B838] text-neutral-950 shadow-xs"
                      : "text-neutral-600 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Notifikasi Push Latar Belakang */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                <Bell size={16} />
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">Notifikasi Balasan</span>
            </div>
            {notifPermission === "granted" ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Check size={12} />
                <span>Aktif</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  setNotifPermission(granted ? "granted" : "denied");
                  if (granted) showToast("Notifikasi aktif!");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5B838] text-neutral-950"
              >
                Izinkan
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
            Pesan AI tetap diproses di latar belakang via Service Worker & antrean IndexedDB saat layar ditutup.
          </p>
          <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await sendPushLikeNotification("Waguri Kaoruko", {
                  body: "Tes notifikasi berhasil! Balasan akan tetap masuk saat layar ditutup.",
                  characterId: "waguri-kaoruko",
                });
                showToast("Notifikasi tes terkirim!");
              }}
              className="text-xs font-semibold text-[#E5A929] hover:underline cursor-pointer"
            >
              Uji Notifikasi Tes
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
              <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">Umpan Balik Getar</span>
              <span className="text-xs text-neutral-500 dark:text-[#8A8A93]">Sensasi ketikan & respons chat</span>
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

        {/* Section: Analisis Mood Karakter */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
                <BarChart2 size={16} />
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">Statistik Mood</span>
            </div>
          </div>
          {activeTrackedChat && <MoodTrendsChart chat={activeTrackedChat} />}
        </div>

        {/* Section: Reset Data */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset semua data dan riwayat obrolan ke awal?")) {
                onClearAllData();
              }
            }}
            className="w-full py-3.5 rounded-full bg-white dark:bg-[#16171B] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 size={15} />
            <span>Reset Semua Data</span>
          </button>
        </div>
      </div>
    </main>
  );
};
