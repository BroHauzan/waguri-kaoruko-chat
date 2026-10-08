import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, ArrowRight, History } from "lucide-react";
import { APP_UPDATES, markLatestUpdateAsSeen } from "../lib/appUpdates";
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
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      haptics.light();
    } catch {
      // safe fallback
    }
    markLatestUpdateAsSeen();
    onClose();
  };

  const isEn = language === "en";
  const currentUpdate = APP_UPDATES[selectedVersionIndex] || APP_UPDATES[0] || {
    id: "v1.5.1",
    version: "v1.5.1",
    date: "8 Oktober 2026",
    badge: "Terbaru",
    bannerGradient: "from-amber-500 via-orange-500 to-amber-700",
    bannerImage: "/waguri-pfp.jpg",
    title: { id: "Pembaruan Aplikasi", en: "App Update" },
    subtitle: { id: "Peningkatan performa dan fitur baru.", en: "Performance enhancements and new features." },
    highlights: { id: [], en: [] },
  };

  const title = (isEn ? currentUpdate.title?.en : currentUpdate.title?.id) || "Pembaruan Aplikasi";
  const subtitle = (isEn ? currentUpdate.subtitle?.en : currentUpdate.subtitle?.id) || "";
  const rawHighlights = isEn ? currentUpdate.highlights?.en : currentUpdate.highlights?.id;
  const highlights = Array.isArray(rawHighlights) ? rawHighlights : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/65 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white dark:bg-[#16171B] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-[#F2F3F7] overflow-hidden"
        >
          {/* Top Bar: Version Switcher Tabs (3 Update Terakhir) & Close Button */}
          <div className="p-3.5 pb-2.5 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between gap-2 bg-neutral-50/70 dark:bg-white/[0.02]">
            {/* Tab Pills for 3 Latest Updates */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {APP_UPDATES.map((item, idx) => {
                const isActive = idx === selectedVersionIndex;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => {
                      try {
                        haptics.light();
                      } catch {}
                      setSelectedVersionIndex(idx);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                        : "bg-neutral-200/60 dark:bg-white/[0.06] text-neutral-600 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{item.version}</span>
                    {idx === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-neutral-200/50 dark:bg-white/[0.08] flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-500 dark:text-[#8A8A93] shrink-0 cursor-pointer transition-colors"
              aria-label="Tutup pembaruan"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="overflow-y-auto flex-1 flex flex-col">
            {/* Visual Banner Header for Each Update */}
            <div
              className={`relative w-full p-6 overflow-hidden bg-gradient-to-br ${currentUpdate.bannerGradient || "from-amber-500 to-amber-700"} text-white shadow-inner flex flex-col justify-end min-h-[140px] transition-all duration-300`}
            >
              {/* Decorative Background Elements */}
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute top-2 right-4 opacity-15 pointer-events-none">
                <Sparkles size={84} />
              </div>

              {currentUpdate.bannerImage && (
                <div className="absolute right-4 bottom-3 w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 backdrop-blur-xs">
                  <img
                    src={currentUpdate.bannerImage}
                    alt="Banner icon"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Banner Content */}
              <div className="relative z-10 pr-20">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-xs text-white">
                    {currentUpdate.version}
                  </span>
                  <span className="text-[11px] text-white/80 font-medium">
                    {currentUpdate.date}
                  </span>
                  {currentUpdate.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-xs">
                      {currentUpdate.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold tracking-tight drop-shadow-xs leading-snug">
                  {title}
                </h2>
              </div>
            </div>

            {/* Subtitle Description */}
            {subtitle && (
              <div className="px-5 pt-3.5 pb-2 text-xs text-neutral-500 dark:text-[#8A8A93] leading-relaxed border-b border-neutral-100 dark:border-white/5">
                {subtitle}
              </div>
            )}

            {/* List Highlights */}
            <div className="p-5 space-y-3.5 flex-1 divide-y divide-neutral-100 dark:divide-white/[0.06]">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className={idx === 0 ? "space-y-1" : "pt-3.5 space-y-1"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-[#F2F3F7]">
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
          </div>

          {/* Footer Action Button */}
          <div className="p-4 border-t border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <span className="text-[11px] text-neutral-400 dark:text-[#8A8A93] flex items-center gap-1 font-medium">
              <History size={13} />
              <span>3 Update Terakhir</span>
            </span>

            <button
              type="button"
              onClick={handleDismiss}
              className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-[#F5B838] hover:bg-[#E5AA30] active:scale-[0.99] text-neutral-950 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{isEn ? "Got It & Continue" : "Mengerti & Lanjutkan"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
