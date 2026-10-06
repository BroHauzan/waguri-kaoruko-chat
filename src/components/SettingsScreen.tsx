import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  CheckCircle,
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
  Sparkles,
  MessageSquare,
  X,
} from "lucide-react";
import { Character, Chat, Settings, ThemeMode } from "../types";
import { haptics } from "../lib/haptics";
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

/** Preset gaya percakapan yang ramah pengguna, mengabstraksi nilai temperature LLM */
const CONVERSATION_STYLE_PRESETS = [
  {
    temp: 0.6,
    label: "Fokus & Konsisten",
    desc: "Jawaban teratur, tenang, dan runtut",
  },
  {
    temp: 0.8,
    label: "Natural & Mengalir",
    desc: "Hangat, luwes, dan seperti obrolan nyata (Disarankan)",
    recommended: true,
  },
  {
    temp: 1.1,
    label: "Spontan & Ekspresif",
    desc: "Variatif, kaya emosi, dan penuh kejutan",
  },
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
  onSaveSettings,
  onClearAllData,
}) => {
  const [userName, setUserName] = useState(settings.userName || "Rizky");
  const [model] = useState(settings.model || "gemini-3.1-flash-lite");
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.8);
  const [replyLength, setReplyLength] = useState(settings.replyLength || "Sedang");
  const [hapticFeedback, setHapticFeedback] = useState(settings.hapticFeedback !== false);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || "dark");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

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
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-36 sm:pb-40 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-slide-down">
          <div className="px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg pointer-events-auto flex items-center gap-2 bg-neutral-900 dark:bg-[#2A2B31] text-white">
            <CheckCircle size={15} className="text-[#F5B838]" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header — Konsisten dengan tab 'Akun' */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[20px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
          Akun & Pengaturan
        </h1>
        <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-0.5">
          Kelola profil, gaya percakapan, dan preferensi aplikasi
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
              Nama Panggilan Kamu
            </span>
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
            "Otomatis" mengikuti pengaturan mode gelap atau terang dari perangkatmu.
          </p>
        </div>

        {/* Section: Preferensi Obrolan (User-Centric & Imersif) */}
        <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-white/10">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
              Gaya Interaksi Obrolan
            </span>
          </div>

          {/* Panjang Balasan */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium">
              Panjang Balasan Karakter
            </span>
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

          {/* Gaya Interaksi (Abstraksi Temperature ramah pengguna) */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs text-neutral-500 dark:text-[#8A8A93] font-medium flex items-center gap-1.5">
              <span>Nuansa Respons Karakter</span>
              <Sparkles size={13} className="text-[#F5B838]" />
            </span>
            <div className="grid grid-cols-1 gap-2">
              {CONVERSATION_STYLE_PRESETS.map((preset) => {
                const isSelected = Math.abs(temperature - preset.temp) < 0.15;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      handleTempChange(preset.temp);
                      haptics.light(hapticFeedback);
                      showToast(`Gaya respon: ${preset.label}`);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-500/[0.08] dark:bg-[#F5B838]/15 border-[#F5B838] shadow-2xs"
                        : "bg-[#F0F1F5]/60 dark:bg-white/[0.04] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-[#D1D2D9]"
                        }`}>
                          {preset.label}
                        </span>
                        {preset.recommended && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5B838] text-neutral-950">
                            Rekomendasi
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
                Notifikasi Balasan
              </span>
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
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5B838] text-neutral-950 cursor-pointer active:scale-95 transition-all"
              >
                Izinkan
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
            Tetap terima balasan karakter meskipun layar ditutup atau aplikasi diminimalkan.
          </p>
          <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await sendPushLikeNotification("Waguri Kaoruko", {
                  body: "Tes notifikasi berhasil! Balasan akan tetap masuk saat layar ditutup.",
                  characterId: "waguri-kaoruko",
                });
                showToast("Notifikasi uji coba terkirim!");
              }}
              className="text-xs font-semibold text-[#E5A929] hover:underline cursor-pointer"
            >
              Kirim Notifikasi Uji Coba
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
                Umpan Balik Getar
              </span>
              <span className="text-xs text-neutral-500 dark:text-[#8A8A93]">
                Sensasi ketikan & respons pesan
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
                    Opsi Pengembang & Mesin AI
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-[#9B9BA3]">
                    Lanjutan
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
                Di sini kamu dapat mengatur provider AI eksternal (OpenRouter, Groq, DeepSeek) atau menyesuaikan parameter teknis model.
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
                      Fine-Tuning Kreativitas (Temperature)
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
                  Nilai 0.0 deterministik & kaku, 0.8 seimbang untuk roleplay, 1.5+ sangat acak.
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
                Zona Bahaya
              </span>
              <span className="text-[11px] text-red-600/80 dark:text-red-400/80">
                Tindakan berisiko tinggi terhadap data lokal
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-600 dark:text-[#A1A1AA] leading-relaxed">
            Menghapus seluruh riwayat percakapan, kustomisasi karakter, dan mengembalikan aplikasi ke kondisi awal.
          </p>
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="w-full py-3 rounded-2xl bg-white dark:bg-[#1A181D] hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Trash2 size={14} />
            <span>Reset Semua Data Aplikasi</span>
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
                    Reset Semua Data?
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
                Semua karakter yang telah kamu buat dan seluruh riwayat pesan akan dihapus permanen dari perangkat ini. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-white/[0.14] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirmModal(false);
                    onClearAllData();
                  }}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Ya, Hapus Semua
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
