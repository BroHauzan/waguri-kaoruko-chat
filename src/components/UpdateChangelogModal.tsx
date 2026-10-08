import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Check, ArrowRight } from "lucide-react";
import { LATEST_APP_UPDATE, markLatestUpdateAsSeen } from "../lib/appUpdates";
import { AppLanguage } from "../types";
import { haptics } from "../lib/haptics";

interface UpdateChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

export const UpdateChangelogModal: React.FC<UpdateChangelogModalProps> = ({
  isOpen,
  onClose,
  language = "id",
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    haptics.light();
    markLatestUpdateAsSeen();
    onClose();
  };

  const title =
    language === "en"
      ? LATEST_APP_UPDATE.title.en
      : LATEST_APP_UPDATE.title.id;
  const subtitle =
    language === "en"
      ? LATEST_APP_UPDATE.subtitle.en
      : LATEST_APP_UPDATE.subtitle.id;
  const highlights =
    language === "en"
      ? LATEST_APP_UPDATE.highlights.en
      : LATEST_APP_UPDATE.highlights.id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white dark:bg-[#16171B] rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-[#F2F3F7] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-neutral-100 dark:border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5B838] text-neutral-950">
                  {LATEST_APP_UPDATE.version}
                </span>
                <span className="text-xs text-neutral-400 dark:text-[#8A8A93]">
                  {LATEST_APP_UPDATE.date}
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-0.5">
                {subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-500 dark:text-[#8A8A93] shrink-0 cursor-pointer transition-colors"
              aria-label="Tutup pembaruan"
            >
              <X size={16} />
            </button>
          </div>

          {/* List Fitur / Highlight */}
          <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-neutral-100 dark:divide-white/[0.06]">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className={idx === 0 ? "space-y-1" : "pt-3 space-y-1"}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#F2F3F7]">
                    {item.title}
                  </h3>
                  {item.tag && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-[#A1A1AA]">
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer Action Button */}
          <div className="p-4 border-t border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-[#F5B838] hover:bg-[#E5AA30] active:scale-[0.99] text-neutral-950 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{language === "en" ? "Got It & Continue" : "Mengerti & Lanjutkan"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

