import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface CustomInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  initialInstructions: string;
  onSave: (instructions: string) => void;
}

export const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = ({
  isOpen,
  onClose,
  initialInstructions,
  onSave,
}) => {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isGlobal, setIsGlobal] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setInstructions(initialInstructions || "");
  }, [initialInstructions, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(instructions.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-[3px] animate-fade-in">
      {/* Background Dimming / Tap to dismiss backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* iOS Liquid Glass Bottom Sheet */}
      <div className="relative w-full max-w-md mx-auto z-10 liquid-glass-sheet rounded-t-[28px] flex flex-col max-h-[90vh] h-[78vh] overflow-hidden animate-slide-up">
        {/* Sheet Drag Grabber */}
        <div className="w-full flex justify-center pt-3 pb-2 select-none touch-none">
          <div className="w-[36px] h-[5px] rounded-full bg-neutral-300 dark:bg-white/30" />
        </div>

        {/* Sheet Header */}
        <header className="px-5 py-2.5 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <button
              aria-label="Kembali"
              className="w-9 h-9 rounded-full liquid-glass-button flex items-center justify-center text-neutral-800 dark:text-white active:opacity-70 transition-opacity"
              onClick={onClose}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-[20px] font-bold text-neutral-900 dark:text-white tracking-tight">
              Instruksi Tambahan
            </h1>
          </div>
          <div />
        </header>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-5">
          <p className="text-[14px] leading-relaxed text-neutral-500 dark:text-[#8E8E93]">
            Beri tahu karakter cara merespons dan mengingat preferensi obrolan kamu.
          </p>

          {/* Inset Grouped Card */}
          <div className="bg-[#F0F1F5] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex flex-col gap-3">
            <textarea
              className="w-full bg-transparent resize-none border-0 outline-none text-[15px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-[#8E8E93] p-0 leading-relaxed focus:ring-0 focus:outline-none"
              id="instruction-input"
              maxLength={500}
              placeholder="Tulis instruksi tambahan di sini..."
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[12px] text-neutral-500 dark:text-[#8E8E93]">Instruksi persona personal</span>
              <span className="text-[12px] text-neutral-500 dark:text-[#8E8E93] tabular-nums font-medium">
                {instructions.length} / 500
              </span>
            </div>
          </div>

          {/* Inset Grouped Row: Apply to all chats */}
          <div className="bg-[#F0F1F5] dark:bg-[#1C1C1E] rounded-[16px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[15px] font-semibold text-neutral-900 dark:text-white leading-snug">
                Terapkan ke semua obrolan
              </span>
              <span className="text-[12px] text-neutral-500 dark:text-[#8E8E93] truncate leading-tight mt-0.5">
                Gunakan preferensi ini di setiap sesi obrolan
              </span>
            </div>
            {/* Native iOS Toggle Switch */}
            <button
              aria-checked={isGlobal}
              className={`relative shrink-0 w-[51px] h-[31px] rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                isGlobal ? "bg-[#F5B838]" : "bg-neutral-300 dark:bg-[#39393d]"
              }`}
              onClick={() => setIsGlobal(!isGlobal)}
              role="switch"
              type="button"
            >
              <span
                className={`pointer-events-none absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
                  isGlobal ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col gap-2 pt-2 pb-safe mt-auto">
            <button
              className="w-full h-[48px] rounded-[14px] bg-[#F5B838] hover:bg-[#E5A929] active:scale-[0.99] text-neutral-950 font-bold text-[15px] transition-all flex items-center justify-center text-center shadow-xs cursor-pointer"
              onClick={handleSave}
              type="button"
            >
              {isSaved ? "Tersimpan" : "Simpan Perubahan"}
            </button>
            <button
              className="w-full h-[44px] rounded-[14px] text-neutral-500 dark:text-[#8E8E93] hover:text-neutral-900 dark:hover:text-white font-medium text-[15px] transition-colors flex items-center justify-center text-center cursor-pointer"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
