import React from "react";
import { MessageCircle, Plus } from "lucide-react";
import { AppLanguage } from "../types";
import { getDictionary } from "../lib/i18n";

interface DesktopEmptyStateProps {
  onCreateCharacter: () => void;
  language?: AppLanguage;
}

/** Panel kanan versi desktop saat belum ada obrolan yang dipilih. */
export const DesktopEmptyState: React.FC<DesktopEmptyStateProps> = ({
  onCreateCharacter,
  language = "id",
}) => {
  const dict = getDictionary(language);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      <div className="w-16 h-16 rounded-full bg-white dark:bg-[#16171B] border border-black/5 dark:border-white/10 text-[#F5B838] flex items-center justify-center shadow-xs">
        <MessageCircle size={28} />
      </div>
      <h2 className="mt-5 text-lg font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
        {dict.desktopEmptyTitle}
      </h2>
      <p className="mt-1.5 text-sm text-neutral-500 dark:text-[#8A8A93] max-w-xs">
        {dict.desktopEmptyDesc}
      </p>
      <button
        type="button"
        onClick={onCreateCharacter}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 shadow-xs active:scale-95 transition-all cursor-pointer"
      >
        <Plus size={16} />
        <span>{dict.desktopEmptyBtn}</span>
      </button>
    </div>
  );
};
