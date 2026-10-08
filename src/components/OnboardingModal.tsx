import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, ArrowRight } from "lucide-react";
import { AppLanguage } from "../types";
import { haptics } from "../lib/haptics";

interface OnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  initialPersona?: string;
  onComplete: (name: string, persona: string) => void;
  language?: AppLanguage;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialName = "",
  initialPersona = "",
  onComplete,
  language = "id",
}) => {
  const [name, setName] = useState(initialName === "Rizky" ? "" : initialName);
  const [persona, setPersona] = useState(initialPersona);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      haptics.impact();
    } catch {
      // safe fallback
    }
    onComplete(cleanName, persona.trim());
  };

  const isEn = language === "en";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] bg-black/70 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white dark:bg-[#16171B] rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-[#F2F3F7] overflow-hidden"
          >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-neutral-100 dark:border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center mb-3">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {isEn ? "Welcome to Waguri App" : "Selamat Datang di Waguri App"}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-1 leading-relaxed">
              {isEn
                ? "Tell us how you would like to be called so the characters can address you naturally."
                : "Sebelum mulai mengobrol, beri tahu nama panggilanmu agar karakter dapat menyapamu secara langsung."}
            </p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Field Nama Panggilan (Wajib) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#D1D2D9] flex items-center justify-between">
                <span>{isEn ? "Your Name" : "Nama Panggilan"}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {isEn ? "Required" : "Wajib"}
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEn ? "e.g., Hauzan / Alex / Rin" : "Misal: Hauzan / Rizky / Rin"}
                autoFocus
                maxLength={30}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-100 dark:bg-white/[0.06] rounded-xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 focus:border-[#F5B838] transition-all"
              />
            </div>

            {/* Field Persona / Tentang Dirimu (Opsional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-[#D1D2D9]">
                  {isEn ? "Persona / About You" : "Persona / Tentang Dirimu"}
                </label>
                <span className="text-[10px] text-neutral-400 dark:text-[#8A8A93]">
                  {isEn ? "Optional" : "Opsional"}
                </span>
              </div>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder={
                  isEn
                    ? "e.g., Architecture student who loves lo-fi music and black coffee. Easygoing classmate."
                    : "Misal: Mahasiswa arsitektur yang suka musik lo-fi dan kopi. Teman sekelas yang santai."
                }
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-100 dark:bg-white/[0.06] rounded-xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 focus:border-[#F5B838] transition-all resize-y min-h-[85px] leading-relaxed"
              />
              <p className="text-[11px] text-neutral-400 dark:text-[#8A8A93] leading-tight">
                {isEn
                  ? "The AI character will remember this background so the conversation feels more natural and personal."
                  : "Karakter AI akan mengingat latar belakang ini agar suasana obrolan terasa lebih akrab dan personal."}
              </p>
            </div>

            {/* Action Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-[#F5B838] hover:bg-[#E5AA30] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] text-neutral-950 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>{isEn ? "Start Chatting" : "Mulai Mengobrol"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

