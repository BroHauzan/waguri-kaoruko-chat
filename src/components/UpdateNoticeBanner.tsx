import React, { useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { LATEST_APP_UPDATE, markLatestUpdateAsSeen } from "../lib/appUpdates";
import { AppLanguage } from "../types";
import { haptics } from "../lib/haptics";

interface UpdateNoticeBannerProps {
  language?: AppLanguage;
  onOpenChangelog?: () => void;
}

export const UpdateNoticeBanner: React.FC<UpdateNoticeBannerProps> = ({
  language = "id",
  onOpenChangelog,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("waguri_update_banner_dismissed_v191");
      return stored === "true";
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      haptics.light();
      localStorage.setItem("waguri_update_banner_dismissed_v191", "true");
    } catch {}
    setIsDismissed(true);
  };

  const handleOpen = () => {
    try {
      haptics.light();
    } catch {}
    if (onOpenChangelog) {
      onOpenChangelog();
    } else {
      window.dispatchEvent(new CustomEvent("waguri_open_update_changelog"));
    }
  };

  const isEn = language === "en";

  return (
    <div className="px-5 pt-1 pb-2 animate-fade-in">
      <div
        onClick={handleOpen}
        className="w-full relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-amber-500/15 via-[#F5B838]/10 to-amber-500/5 dark:from-[#F5B838]/20 dark:via-amber-500/10 dark:to-transparent border border-amber-500/30 dark:border-[#F5B838]/25 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all group"
      >
        {/* Glow ambient background */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#F5B838]/20 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F5B838] text-neutral-950 flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
              <Sparkles size={18} />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-[#F5B838] text-neutral-950">
                  {LATEST_APP_UPDATE.version}
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-[#F2F3F7] truncate">
                  {isEn ? "New Stitch Redesign & Share Card" : "Redesign Baru & Kartu Bagikan"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-[#A1A2AA] truncate mt-0.5">
                {isEn
                  ? "Explore full glassmorphism, Spotify-style share card & dynamic themes!"
                  : "Cek tampilan Stitch glassmorphism, kartu share ala Spotify, dan tema dinamis!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-white dark:bg-white/10 text-neutral-700 dark:text-neutral-200 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={14} />
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              title={isEn ? "Dismiss" : "Tutup"}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
