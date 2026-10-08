import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Sparkles, X, CheckCircle2, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import {
  getDailyUsage,
  activatePaidMode,
  isPaidUser,
  DailyUsageInfo,
  FREE_DAILY_MESSAGE_LIMIT,
} from "../lib/quotaService";
import { AppLanguage } from "../types";
import { getDictionary } from "../lib/i18n";
import { haptics } from "../lib/haptics";

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
  reason?: "exceeded" | "manual";
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  language = "id",
  reason = "manual",
}) => {
  const [quotaInfo, setQuotaInfo] = useState<DailyUsageInfo>(getDailyUsage());
  const [activationCode, setActivationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dict = getDictionary(language);

  // Sync state dengan event waguri_quota_updated
  useEffect(() => {
    const handleUpdate = () => {
      setQuotaInfo(getDailyUsage());
    };
    handleUpdate();
    window.addEventListener("waguri_quota_updated", handleUpdate);
    return () => {
      window.removeEventListener("waguri_quota_updated", handleUpdate);
    };
  }, []);

  // Reset pesan & input saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setQuotaInfo(getDailyUsage());
      setActivationCode("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = activationCode.trim();
    if (!trimmed) {
      setErrorMessage(
        language === "en"
          ? "Please enter an activation code."
          : "Masukkan kode aktivasi terlebih dahulu."
      );
      haptics.error(true);
      return;
    }

    setIsSubmitting(true);
    const result = activatePaidMode(trimmed);
    setIsSubmitting(false);

    if (result.success) {
      haptics.success(true);
      setSuccessMessage(
        dict.activateSuccess ||
          (language === "en"
            ? "Congratulations! Paid Mode (Unlimited) has been activated forever!"
            : "Selamat! Mode Paid (Unlimited) berhasil diaktifkan selamanya!")
      );
      setQuotaInfo(getDailyUsage());
    } else {
      haptics.error(true);
      setErrorMessage(
        result.message ||
          dict.activateFailed ||
          (language === "en"
            ? "Invalid activation code. Please try again."
            : "Kode aktivasi salah. Silakan periksa kembali kodenya.")
      );
    }
  };

  const usedPercentage = Math.min(
    100,
    Math.round((quotaInfo.used / FREE_DAILY_MESSAGE_LIMIT) * 100)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white dark:bg-[#18191E] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 z-10 overflow-hidden"
        >
          {/* Decorative glow top background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/15 dark:bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] flex items-center justify-center text-neutral-600 dark:text-[#C9CAD1] transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center mt-1">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
                quotaInfo.isPaid
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-300 text-neutral-900 shadow-amber-500/25"
                  : "bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              <Crown size={28} className={quotaInfo.isPaid ? "fill-neutral-900" : ""} />
            </div>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {quotaInfo.isPaid
                ? (language === "en" ? "VIP Unlimited Active" : "Status Akun: VIP Paid")
                : (language === "en" ? "Daily Message Quota" : "Status Kuota & Akun")}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-1 max-w-xs">
              {quotaInfo.isPaid
                ? (language === "en"
                    ? "You have permanent unlimited access to chat with all characters."
                    : "Kamu memiliki akses chat tanpa batas (Unlimited) selamanya.")
                : (language === "en"
                    ? "Free account limit: 50 messages/day. Quota resets daily."
                    : "Akun Free dibatasi 50 pesan/hari (reset otomatis setiap hari).")}
            </p>
          </div>

          {/* Status Section */}
          <div className="mt-5">
            {quotaInfo.isPaid ? (
              /* Kartu VIP Paid */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      {language === "en" ? "Paid Mode (VIP)" : "Mode Paid (VIP)"}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Unlimited
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-[#9B9BA3] mt-0.5">
                    {language === "en"
                      ? "Chat as much as you want without any daily limit."
                      : "Bebas mengobrol sepuasnya tanpa batas pesan harian."}
                  </p>
                </div>
              </div>
            ) : (
              /* Kartu Kuota Free */
              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-neutral-700 dark:text-[#D1D2D9]">
                    {language === "en" ? "Today's Usage" : "Penggunaan Hari Ini"}
                  </span>
                  <span
                    className={`tabular-nums font-bold ${
                      quotaInfo.remaining <= 0
                        ? "text-red-500 dark:text-red-400"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {quotaInfo.used} / {FREE_DAILY_MESSAGE_LIMIT}{" "}
                    <span className="text-neutral-400 font-normal">
                      ({language === "en" ? `${quotaInfo.remaining} left` : `sisa ${quotaInfo.remaining}`})
                    </span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      quotaInfo.remaining <= 0
                        ? "bg-red-500"
                        : quotaInfo.remaining <= 10
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>

                {/* Warning if Exceeded */}
                {quotaInfo.remaining <= 0 && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      {language === "en"
                        ? "You have reached the 50 message daily limit. Quota resets at 00:00 midnight or activate Paid Mode below."
                        : "Kuota 50 chat gratis hari ini telah habis. Kuota direset jam 00:00 tengah malam atau masukkan kode VIP di bawah."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Aktivasi Kode (Hanya jika belum Paid) */}
          {!quotaInfo.isPaid && (
            <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-[#E4E5EA]">
                  {language === "en" ? "Activate Paid Mode (VIP)" : "Aktivasi Paid Mode (VIP)"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mb-3 leading-relaxed">
                {language === "en"
                  ? "Enter the secret activation code to unlock permanent unlimited chat for your account."
                  : "Masukkan kode aktivasi untuk membuka akses chat tanpa batas (Unlimited) selamanya."}
              </p>

              <form onSubmit={handleActivate} className="flex flex-col gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => {
                      setActivationCode(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={language === "en" ? "Enter activation code..." : "Ketik kode aktivasi..."}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={isSubmitting}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/35 outline-none border border-transparent focus:border-amber-500/50 transition-all font-mono"
                  />
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-500 font-medium px-1"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-1"
                  >
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !activationCode.trim()}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap size={16} className="fill-neutral-950" />
                  <span>{language === "en" ? "Activate Paid Mode" : "Aktivasi Paid Mode"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Close/Dismiss Button at Bottom */}
          <div className="mt-5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-neutral-600 dark:text-[#A1A2AA] hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {quotaInfo.isPaid
                ? (language === "en" ? "Close" : "Tutup")
                : (language === "en" ? "Continue with Free Mode" : "Tetap di Akun Free")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

