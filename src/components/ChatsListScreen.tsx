import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Trash2,
  MessageSquareOff,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  MoreVertical,
  ChevronLeft,
  X,
} from "lucide-react";
import { Character, Chat, AppLanguage } from "../types";
import { getDictionary, t } from "../lib/i18n";
import { haptics } from "../lib/haptics";
import { UpdateNoticeBanner } from "./UpdateNoticeBanner";

interface ChatsListScreenProps {
  characters: Character[];
  chats: Record<string, Chat>;
  typingCharacterIds?: Record<string, boolean>;
  unreadCharacterIds?: Set<string>;
  /** Obrolan yang sedang terbuka di panel kanan (hanya desktop). */
  activeCharacterId?: string;
  onSelectCharacter: (char: Character) => void;
  onDeleteCharacter: (characterId: string) => void;
  onTogglePinCharacter?: (characterId: string) => void;
  onToggleArchiveCharacter?: (characterId: string) => void;
  onCreateNew: () => void;
  language?: AppLanguage;
  hapticFeedback?: boolean;
  isArchivedView?: boolean;
  onOpenArchived?: () => void;
  onCloseArchived?: () => void;
}

export const ChatsListScreen: React.FC<ChatsListScreenProps> = ({
  characters,
  chats,
  typingCharacterIds = {},
  unreadCharacterIds = new Set(),
  activeCharacterId,
  onSelectCharacter,
  onDeleteCharacter,
  onTogglePinCharacter,
  onToggleArchiveCharacter,
  onCreateNew,
  language = "id",
  hapticFeedback = true,
  isArchivedView: isArchivedViewProp,
  onOpenArchived,
  onCloseArchived,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [internalShowArchivedView, setInternalShowArchivedView] = useState(false);
  const showArchivedView = isArchivedViewProp !== undefined ? isArchivedViewProp : internalShowArchivedView;

  const handleOpenArchived = () => {
    if (onOpenArchived) {
      onOpenArchived();
    } else {
      setInternalShowArchivedView(true);
    }
  };

  const handleCloseArchived = () => {
    if (onCloseArchived) {
      onCloseArchived();
    } else {
      setInternalShowArchivedView(false);
    }
  };

  const [actionCharacter, setActionCharacter] = useState<Character | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  const dict = getDictionary(language);

  // Long press tracking
  const LONG_PRESS_MS = 400;
  const MOVE_TOLERANCE = 10;
  const longPressTimer = useRef<number | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const didLongPress = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStart.current = null;
  };

  const handlePointerDown = (
    char: Character,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    // Abaikan klik kanan / tombol sekunder
    if (e.button !== 0 && e.pointerType === "mouse") return;

    longPressStart.current = { x: e.clientX, y: e.clientY };
    didLongPress.current = false;

    longPressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      haptics.light(hapticFeedback);
      setActionCharacter(char);
      longPressTimer.current = null;
      longPressStart.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!longPressStart.current) return;
    const dx = Math.abs(e.clientX - longPressStart.current.x);
    const dy = Math.abs(e.clientY - longPressStart.current.y);
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
      clearLongPress();
    }
  };

  const handlePointerUp = () => {
    clearLongPress();
  };

  const openActionMenu = (char: Character, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    haptics.light(hapticFeedback);
    setActionCharacter(char);
  };

  const closeActionMenu = () => {
    setActionCharacter(null);
  };

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
          timeDisplay = date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
            month: "short",
            day: "numeric",
          });
        }
      } else {
        timeDisplay = dict.newBadge;
      }

      const previewText = lastMessage ? lastMessage.text : char.greeting;
      const sortTimestamp = lastMessage ? lastMessage.timestamp : char.createdAt || 0;

      return {
        character: char,
        lastMessage,
        timeDisplay,
        previewText,
        isTyping,
        isUnread,
        isPinned: Boolean(char.isPinned),
        isArchived: Boolean(char.isArchived),
        sortTimestamp,
      };
    });
  }, [characters, chats, typingCharacterIds, unreadCharacterIds, language, dict.newBadge]);

  const archivedCount = useMemo(() => {
    return chatItems.filter((item) => item.isArchived).length;
  }, [chatItems]);

  const activeItems = useMemo(() => {
    const list = showArchivedView
      ? chatItems.filter((item) => item.isArchived)
      : chatItems.filter((item) => !item.isArchived);

    // Sort: pinned first, then newest timestamp
    list.sort((a, b) => {
      if (!showArchivedView) {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
      }
      return b.sortTimestamp - a.sortTimestamp;
    });

    return list;
  }, [chatItems, showArchivedView]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase().trim();
    return activeItems.filter(
      (item) =>
        item.character.name.toLowerCase().includes(q) ||
        item.previewText.toLowerCase().includes(q) ||
        item.character.tagline.toLowerCase().includes(q)
    );
  }, [activeItems, searchQuery]);

  return (
    <main className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Top Header */}
      {showArchivedView ? (
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseArchived}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:scale-95 transition-all cursor-pointer"
            title={dict.backToChats}
            aria-label={dict.backToChats}
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[19px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight">
            {dict.archivedTitle}
          </h1>
          <div className="w-10 h-10" />
        </div>
      ) : (
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
            {dict.chatsHeading}
          </h1>

          {/* Options icon button on right */}
          <button
            type="button"
            onClick={onCreateNew}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:scale-95 transition-all cursor-pointer"
            title={dict.navCreateTitle}
            aria-label={dict.navCreateTitle}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-5 py-2.5">
        <div className="bg-[#EAEBED] dark:bg-white/[0.08] rounded-full px-4 h-[44px] flex items-center gap-2.5 text-neutral-700 dark:text-[#C9CAD1]">
          <Search size={18} className="text-neutral-400 dark:text-[#71717A] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="bg-transparent w-full text-[14px] text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-neutral-400 dark:text-[#71717A] hover:text-neutral-700 dark:hover:text-white cursor-pointer px-1.5 py-0.5 rounded-full"
            >
              {dict.cancel}
            </button>
          )}
        </div>
      </div>

      {/* Banner Pemberitahuan Pembaruan Baru */}
      {!showArchivedView && !searchQuery && (
        <UpdateNoticeBanner language={language} />
      )}

      {/* Horizontal Carousel (Only on main chats view, not archived view) */}
      {!showArchivedView && (
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
                {dict.add}
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
      )}

      {/* Main Conversation List */}
      <div className="px-5 flex-1">
        {/* Archived Folder Button (WhatsApp Style) */}
        {!showArchivedView && archivedCount > 0 && !searchQuery && (
          <button
            type="button"
            onClick={handleOpenArchived}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#16171B] rounded-[20px] shadow-xs border border-black/5 dark:border-white/10 mb-3 hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center text-neutral-600 dark:text-[#C9CAD1]">
                <Archive size={17} />
              </div>
              <span className="text-[14px] font-bold text-neutral-900 dark:text-[#F2F3F7]">
                {dict.archivedHeading}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.1] text-neutral-600 dark:text-[#C9CAD1]">
              {archivedCount}
            </span>
          </button>
        )}

        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-8 text-center flex flex-col items-center justify-center my-6 shadow-xs border border-black/5 dark:border-white/10">
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-white/[0.08] text-[#F5B838] flex items-center justify-center mb-3">
              <MessageSquareOff size={26} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-[#E4E5EA]">
              {showArchivedView ? dict.noArchivedChats : dict.noChatsFound}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-1 max-w-xs">
              {showArchivedView
                ? dict.backToChats
                : dict.noChatsPrompt}
            </p>
            {showArchivedView ? (
              <button
                onClick={handleCloseArchived}
                className="mt-4 px-5 py-2.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-200 dark:hover:bg-white/[0.14] transition-all shadow-xs cursor-pointer"
              >
                {dict.backToChats}
              </button>
            ) : (
              <button
                onClick={onCreateNew}
                className="mt-4 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#F5B838] text-neutral-900 hover:bg-[#E5A929] transition-all shadow-xs cursor-pointer"
              >
                {dict.desktopEmptyBtn}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#16171B] rounded-[24px] overflow-hidden shadow-xs border border-black/5 dark:border-white/10 divide-y divide-neutral-100 dark:divide-white/10">
            {filteredItems.map((item) => (
              <div
                key={item.character.id}
                onPointerDown={(e) => handlePointerDown(item.character, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={(e) => openActionMenu(item.character, e)}
                onClick={() => {
                  if (didLongPress.current) {
                    didLongPress.current = false;
                    return;
                  }
                  onSelectCharacter(item.character);
                }}
                className={`group flex items-start px-4 py-3.5 transition-colors cursor-pointer select-none relative ${
                  item.character.id === activeCharacterId
                    ? "bg-amber-50 dark:bg-[#F5B838]/10"
                    : "hover:bg-neutral-50 dark:hover:bg-white/[0.04] active:bg-neutral-100 dark:active:bg-white/[0.08]"
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 mr-3.5 mt-0.5 border border-black/5 dark:border-white/10 shadow-xs">
                  <img
                    className="w-full h-full object-cover"
                    src={item.character.avatarUrl}
                    alt={item.character.name}
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16171B]" />
                </div>

                {/* Content: Dynamic multi-line sentence display */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[15px] font-bold text-neutral-900 dark:text-[#F2F3F7] flex items-center gap-1.5 break-words">
                      <span>{item.character.name}</span>
                      {item.isPinned && (
                        <Pin size={13} className="text-[#F5B838] fill-[#F5B838] shrink-0" />
                      )}
                      {item.isUnread && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#F5B838] text-neutral-900 rounded-full shrink-0">
                          {dict.newBadge}
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[12px] text-neutral-400 dark:text-[#71717A] font-normal">
                        {item.timeDisplay}
                      </span>
                      {/* Three-dots menu trigger accessible on both mobile and desktop */}
                      <button
                        type="button"
                        onClick={(e) => openActionMenu(item.character, e)}
                        title={dict.chatOptions}
                        className="p-1 rounded-full text-neutral-400 dark:text-[#71717A] hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>

                  {item.isTyping ? (
                    <span className="text-[13px] text-[#E5A929] font-medium flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5B838]" />
                      <span>{dict.typing}</span>
                    </span>
                  ) : (
                    /* Dynamic multiline text without line-clamp, wrapping seamlessly */
                    <p
                      className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                        item.isUnread
                          ? "text-neutral-900 dark:text-[#F2F3F7] font-semibold"
                          : "text-neutral-500 dark:text-[#8A8A93]"
                      }`}
                    >
                      {item.previewText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp Style Minimalist Action Sheet (No emojis, ultra clean) */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {actionCharacter && (
              <div
                className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe animate-fade-in"
                onClick={closeActionMenu}
              >
          <div
            className="bg-white dark:bg-[#16171B] w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-3 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Character info */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
                  <img
                    src={actionCharacter.avatarUrl}
                    alt={actionCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-neutral-900 dark:text-[#F2F3F7] truncate">
                    {actionCharacter.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-[#8A8A93] truncate">
                    {actionCharacter.relationship || actionCharacter.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeActionMenu}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Actions List */}
            <div className="flex flex-col gap-1 py-1">
              {/* Favorit / Sematkan */}
              <button
                type="button"
                onClick={() => {
                  onTogglePinCharacter?.(actionCharacter.id);
                  closeActionMenu();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-800 dark:text-[#F2F3F7] transition-colors cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] shrink-0">
                  {actionCharacter.isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-neutral-900 dark:text-[#F2F3F7]">
                    {actionCharacter.isPinned ? dict.unfavorite : dict.favorite}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                    {actionCharacter.isPinned
                      ? "Lepas sematan obrolan"
                      : "Sematkan obrolan di posisi teratas"}
                  </span>
                </div>
              </button>

              {/* Arsipkan */}
              <button
                type="button"
                onClick={() => {
                  onToggleArchiveCharacter?.(actionCharacter.id);
                  closeActionMenu();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-800 dark:text-[#F2F3F7] transition-colors cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center text-neutral-700 dark:text-[#C9CAD1] shrink-0">
                  {actionCharacter.isArchived ? (
                    <ArchiveRestore size={18} />
                  ) : (
                    <Archive size={18} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-neutral-900 dark:text-[#F2F3F7]">
                    {actionCharacter.isArchived ? dict.unarchive : dict.archive}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                    {actionCharacter.isArchived
                      ? "Kembalikan ke pesan utama"
                      : "Sembunyikan obrolan ke folder arsip"}
                  </span>
                </div>
              </button>

              {/* Hapus Obrolan */}
              <button
                type="button"
                onClick={() => {
                  setCharacterToDelete(actionCharacter);
                  closeActionMenu();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-red-600 dark:text-red-400">
                    {dict.deleteChatAction}
                  </span>
                  <span className="text-[11px] text-red-400 dark:text-red-400/80">
                    Hapus karakter dan semua percakapan
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Style Minimalist Delete Confirmation Modal */}
      {characterToDelete && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setCharacterToDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#16171B] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 size={22} />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-[#F2F3F7]">
                {dict.confirmDeleteCharacterTitle}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A93] mt-1.5 leading-relaxed">
                {t("confirmDeleteCharacterDesc", language, {
                  name: characterToDelete.name,
                })}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCharacterToDelete(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-[#C9CAD1] hover:bg-neutral-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCharacter(characterToDelete.id);
                  setCharacterToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                {dict.confirmDeleteAction}
              </button>
            </div>
          </div>
        </div>
      )}
          </>,
          document.body
        )}
    </main>
  );
};
