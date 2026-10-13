import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  Star,
  Lock,
  MessageSquare,
  Trash2,
  ExternalLink,
  KeyRound,
  X,
} from "lucide-react";
import { Character, Chat, Message, AppLanguage } from "../types";
import { getDictionary } from "../lib/i18n";
import { haptics } from "../lib/haptics";
import { storage } from "../lib/storage";
import { verifyPin, hashPin } from "../lib/crypto";

interface StarredItem {
  message: Message;
  character: Character;
  isLocked: boolean;
}

interface StarredMessagesScreenProps {
  characters: Character[];
  chats: Record<string, Chat>;
  onSelectCharacterAndMessage: (char: Character, messageId: string) => void;
  onUnstarMessage: (characterId: string, messageId: string) => void;
  onBack: () => void;
  language?: AppLanguage;
  hapticFeedback?: boolean;
}

export const StarredMessagesScreen: React.FC<StarredMessagesScreenProps> = ({
  characters,
  chats,
  onSelectCharacterAndMessage,
  onUnstarMessage,
  onBack,
  language = "id",
  hapticFeedback = true,
}) => {
  const dict = getDictionary(language);
  const settings = useMemo(() => storage.getSettings(), []);
  const hasArchivePin = Boolean(settings.archivePin && settings.archivePin.trim().length > 0);

  // Set character ID yang sudah berhasil di-unlock PIN-nya selama sesi ini
  const [unlockedCharacterIds, setUnlockedCharacterIds] = useState<Set<string>>(new Set());

  // Modal PIN jika user ingin membuka pesan dari chat terkunci
  const [pinModalTargetChar, setPinModalTargetChar] = useState<Character | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Kumpulkan semua pesan dengan isStarred === true
  const starredItems: StarredItem[] = useMemo(() => {
    const list: StarredItem[] = [];

    characters.forEach((char) => {
      const chat = chats[char.id];
      if (!chat || !chat.messages) return;

      const isCharArchived = Boolean(char.isArchived);
      const isLocked = isCharArchived && hasArchivePin && !unlockedCharacterIds.has(char.id);

      chat.messages.forEach((msg) => {
        if (msg.isStarred) {
          list.push({
            message: msg,
            character: char,
            isLocked,
          });
        }
      });
    });

    // Urutkan dari pesan yang paling baru
    list.sort((a, b) => b.message.timestamp - a.message.timestamp);
    return list;
  }, [characters, chats, hasArchivePin, unlockedCharacterIds]);

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentSettings = storage.getSettings();
    const isMatch = await verifyPin(pinInput, currentSettings.archivePin);
    if (isMatch) {
      // Migrasi otomatis jika PIN lama masih berupa plaintext
      if (
        currentSettings.archivePin &&
        currentSettings.archivePin.length < 64 &&
        !currentSettings.archivePin.startsWith("hash_")
      ) {
        const hashed = await hashPin(currentSettings.archivePin);
        storage.saveSettings({ ...currentSettings, archivePin: hashed });
      }

      haptics.light(hapticFeedback);
      if (pinModalTargetChar) {
        setUnlockedCharacterIds((prev) => new Set([...prev, pinModalTargetChar.id]));
      }
      setPinModalTargetChar(null);
      setPinInput("");
      setPinError(null);
    } else {
      haptics.error(hapticFeedback);
      setPinError(language === "en" ? "Incorrect PIN" : "PIN salah");
      setPinInput("");
    }
  };

  const formatItemDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    }
    return date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F] min-h-screen">
      {/* Top Header */}
      <header className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-transparent">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:scale-95 transition-all cursor-pointer"
            title={dict.back}
            aria-label={dict.back}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
              {dict.starredMessagesTitle}
            </h1>
            <span className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-200/60 dark:bg-white/10 px-2 py-0.5 rounded-full tabular-nums">
              {starredItems.length}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center text-amber-500">
          <Star size={20} className="fill-[#F5B838] text-[#F5B838]" />
        </div>
      </header>

      {/* List Container */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-3 max-w-xl w-full mx-auto">
        {starredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F5B838] mb-4">
              <Star size={28} className="fill-[#F5B838]" />
            </div>
            <h2 className="text-[16px] font-bold text-neutral-900 dark:text-[#F2F3F7] mb-1">
              {dict.noStarredMessages}
            </h2>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              {dict.noStarredMessagesDesc}
            </p>
          </div>
        ) : (
          starredItems.map(({ message, character, isLocked }) => {
            const isUser = message.role === "user";

            if (isLocked) {
              // ==========================================
              // TAMPILAN TERKUNCI (OPSI A: PRIVASI ARSIP)
              // ==========================================
              return (
                <div
                  key={`${character.id}-${message.id}`}
                  className="bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#F5B838]">
                        <Lock size={14} />
                      </div>
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                        {dict.lockedChatStarred}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                      {dict.archivedBadge}
                    </span>
                  </div>

                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    {dict.lockedChatStarredDesc}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setPinModalTargetChar(character);
                        setPinInput("");
                        setPinError(null);
                      }}
                      className="text-[12px] font-bold text-[#B45309] dark:text-[#F5B838] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound size={13} />
                      <span>{dict.unlockPrompt}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.light(hapticFeedback);
                        onUnstarMessage(character.id, message.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title={dict.unstarMessage}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            }

            // ==========================================
            // TAMPILAN PESAN BERBINTANG BIASA / UNLOCKED
            // ==========================================
            return (
              <div
                key={`${character.id}-${message.id}`}
                className="bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5 transition-all hover:border-black/20 dark:hover:border-white/20"
              >
                {/* Header Kartu: Karakter Info + Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10 bg-neutral-200 dark:bg-white/10">
                      <img
                        src={character.avatarUrl || "/waguri-pfp.jpg"}
                        alt={character.name}
                        onError={(e) => {
                          e.currentTarget.src = "/waguri-pfp.jpg";
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-[#F2F3F7] truncate leading-tight">
                        {character.name}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                        {isUser ? dict.you : character.name.split(" ")[0]} • {formatItemDate(message.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {character.isArchived && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                        {dict.archivedBadge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light(hapticFeedback);
                        onUnstarMessage(character.id, message.id);
                      }}
                      className="p-1.5 text-amber-500 hover:text-neutral-400 rounded-lg transition-colors cursor-pointer"
                      title={dict.unstarMessage}
                    >
                      <Star size={16} className="fill-[#F5B838] text-[#F5B838]" />
                    </button>
                  </div>
                </div>

                {/* Konten Pesan */}
                <div className="px-1 text-[13.5px] leading-relaxed text-neutral-800 dark:text-[#E4E5EA] whitespace-pre-wrap break-words">
                  {message.image && (
                    <img
                      src={message.image.dataUrl}
                      alt="Attachment"
                      className="rounded-xl max-h-48 object-cover mb-2 border border-black/5 dark:border-white/5"
                    />
                  )}
                  {message.text && message.text !== "[Foto]" && (
                    <p>{message.text}</p>
                  )}
                </div>

                {/* Footer Kartu: Tombol Buka Obrolan */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light(hapticFeedback);
                      onSelectCharacterAndMessage(character, message.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/[0.06] hover:bg-[#F5B838] hover:text-neutral-950 text-[12px] font-semibold text-neutral-700 dark:text-[#C9CAD1] flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  >
                    <span>{dict.goToChat}</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Masukkan PIN Arsip */}
      {pinModalTargetChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F5B838]">
                  <Lock size={18} />
                </div>
                <h3 className="text-[16px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                  {dict.enterPinTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinModalTargetChar(null);
                  setPinInput("");
                  setPinError(null);
                }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {dict.enterPinDesc}
            </p>

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                autoFocus
                placeholder="PIN (4-6 angka)..."
                className="w-full text-center tracking-[0.4em] font-mono text-[18px] py-2.5 px-4 bg-neutral-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-[#F2F3F7] focus:outline-none focus:ring-2 focus:ring-[#F5B838]"
              />

              {pinError && (
                <span className="text-xs font-semibold text-red-500 text-center">
                  {pinError}
                </span>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalTargetChar(null);
                    setPinInput("");
                    setPinError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5B838] text-[13px] font-bold text-neutral-950 hover:bg-[#E5A929] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {dict.unlockPrompt}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
