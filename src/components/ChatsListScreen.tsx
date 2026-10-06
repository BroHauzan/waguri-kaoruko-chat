import React, { useState, useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Plus,
  Trash2,
  MessageSquareOff,
} from "lucide-react";
import { Character, Chat } from "../types";

interface ChatsListScreenProps {
  characters: Character[];
  chats: Record<string, Chat>;
  typingCharacterIds?: Record<string, boolean>;
  unreadCharacterIds?: Set<string>;
  /** Obrolan yang sedang terbuka di panel kanan (hanya desktop). */
  activeCharacterId?: string;
  onSelectCharacter: (char: Character) => void;
  onDeleteCharacter: (characterId: string) => void;
  onCreateNew: () => void;
}

export const ChatsListScreen: React.FC<ChatsListScreenProps> = ({
  characters,
  chats,
  typingCharacterIds = {},
  unreadCharacterIds = new Set(),
  activeCharacterId,
  onSelectCharacter,
  onDeleteCharacter,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const chatItems = useMemo(() => {
    return characters.map((char) => {
      const chat = chats[char.id];
      const messages = chat?.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const isTyping = Boolean(typingCharacterIds[char.id]);
      const isUnread = Boolean(unreadCharacterIds.has(char.id));

      let timeDisplay = "";
      if (lastMessage) {
        const date = new Date(lastMessage.timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
          timeDisplay = `${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}`;
        } else {
          timeDisplay = date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
        }
      } else {
        timeDisplay = "Baru";
      }

      const previewText = lastMessage ? lastMessage.text : char.greeting;

      return {
        character: char,
        lastMessage,
        timeDisplay,
        previewText,
        isTyping,
        isUnread,
      };
    });
  }, [characters, chats, typingCharacterIds, unreadCharacterIds]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return chatItems;
    const q = searchQuery.toLowerCase().trim();
    return chatItems.filter(
      (item) =>
        item.character.name.toLowerCase().includes(q) ||
        item.previewText.toLowerCase().includes(q) ||
        item.character.tagline.toLowerCase().includes(q)
    );
  }, [chatItems, searchQuery]);

  const handleDelete = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Hapus karakter "${char.name}" beserta riwayat chatnya?`
      )
    ) {
      onDeleteCharacter(char.id);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Top Header Matching Screen 2 */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        {/* User profile avatar on left */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 dark:bg-white/[0.12] border border-black/10 dark:border-white/10 shadow-xs shrink-0">
          <img
            src="/rintaro-pfp.jpg"
            alt="Profil Kamu"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title: Pesan */}
        <h1 className="text-[19px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
          Pesan
        </h1>

        {/* Options icon button on right */}
        <button
          type="button"
          onClick={onCreateNew}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:scale-95 transition-all cursor-pointer"
          title="Buat Karakter Baru"
          aria-label="Buat Karakter Baru"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-2.5">
        <div className="bg-[#EAEBED] dark:bg-white/[0.08] rounded-full px-4 h-[44px] flex items-center gap-2.5 text-neutral-700 dark:text-[#C9CAD1]">
          <Search size={18} className="text-neutral-400 dark:text-[#71717A] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari percakapan atau karakter..."
            className="bg-transparent w-full text-[14px] text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-neutral-400 dark:text-[#71717A] hover:text-neutral-700 dark:hover:text-white cursor-pointer px-1.5 py-0.5 rounded-full"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Online Characters / Stories Carousel (Screen 2) */}
      <div className="pt-2 pb-3">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none px-5 py-1">
          {/* Create New Add Button */}
          <button
            onClick={onCreateNew}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-neutral-300 dark:border-white/[0.12] flex items-center justify-center bg-white dark:bg-[#16171B] text-neutral-500 dark:text-[#8A8A93] group-hover:border-[#F5B838] group-hover:text-[#F5B838] transition-colors shadow-xs">
              <Plus size={22} />
            </div>
            <span className="text-[12px] font-medium text-neutral-600 dark:text-[#9B9BA3] truncate max-w-[56px] text-center">
              Tambah
            </span>
          </button>

          {/* List of Characters with Online Indicator */}
          {characters.map((char) => (
            <button
              key={`story_${char.id}`}
              onClick={() => onSelectCharacter(char)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className="relative w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-white dark:border-white/15 shadow-xs">
                <img
                  src={char.avatarUrl}
                  alt={char.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {/* Green Online Dot */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B0C0F]" />
              </div>
              <span className="text-[12px] font-medium text-neutral-700 dark:text-[#C9CAD1] truncate max-w-[58px] text-center group-hover:text-neutral-900 dark:group-hover:text-[#F2F3F7]">
                {char.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation List Matching Screen 2 */}
      <div className="px-5 flex-1">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-8 text-center flex flex-col items-center justify-center my-6 shadow-xs border border-black/5 dark:border-white/10">
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-white/[0.08] text-[#F5B838] flex items-center justify-center mb-3">
              <MessageSquareOff size={26} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-[#E4E5EA]">
              Tidak Ada Obrolan Ditemukan
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-1 max-w-xs">
              Mulai percakapan baru dengan menekan tombol tambah.
            </p>
            <button
              onClick={onCreateNew}
              className="mt-4 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#F5B838] text-neutral-900 hover:bg-[#E5A929] transition-all shadow-xs cursor-pointer"
            >
              Buat Karakter Sekarang
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#16171B] rounded-[24px] overflow-hidden shadow-xs border border-black/5 dark:border-white/10 divide-y divide-neutral-100 dark:divide-white/10">
            {filteredItems.map((item) => (
              <div
                key={item.character.id}
                onClick={() => onSelectCharacter(item.character)}
                className={`group flex items-center px-4 py-3.5 transition-colors cursor-pointer select-none ${
                  item.character.id === activeCharacterId
                    ? "bg-amber-50 dark:bg-[#F5B838]/10"
                    : "hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:bg-neutral-100 dark:active:bg-white/[0.08]"
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 mr-3.5 border border-black/5 dark:border-white/10 shadow-xs">
                  <img
                    className="w-full h-full object-cover"
                    src={item.character.avatarUrl}
                    alt={item.character.name}
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16171B]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <h2 className="text-[15px] font-bold text-neutral-900 dark:text-[#F2F3F7] truncate flex items-center gap-1.5">
                      <span>{item.character.name}</span>
                      {item.isUnread && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F5B838] text-neutral-900 rounded-full">
                          Baru
                        </span>
                      )}
                    </h2>
                    <span className="text-[12px] text-neutral-400 dark:text-[#71717A] font-normal shrink-0">
                      {item.timeDisplay}
                    </span>
                  </div>

                  {item.isTyping ? (
                    <span className="text-[13px] text-[#E5A929] font-medium flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5B838]" />
                      <span>sedang mengetik...</span>
                    </span>
                  ) : (
                    <p
                      className={`text-[13px] line-clamp-1 leading-relaxed ${
                        item.isUnread
                          ? "text-neutral-900 dark:text-[#F2F3F7] font-semibold"
                          : "text-neutral-500 dark:text-[#8A8A93]"
                      }`}
                    >
                      {item.previewText}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.character, e)}
                  title={`Hapus ${item.character.name}`}
                  className="p-2 rounded-full text-transparent group-hover:text-neutral-400 dark:group-hover:text-[#71717A] hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
