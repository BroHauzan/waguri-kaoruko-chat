import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  MoreHorizontal,
  Smile,
  Image as ImageIcon,
  Camera,
  Plus,
  Send,
  Mic,
  Play,
  Check,
  Copy,
  Edit3,
  Trash2,
  Sliders,
  BarChart2,
  X,
  Sparkles,
  Search,
  Calendar,
  ChevronUp,
  ChevronDown,
  Reply,
  ArrowLeft,
  Clock,
  Crown,
  Brain,
} from "lucide-react";
import {
  Character,
  Chat,
  Message,
  Settings,
  ImageAttachment,
  AudioAttachment,
} from "../types";
import { QuotaModal } from "./QuotaModal";
import {
  canSendMessage,
  recordUserMessageSent,
  getDailyUsage,
  DailyUsageInfo,
  FREE_DAILY_MESSAGE_LIMIT,
} from "../lib/quotaService";
import {
  sendMessageToGemini,
  checkAndAutoSummarizeDayTransition,
} from "../lib/geminiClient";
import {
  fileToImageAttachment,
  formatBytes,
} from "../lib/imageUtils";
import { blobToAudioAttachment, isRecordingSupported } from "../lib/audioUtils";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceNoteBubble } from "./VoiceNoteBubble";
import { MessageTicks } from "./MessageTicks";
import { CustomInstructionsModal } from "./CustomInstructionsModal";
import { EmojiPicker } from "./EmojiPicker";
import { ChatImagePicker } from "./ChatImagePicker";
import {
  MessageContextMenu,
  ContextMenuAction,
} from "./MessageContextMenu";
import { haptics } from "../lib/haptics";
import { MoodTrendsChart } from "./MoodTrendsChart";
import { ScheduledTasksModal } from "./ScheduledTasksModal";
import { storage } from "../lib/storage";
import { enqueueTask, removeTask } from "../lib/indexedDbQueue";
import { backgroundQueue } from "../lib/backgroundQueueProcessor";
import { sendPushLikeNotification } from "../lib/pushNotification";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";
import { CharacterDetailSheet } from "./CharacterDetailSheet";
import { formatDateSeparator, isSameDay } from "../lib/dateUtils";
import { getMoodTheme } from "../lib/moodConfig";
import { getDictionary } from "../lib/i18n";
import { getEffectiveUserBubbleBg } from "../lib/bubbleThemes";

interface ThinkingAccordionProps {
  thinkingText: string;
  accentColor?: string;
}

const ThinkingAccordion: React.FC<ThinkingAccordionProps> = ({
  thinkingText,
  accentColor,
}) => {
  // Selesai berpikir otomatis di-collapse sesuai permintaan user
  const [isOpen, setIsOpen] = useState(false);

  if (!thinkingText || !thinkingText.trim()) return null;

  return (
    <div className="mb-2 w-full max-w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] transition-all">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors rounded-xl select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Brain size={13} style={{ color: accentColor || "#F5B838" }} className="shrink-0" />
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA] truncate">
            {isOpen ? "Sembunyikan alur berpikir" : "Lihat alur berpikir (reasoning)"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-neutral-400 dark:text-[#71717A]">
          <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-black/5 dark:bg-white/10">
            {isOpen ? "Buka" : "Selesai"}
          </span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-2.5 pt-1 border-t border-black/5 dark:border-white/5">
          <div className="text-[11px] leading-relaxed text-neutral-600 dark:text-[#B0B1BA] max-h-56 overflow-y-auto whitespace-pre-wrap font-sans select-text break-words">
            {thinkingText.trim()}
          </div>
        </div>
      )}
    </div>
  );
};

interface ChatScreenProps {
  character: Character;
  chat: Chat;
  settings: Settings;
  onBack: () => void;
  onUpdateChat: (chat: Chat) => void;
  onClearChat?: (characterId: string) => void;
  onUpdateCharacter: (character: Character) => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (characterId: string) => void;
  onBackgroundReply?: (character: Character, lastReplyText: string) => void;
  onTypingChange?: (characterId: string, isTyping: boolean) => void;
  onSaveSettings?: (settings: Settings) => void;
  isCharacterTyping?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  character,
  chat,
  settings,
  onBack,
  onUpdateChat,
  onClearChat,
  onUpdateCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onBackgroundReply,
  onTypingChange,
  onSaveSettings,
  isCharacterTyping,
}) => {
  const [inputText, setInputText] = useState("");
  const [localIsTyping, setLocalIsTyping] = useState(false);
  const isTyping = localIsTyping || Boolean(isCharacterTyping);
  const setIsTyping = (val: boolean) => {
    setLocalIsTyping(val);
    onTypingChange?.(character.id, val);
  };
  const dict = getDictionary(settings.language || "id");
  const moodTheme = getMoodTheme(
    chat.currentMood?.emotion || character.defaultMood || "neutral",
    settings.language || "id"
  );
  // Warna bubble user ditentukan oleh tema pilihan user (tidak dipaksa mengikuti mood karakter)
  const userBubbleBg = getEffectiveUserBubbleBg(
    settings.bubbleTheme || "amber",
    moodTheme.userBubbleBg
  );
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [showMoodStatsModal, setShowMoodStatsModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  /** Posisi bubble yang dipilih, dipakai untuk menempatkan menu konteks. */
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  /** Timer long-press; dibatalkan kalau jari bergerak atau terangkat. */
  const longPressTimer = useRef<number | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);

  /** Pesan yang sedang dibalas lewat swipe. */
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  /** Pergeseran horizontal per pesan saat swipe-to-reply berlangsung. */
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const swipeStart = useRef<{ id: string; x: number; y: number } | null>(null);
  /** Ambang jarak sebelum swipe dianggap sebagai niat membalas. */
  const SWIPE_REPLY_THRESHOLD = 56;
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);

  // Search state (text & date)
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Quota & Account Tier state
  const [quotaInfo, setQuotaInfo] = useState<DailyUsageInfo>(getDailyUsage());
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaModalReason, setQuotaModalReason] = useState<"exceeded" | "manual">("manual");

  useEffect(() => {
    const handleQuotaChange = () => setQuotaInfo(getDailyUsage());
    window.addEventListener("waguri_quota_updated", handleQuotaChange);
    return () => window.removeEventListener("waguri_quota_updated", handleQuotaChange);
  }, []);

  // Swipe threshold tracking ref
  const swipedThresholdReached = useRef<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(true);
  
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showInputMenu, setShowInputMenu] = useState(false);
  const inputMenuRef = useRef<HTMLDivElement>(null);

  // Floating scroll-to-bottom & scheduled routines state
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [showScheduledTasksModal, setShowScheduledTasksModal] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const handleMainScroll = useCallback(() => {
    if (!mainScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainScrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 250);
  }, []);

  const handleScrollToMessage = useCallback((messageId?: string) => {
    if (!messageId) return;
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
      }, 2500);
    }
  }, []);

  const searchMatches = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return chat.messages
      .map((m, idx) => ({ message: m, index: idx }))
      .filter(({ message }) => message.text && message.text.toLowerCase().includes(q));
  }, [chat.messages, searchQuery]);

  const jumpToMatch = (index: number) => {
    if (searchMatches.length === 0) return;
    const clampedIndex = (index + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(clampedIndex);
    const targetMsg = searchMatches[clampedIndex].message;
    setHighlightedMessageId(targetMsg.id);
    const el = document.getElementById(`msg-${targetMsg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === targetMsg.id ? null : prev));
    }, 2500);
  };

  const handleNextMatch = () => jumpToMatch(currentMatchIndex + 1);
  const handlePrevMatch = () => jumpToMatch(currentMatchIndex - 1);

  useEffect(() => {
    if (searchMatches.length > 0) {
      jumpToMatch(searchMatches.length - 1);
    } else {
      setCurrentMatchIndex(0);
      setHighlightedMessageId(null);
    }
  }, [searchQuery]);

  const handleJumpToDate = (dateStr: string) => {
    setShowDatePicker(false);
    if (!dateStr) return;
    const targetDate = new Date(dateStr + "T00:00:00");
    const startTime = targetDate.getTime();
    const endTime = startTime + 24 * 60 * 60 * 1000;

    const foundMsg = chat.messages.find(
      (m) => m.timestamp >= startTime && m.timestamp < endTime
    );

    if (foundMsg) {
      setHighlightedMessageId(foundMsg.id);
      const el = document.getElementById(`msg-${foundMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === foundMsg.id ? null : prev));
      }, 2500);
      setSuccessNotice(`Menampilkan percakapan ${dateStr}`);
      setTimeout(() => setSuccessNotice(null), 2500);
    } else {
      setErrorNotice(`Tidak ada pesan pada tanggal ${dateStr}`);
      setTimeout(() => setErrorNotice(null), 3000);
    }
  };

  useEffect(() => {
    if (!showInputMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inputMenuRef.current && !inputMenuRef.current.contains(e.target as Node)) {
        setShowInputMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInputMenu]);

  const handleInsertActionFormat = () => {
    haptics.light(settings.hapticFeedback !== false);
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText((prev) => prev + "__");
      return;
    }

    const start = textarea.selectionStart ?? inputText.length;
    const end = textarea.selectionEnd ?? inputText.length;
    const selected = inputText.substring(start, end);

    let nextText = "";
    let nextStart = 0;
    let nextEnd = 0;

    if (selected.length > 0) {
      nextText = inputText.substring(0, start) + `_${selected}_` + inputText.substring(end);
      nextStart = start + 1;
      nextEnd = end + 1;
    } else {
      nextText = inputText.substring(0, start) + "__" + inputText.substring(end);
      nextStart = start + 1;
      nextEnd = start + 1;
    }

    setInputText(nextText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextStart, nextEnd);
        adjustHeight();
      }
    }, 10);
  };

  const renderFormattedMessage = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(_[^_\n]+_)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
        const content = part.slice(1, -1);
        return (
          <span
            key={idx}
            className="italic font-medium opacity-90 underline decoration-dotted decoration-current/30 underline-offset-3"
            title="Aksi roleplay"
          >
            _{content}_
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  useEffect(() => {
    let timer: number;
    if (cooldownTime > 0) {
      timer = window.setInterval(() => {
        setCooldownTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const MAX_INPUT_HEIGHT = 130; // ~5 baris teks WhatsApp style

  // Logika auto-resize tinggi textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height dulu agar scrollHeight terhitung akurat saat teks dihapus
    el.style.height = "auto";

    // Hitung tinggi baru (clamp ke MAX_INPUT_HEIGHT)
    const newHeight = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT);
    el.style.height = `${newHeight}px`;

    // Aktifkan scroll internal jika teks sudah melebihi 5 baris
    el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [inputText, adjustHeight]);

  useEffect(() => {
    isMountedRef.current = true;
    // Auto-summarize di background saat berganti hari jika ada obrolan kemarin yang belum dirangkum
    checkAndAutoSummarizeDayTransition({
      character,
      chat,
      settings,
      onUpdateChat,
    });
    return () => {
      isMountedRef.current = false;
    };
  }, [chat.characterId]);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [chat.characterId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [chat.messages.length, isTyping]);

  const handleSend = async (
    overrideText?: string,
    overrideAudio?: AudioAttachment
  ) => {
    const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
    const imageToSend = attachedImage;
    const audioToSend = overrideAudio;

    // Pesan boleh kosong asal ada lampiran (gambar atau suara).
    if ((!textToSend && !imageToSend && !audioToSend) || isTyping) return;

    if (editingMessage) {
      const updatedMessages = chat.messages.map((m) =>
        m.id === editingMessage.id ? { ...m, text: textToSend } : m
      );
      onUpdateChat({
        ...chat,
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
      setEditingMessage(null);
      setInputText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
      return;
    }

    // Cek batas kuota pesan harian untuk user Free (200 pesan/hari)
    if (!canSendMessage()) {
      setQuotaModalReason("exceeded");
      setShowQuotaModal(true);
      return;
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      // Kalau user kirim lampiran tanpa teks, tetap beri keterangan supaya
      // daftar chat tidak menampilkan baris kosong.
      text:
        textToSend ||
        (audioToSend ? "[Pesan suara]" : imageToSend ? "[Foto]" : ""),
      image: imageToSend || undefined,
      audio: audioToSend || undefined,
      // Simpan kutipan sebagai data, bukan referensi ke objek pesan — pesan
      // aslinya bisa berubah atau terhapus, dan kutipan harus tetap utuh.
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text:
              replyTo.audio
                ? "Pesan suara"
                : replyTo.image
                ? "Foto"
                : replyTo.text,
            isUser: replyTo.role === "user",
          }
        : undefined,
      timestamp: Date.now(),
    };

    const newMessages = [...chat.messages, userMessage];
    const updatedChatWithUser: Chat = {
      ...chat,
      messages: newMessages,
      updatedAt: Date.now(),
    };

    const isHapticEnabled = settings.hapticFeedback !== false;

    // Catat penggunaan 1 pesan keluar
    recordUserMessageSent();

    // `onUpdateChat` sudah menyimpan ke localStorage di dalamnya. Memanggil
    // storage.saveChat() di sini juga berarti menulis seluruh chat dua kali —
    // dan dengan lampiran gambar itu berarti dua kali menulis beberapa MB
    // JSON, yang membekukan UI tepat saat pesan dikirim.
    onUpdateChat(updatedChatWithUser);
    haptics.send(isHapticEnabled);
    setInputText("");
    setAttachedImage(null);
    setReplyTo(null);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
    setIsTyping(true);
    onTypingChange?.(character.id, true);

    const taskId = `task_${character.id}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    // This turn is handled right here. Tell the background queue to leave it
    // alone so a visibilitychange/online event can't trigger a second Gemini
    // call for the same message (which delivered duplicate replies).
    backgroundQueue.markForeground(taskId);

    // Lampiran disertakan supaya kalau user keluar aplikasi sebelum balasan
    // datang, gambar tetap ikut diproses di latar belakang.
    //
    // Snapshot chat sengaja dibuang gambarnya: gambar sudah dikirim terpisah
    // di field `image`, dan menyimpannya dua kali membuat payload IndexedDB
    // membengkak tanpa manfaat. Penulisan tidak di-await supaya kegagalan
    // antrean tidak menahan pengiriman yang sedang berjalan.
    const snapshotWithoutAttachments: Chat = {
      ...updatedChatWithUser,
      messages: updatedChatWithUser.messages.map((m) =>
        m.image || m.audio ? { ...m, image: undefined, audio: undefined } : m
      ),
    };

    enqueueTask({
      id: taskId,
      characterId: character.id,
      characterName: character.name,
      characterAvatar: character.avatarUrl,
      userMessage: textToSend,
      chatSnapshot: snapshotWithoutAttachments,
      character,
      image: imageToSend
        ? { base64: imageToSend.base64, mimeType: imageToSend.mimeType }
        : undefined,
      audio: audioToSend
        ? { base64: audioToSend.base64, mimeType: audioToSend.mimeType }
        : undefined,
      createdAt: Date.now(),
      status: "processing",
    }).catch((e) => console.warn("Task error", e));

    const isPhotoRequest = /\b(pap|foto|selfie|potret|pic|photo|fotoin)\b/i.test(textToSend);
    if (isPhotoRequest) {
      setIsGeneratingPhoto(true);
    }

    try {
      const response = await sendMessageToGemini({
        character,
        chat: updatedChatWithUser,
        userMessage: textToSend,
        settings,
        image: imageToSend,
        audio: audioToSend,
        replyToText: replyTo
          ? `${replyTo.role === "user" ? (settings.userName || "Pengguna") : character.name}: "${replyTo.text || (replyTo.image ? "[Foto]" : "[Pesan suara]")}"`
          : null,
      });

      setIsGeneratingPhoto(false);

      const incomingList =
        response.messages && response.messages.length > 0
          ? response.messages
          : ["..."];

      // Karakter sudah membalas, jadi pesan user terakhir ditandai terbaca.
      // Ini yang mengubah centang satu jadi centang dua.
      const markLastUserMessageRead = (list: Message[]): Message[] => {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].role === "user") {
            const copy = [...list];
            copy[i] = { ...copy[i], readByCharacter: true };
            return copy;
          }
        }
        return list;
      };

      if (!isMountedRef.current) {
        const finalCharMessages: Message[] = incomingList.map((text, idx) => ({
          id: `msg_char_${Date.now()}_${idx}`,
          role: "char",
          text,
          thinkingProcess: idx === 0 ? response.thinkingProcess : undefined,
          image:
            response.photo?.dataUrl && idx === 0
              ? {
                  id: `img_${Date.now()}`,
                  dataUrl: response.photo.dataUrl,
                  base64: response.photo.dataUrl.split(",")[1] || "",
                  mimeType: "image/jpeg",
                  size: Math.round((response.photo.dataUrl.length * 3) / 4),
                }
              : undefined,
          emotion: response.emotion || character.defaultMood,
          intensity: response.intensity || 6,
          timestamp: Date.now() + idx * 10,
        }));

        const finalChat: Chat = {
          ...updatedChatWithUser,
          messages: markLastUserMessageRead([
            ...newMessages,
            ...finalCharMessages,
          ]),
          currentMood: {
            emotion: response.emotion || character.defaultMood,
            intensity: response.intensity || 6,
          },
          updatedAt: Date.now(),
        };

        onUpdateChat(finalChat);
        onTypingChange?.(character.id, false);
        removeTask(taskId).catch(() => {});

        const replySummary =
          finalCharMessages[finalCharMessages.length - 1]?.text || "Pesan baru";

        sendPushLikeNotification(character.name, {
          body: replySummary,
          icon: character.avatarUrl,
          characterId: character.id,
        }).catch(() => {});

        onBackgroundReply?.(character, replySummary);
        return;
      }

      let currentMsgList = [...newMessages];

      for (let i = 0; i < incomingList.length; i++) {
        if (!isMountedRef.current) {
          const remainingTexts = incomingList.slice(i);
          const remainingCharMsgs: Message[] = remainingTexts.map((txt, remIdx) => ({
            id: `msg_char_${Date.now()}_${remIdx}`,
            role: "char",
            text: txt,
            thinkingProcess: remIdx === 0 && i === 0 ? response.thinkingProcess : undefined,
            emotion: response.emotion || character.defaultMood,
            intensity: response.intensity || 6,
            timestamp: Date.now() + remIdx * 10,
          }));

          const completeChat: Chat = {
            ...updatedChatWithUser,
            messages: markLastUserMessageRead([
              ...currentMsgList,
              ...remainingCharMsgs,
            ]),
            currentMood: {
              emotion: response.emotion || character.defaultMood,
              intensity: response.intensity || 6,
            },
            updatedAt: Date.now(),
          };

          onUpdateChat(completeChat);
          onTypingChange?.(character.id, false);
          removeTask(taskId).catch(() => {});

          const replySummary =
            remainingCharMsgs[remainingCharMsgs.length - 1]?.text || "Pesan baru";

          sendPushLikeNotification(character.name, {
            body: replySummary,
            icon: character.avatarUrl,
            characterId: character.id,
          }).catch(() => {});

          onBackgroundReply?.(character, replySummary);
          return;
        }

        const text = incomingList[i];
        if (!text) continue;

        setIsTyping(true);
        const typingDelay = Math.min(
          1600,
          Math.max(650, text.length * 20 + Math.floor(Math.random() * 150))
        );
        await new Promise((r) => setTimeout(r, typingDelay));

        if (!isMountedRef.current) {
          const remainingTexts = incomingList.slice(i);
          const remainingCharMsgs: Message[] = remainingTexts.map((txt, remIdx) => ({
            id: `msg_char_${Date.now()}_${remIdx}`,
            role: "char",
            text: txt,
            thinkingProcess: remIdx === 0 && i === 0 ? response.thinkingProcess : undefined,
            emotion: response.emotion || character.defaultMood,
            intensity: response.intensity || 6,
            timestamp: Date.now() + remIdx * 10,
          }));

          const completeChat: Chat = {
            ...updatedChatWithUser,
            messages: markLastUserMessageRead([
              ...currentMsgList,
              ...remainingCharMsgs,
            ]),
            currentMood: {
              emotion: response.emotion || character.defaultMood,
              intensity: response.intensity || 6,
            },
            updatedAt: Date.now(),
          };

          onUpdateChat(completeChat);
          onTypingChange?.(character.id, false);
          removeTask(taskId).catch(() => {});

          const replySummary =
            remainingCharMsgs[remainingCharMsgs.length - 1]?.text || "Pesan baru";

          sendPushLikeNotification(character.name, {
            body: replySummary,
            icon: character.avatarUrl,
            characterId: character.id,
          }).catch(() => {});

          onBackgroundReply?.(character, replySummary);
          return;
        }

        let photoAttachment: ImageAttachment | undefined;
        if (response.photo?.dataUrl && i === 0) {
          photoAttachment = {
            id: `img_${Date.now()}`,
            dataUrl: response.photo.dataUrl,
            base64: response.photo.dataUrl.split(",")[1] || "",
            mimeType: "image/jpeg",
            size: Math.round((response.photo.dataUrl.length * 3) / 4),
          };
        }

        const newCharMsg: Message = {
          id: `msg_char_${Date.now()}_${i}`,
          role: "char",
          text,
          thinkingProcess: i === 0 ? response.thinkingProcess : undefined,
          image: photoAttachment,
          emotion: response.emotion || character.defaultMood,
          intensity: response.intensity || 6,
          timestamp: Date.now(),
        };

        currentMsgList = [...currentMsgList, newCharMsg];

        const intermediateChat: Chat = {
          ...updatedChatWithUser,
          messages: markLastUserMessageRead(currentMsgList),
          currentMood: {
            emotion: response.emotion || character.defaultMood,
            intensity: response.intensity || 6,
          },
          updatedAt: Date.now(),
        };

        onUpdateChat(intermediateChat);
        haptics.receive(isHapticEnabled);

        if (i < incomingList.length - 1) {
          setIsTyping(false);
          await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 150)));
        }
      }

      // Update karakter & preferensi secara otomatis jika ada permintaan perubahan panggilan / gaya bicara
      if (response.updatedInstruction || response.updatedSpeakingStyle || response.preferredUserName) {
        let currentInstructions = character.customInstructions || "";
        const instructionToAdd = response.updatedInstruction;

        if (instructionToAdd && !currentInstructions.toLowerCase().includes(instructionToAdd.toLowerCase())) {
          currentInstructions = currentInstructions.trim()
            ? `${currentInstructions.trim()}\n- ${instructionToAdd}`
            : `- ${instructionToAdd}`;
        }

        let newSpeakingStyle = character.speakingStyle || "";
        if (response.updatedSpeakingStyle && response.updatedSpeakingStyle.trim()) {
          newSpeakingStyle = response.updatedSpeakingStyle.trim();
        } else if (response.preferredUserName) {
          const callRule = `Selalu panggil pengguna dengan sebutan "${response.preferredUserName}".`;
          const cleaned = newSpeakingStyle.replace(/(?:Selalu )?panggil pengguna dengan sebutan "[^"]*"\.?\s*/gi, "").trim();
          newSpeakingStyle = `${callRule} ${cleaned}`.trim();
        }

        const updatedChar: Character = {
          ...character,
          speakingStyle: newSpeakingStyle,
          customInstructions: currentInstructions,
        };

        storage.saveCharacter(updatedChar);
        onUpdateCharacter(updatedChar);

        // Jika ada pembaruan nama panggilan user
        if (response.preferredUserName && response.preferredUserName !== settings.userName) {
          const nextSettings: Settings = {
            ...settings,
            userName: response.preferredUserName,
          };
          onSaveSettings?.(nextSettings);
          storage.saveSettings(nextSettings);
        }

        // Tampilkan feedback visual bahwa karakter mengingat preferensi pengguna
        const toastMsg =
          settings.language === "en"
            ? `Speaking style updated: ${response.preferredUserName ? `called as "${response.preferredUserName}"` : "tone adapted"}`
            : `Gaya bicara diperbarui: ${response.preferredUserName ? `kamu dipanggil "${response.preferredUserName}"` : "gaya bicara disesuaikan"}`;
        setSuccessNotice(toastMsg);
        setTimeout(() => setSuccessNotice(null), 3500);
      }

      removeTask(taskId).catch(() => {});
    } catch (err: any) {
      removeTask(taskId).catch(() => {});
      console.error("Chat error:", err);
      haptics.error(isHapticEnabled);
      if (isMountedRef.current) {
        if (err?.status === 429) {
          const cooldown = 60; // 60 seconds
          setCooldownTime(cooldown);
          const simulatedMsg: Message = {
            id: `msg_char_${Date.now()}`,
            role: "char",
            text: "Aduh, Kaoruko lagi istirahat sebentar nih! Tunggu bentar ya, nanti aku bales lagi! 🥺",
            emotion: "playful",
            intensity: 6,
            timestamp: Date.now(),
          };
          onUpdateChat({
            ...chat,
            messages: [...chat.messages, simulatedMsg],
            currentMood: { emotion: "playful", intensity: 6 },
            updatedAt: Date.now(),
          });
        } else {
          // Surface the real reason when the server sends one — a missing API
          // key used to masquerade as "Koneksi terganggu", which sent people
          // hunting for a network problem that didn't exist.
          const detail = String(err?.message || "").trim();
          setErrorNotice(
            detail && detail !== "Failed to generate chat response"
              ? detail
              : "Koneksi terganggu. Silakan kirim ulang pesan."
          );
        }
      }
    } finally {
      // Always unmark on every exit path. Every path above already removed
      // the task from IndexedDB, so this is purely cleanup to keep the
      // foreground set from growing without bound.
      backgroundQueue.releaseForeground(taskId);
      onTypingChange?.(character.id, false);
      if (isMountedRef.current) {
        setIsTyping(false);
        setIsGeneratingPhoto(false);
      }
    }
  };

  /** Terima file gambar dari pemilih kamera/galeri, kompres, lalu jadikan lampiran. */
  const handleImageSelected = async (file: File) => {
    setIsPreparingImage(true);
    try {
      const attachment = await fileToImageAttachment(file);
      if (!isMountedRef.current) return;
      setAttachedImage(attachment);
      haptics.light(settings.hapticFeedback !== false);
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorNotice(String(err?.message || "Gagal memuat gambar."));
      }
    } finally {
      if (isMountedRef.current) setIsPreparingImage(false);
    }
  };

  /**
   * Terima rekaman dari VoiceRecorder, konversi ke WAV, lalu kirim.
   *
   * Konversi ke WAV bukan pilihan gaya: MediaRecorder menghasilkan webm/opus
   * atau mp4, dan Gemini tidak menerima keduanya untuk input audio.
   */
  const handleRecorded = async (blob: Blob, duration: number) => {
    setIsRecording(false);
    setIsPreparingAudio(true);
    try {
      const attachment = await blobToAudioAttachment(blob, duration);
      if (!isMountedRef.current) return;
      await handleSend(undefined, attachment);
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorNotice(
          String(err?.message || "Gagal memproses rekaman suara.")
        );
      }
    } finally {
      if (isMountedRef.current) setIsPreparingAudio(false);
    }
  };

  /** Sisipkan emoji di posisi kursor, bukan selalu di akhir teks. */
  const handlePickEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInputText((prev) => prev + emoji);
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + emoji + el.value.slice(end);
    setInputText(next);
    haptics.light(settings.hapticFeedback !== false);

    // Kembalikan fokus dan letakkan kursor setelah emoji.
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emoji.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.text);
    haptics.light(settings.hapticFeedback !== false);
    setSelectedMessageId(null);
    // Menu langsung tertutup setelah aksi dipilih, jadi umpan balik harus
    // lewat toast — bukan lewat label di dalam menu yang sudah hilang.
    setSuccessNotice("Pesan disalin ke clipboard");
    setTimeout(() => setSuccessNotice(null), 2000);
  };

  const handleDeleteMessage = (msgId: string) => {
    const updated = chat.messages.filter((m) => m.id !== msgId);
    onUpdateChat({
      ...chat,
      messages: updated,
      updatedAt: Date.now(),
    });
    setSelectedMessageId(null);
    haptics.light(settings.hapticFeedback !== false);
  };

  /** Pesan yang sedang dipilih untuk menu konteks. */
  const selectedMessage = selectedMessageId
    ? chat.messages.find((m) => m.id === selectedMessageId) || null
    : null;

  /**
   * Daftar aksi menu konteks, disusun mengikuti konteks pesan:
   * - "Dengarkan Suara" hanya untuk pesan karakter yang punya teks.
   * - "Edit" hanya untuk pesan sendiri yang punya teks.
   * - "Hapus" selalu ada.
   */
  const contextMenuActions: ContextMenuAction[] = (() => {
    if (!selectedMessage) return [];

    const isMsgUser = selectedMessage.role === "user";
    const hasText = Boolean(
      selectedMessage.text && selectedMessage.text !== "[Foto]"
    );

    const actions: ContextMenuAction[] = [
      {
        id: "reply",
        label: "Balas",
        icon: <Reply size={17} />,
        onSelect: () => {
          setReplyTo(selectedMessage);
          haptics.light(settings.hapticFeedback !== false);
          setSelectedMessageId(null);
          setMenuAnchor(null);
          requestAnimationFrame(() => textareaRef.current?.focus());
        },
      },
      {
        id: "copy",
        label: "Salin",
        icon: <Copy size={17} />,
        onSelect: () => {
          handleCopyMessage(selectedMessage);
          setMenuAnchor(null);
        },
      },
    ];

    if (!isMsgUser && hasText) {
      actions.push({
        id: "play",
        label: isPlayingAudio ? "Hentikan Suara" : "Dengarkan Suara",
        icon: isPlayingAudio ? (
          <span className="flex items-end gap-[2px] h-4">
            <span className="w-[2px] h-2 rounded-full bg-current animate-pulse" />
            <span
              className="w-[2px] h-3.5 rounded-full bg-current animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-[2px] h-2.5 rounded-full bg-current animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        ) : (
          <Play size={17} />
        ),
        onSelect: () => {
          handlePlayVoice(selectedMessage.text);
          setSelectedMessageId(null);
          setMenuAnchor(null);
        },
      });
    }

    if (isMsgUser && hasText) {
      actions.push({
        id: "edit",
        label: "Edit Pesan",
        icon: <Edit3 size={17} />,
        onSelect: () => {
          setEditingMessage(selectedMessage);
          setInputText(selectedMessage.text);
          setSelectedMessageId(null);
          setMenuAnchor(null);
          requestAnimationFrame(() => textareaRef.current?.focus());
        },
      });
    }

    actions.push({
      id: "delete",
      label: "Hapus Pesan",
      icon: <Trash2 size={17} />,
      danger: true,
      onSelect: () => {
        handleDeleteMessage(selectedMessage.id);
        setMenuAnchor(null);
      },
    });

    return actions;
  })();

  const executeClearChat = () => {
    setIsTyping(false);
    setSelectedMessageId(null);
    setEditingMessage(null);
    setInputText("");

    const freshChat = storage.clearChatHistory(character.id, character);
    if (onClearChat) {
      onClearChat(character.id);
    }
    onUpdateChat(freshChat);
    setShowActionMenu(false);

    haptics.light(settings.hapticFeedback !== false);
    setSuccessNotice("Riwayat chat berhasil dibersihkan!");
    setTimeout(() => {
      setSuccessNotice(null);
    }, 2500);

    setTimeout(() => {
      scrollToBottom(false);
    }, 50);
  };

  const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  /**
   * Long-press ala WhatsApp: tahan ~380ms untuk membuka menu konteks.
   *
   * Jari yang bergerak lebih dari 10px dianggap sebagai scroll, bukan
   * long-press — tanpa toleransi ini, menggulir daftar pesan akan terus
   * memicu menu secara tidak sengaja.
   */
  const LONG_PRESS_MS = 380;
  const MOVE_TOLERANCE = 10;

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStart.current = null;
  };

  const startLongPress = (
    message: Message,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    // Abaikan klik kanan / tombol non-primer.
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const target = e.currentTarget;
    longPressStart.current = { x: e.clientX, y: e.clientY };
    swipeStart.current = { id: message.id, x: e.clientX, y: e.clientY };
    // Tangkap pointer supaya geseran tetap terlacak walau keluar bubble.
    e.currentTarget.setPointerCapture?.(e.pointerId);

    longPressTimer.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setMenuAnchor({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setSelectedMessageId(message.id);
      haptics.light(settings.hapticFeedback !== false);
      longPressTimer.current = null;
      longPressStart.current = null;
    }, LONG_PRESS_MS);
  };

  const moveLongPress = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeStart.current;

    if (swipe) {
      const dx = e.clientX - swipe.x;
      const dy = e.clientY - swipe.y;

      // Geseran horizontal yang jelas → mode swipe-to-reply, bukan long-press.
      if (Math.abs(dx) > MOVE_TOLERANCE && Math.abs(dx) > Math.abs(dy)) {
        clearLongPress();
        // Hanya geser ke kanan yang berarti membalas, seperti WhatsApp.
        const offset = Math.max(0, Math.min(dx, SWIPE_REPLY_THRESHOLD + 24));
        setSwipeOffsets((prev) => {
          const prevOffset = prev[swipe.id] || 0;
          if (prevOffset < SWIPE_REPLY_THRESHOLD && offset >= SWIPE_REPLY_THRESHOLD) {
            haptics.light(settings.hapticFeedback !== false);
          }
          return { ...prev, [swipe.id]: offset };
        });
        return;
      }

      // Geseran vertikal → biarkan daftar menggulir.
      if (Math.abs(dy) > MOVE_TOLERANCE) {
        clearLongPress();
        return;
      }
    }

    if (!longPressStart.current) return;
    const dx = Math.abs(e.clientX - longPressStart.current.x);
    const dy = Math.abs(e.clientY - longPressStart.current.y);
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clearLongPress();
  };

  /** Selesaikan swipe: kalau melewati ambang, pasang pesan sebagai balasan. */
  const endSwipe = (message: Message) => {
    clearLongPress();
    const offset = swipeOffsets[message.id] || 0;
    swipeStart.current = null;
    setSwipeOffsets((prev) => {
      const next = { ...prev };
      delete next[message.id];
      return next;
    });

    if (offset >= SWIPE_REPLY_THRESHOLD) {
      setReplyTo(message);
      haptics.light(settings.hapticFeedback !== false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  /** Pasang atau lepas reaksi emoji pada sebuah pesan. */
  const handleReact = (messageId: string, emoji: string) => {
    const updated = chat.messages.map((m) =>
      m.id === messageId
        ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
        : m
    );
    onUpdateChat({ ...chat, messages: updated, updatedAt: Date.now() });
    haptics.light(settings.hapticFeedback !== false);
    setSelectedMessageId(null);
    setMenuAnchor(null);
  };

  // Play simulated voice note using SpeechSynthesis or beep
  const handlePlayVoice = (text: string) => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      setIsPlayingAudio(true);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "id-ID";
      utter.rate = 1.05;
      utter.pitch = 1.15;
      utter.onend = () => setIsPlayingAudio(false);
      utter.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utter);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  return (
    <div className="relative flex flex-col h-full h-dvh max-h-dvh w-full overflow-hidden text-[#18181B] dark:text-[#F2F3F7] bg-[#F4F5F7] dark:bg-[#0B0C0F] antialiased">
      {/* Top Header Matching Screen 3 (Right Phone in Reference Image) */}
      <header className="shrink-0 z-30 bg-white/85 dark:bg-[#16171B]/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/10 pt-safe w-full shadow-2xs">
        {isSearching ? (
          /* Search Bar Header Mode - Minimalist, NO emojis */
          <div className="h-[62px] px-3 flex items-center justify-between gap-2 max-w-md lg:max-w-none mx-auto">
            <button
              aria-label="Tutup pencarian"
              className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-[#E4E5EA] active:scale-95 transition-all cursor-pointer shrink-0"
              onClick={() => {
                setIsSearching(false);
                setSearchQuery("");
                setHighlightedMessageId(null);
              }}
              type="button"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1 flex items-center gap-2 bg-[#F0F1F5] dark:bg-white/[0.08] rounded-xl px-3 py-1.5 min-w-0">
              <Search size={16} className="text-neutral-400 dark:text-[#8A8A93] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pesan..."
                autoFocus
                className="w-full bg-transparent text-[14px] text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 outline-none leading-normal min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white shrink-0 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {searchMatches.length > 0 && (
              <span className="text-xs font-semibold text-neutral-500 dark:text-[#8A8A93] tabular-nums shrink-0 px-1">
                {currentMatchIndex + 1}/{searchMatches.length}
              </span>
            )}

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={searchMatches.length === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-[#C9CAD1] disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer"
                title="Pesan sebelumnya"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                disabled={searchMatches.length === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-[#C9CAD1] disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer"
                title="Pesan berikutnya"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-[#C9CAD1] hover:bg-neutral-100 dark:hover:bg-white/[0.08] cursor-pointer ml-0.5"
                title="Cari berdasarkan tanggal"
              >
                <Calendar size={17} />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Header Mode */
          <div className="h-[62px] px-4 flex items-center justify-between max-w-md lg:max-w-none mx-auto">
            {/* Left: Back Arrow + Avatar + Character Name + "Online" */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                aria-label="Kembali"
                className="lg:hidden w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-[#E4E5EA] active:scale-95 transition-all cursor-pointer shrink-0"
                onClick={onBack}
                type="button"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Avatar with Green Online Dot */}
              <div
                onClick={() => setShowDetailSheet(true)}
                className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10 cursor-pointer shadow-2xs"
              >
                <img
                  alt={character.name}
                  className="w-full h-full object-cover"
                  src={character.avatarUrl}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16171B]" />
              </div>

              {/* Name & Online Status + Mood Indicator */}
              <div
                onClick={() => setShowDetailSheet(true)}
                className="flex flex-col min-w-0 cursor-pointer"
              >
                <span className="text-[15px] font-bold text-neutral-900 dark:text-[#F2F3F7] tracking-tight truncate leading-tight">
                  {character.name}
                </span>
                <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                  <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                    {isTyping ? (settings.language === "en" ? "typing..." : "sedang mengetik...") : dict.online}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700 text-[10px]">•</span>
                  <span
                    className="text-[12px] font-medium text-neutral-500 dark:text-[#8A8A93]"
                    title={`Suasana hati: ${moodTheme.label}`}
                  >
                    {moodTheme.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Menu */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSearching(true);
                  setSearchQuery("");
                }}
                title="Cari Pesan"
                aria-label="Cari Pesan"
                className="w-10 h-10 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Search size={18} />
              </button>

              {/* Options Button -> Opens Character Profile / Detail View */}
              <button
                type="button"
                onClick={() => setShowActionMenu(!showActionMenu)}
                title="Menu Tindakan"
                aria-label="Menu Tindakan"
                className="w-10 h-10 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-700 dark:text-[#C9CAD1] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <MoreHorizontal size={19} />
              </button>
            </div>
          </div>
        )}

        {/* Dropdown Options Menu */}
        {showActionMenu && (
          <div className="absolute top-[66px] right-4 w-56 bg-white dark:bg-[#16171B] rounded-2xl shadow-xl border border-black/10 dark:border-white/10 p-1.5 z-50 animate-slide-down flex flex-col divide-y divide-neutral-100 dark:divide-white/10">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setIsSearching(true);
                  setSearchQuery("");
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Search size={15} className="text-neutral-500 dark:text-[#8A8A93]" />
                <span>Cari Pesan</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowDatePicker(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Calendar size={15} className="text-neutral-500 dark:text-[#8A8A93]" />
                <span>Cari Berdasarkan Tanggal</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setQuotaModalReason("manual");
                  setShowQuotaModal(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Crown size={15} className="text-amber-500" />
                <span>
                  {quotaInfo.isPaid
                    ? "Status Akun (VIP Unlimited)"
                    : `Kuota Chat (${quotaInfo.remaining}/${quotaInfo.limit})`}
                </span>
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowDetailSheet(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Sliders size={15} className="text-[#F5B838]" />
                <span>Lihat Profil Karakter</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowMoodStatsModal(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <BarChart2 size={15} className="text-[#F5B838]" />
                <span>Statistik & Tren Mood</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowCustomInstructions(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Edit3 size={15} className="text-neutral-500 dark:text-[#8A8A93]" />
                <span>Instruksi Khusus (System)</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowScheduledTasksModal(true);
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Clock size={15} className="text-[#F5B838]" />
                <span>Instruksi Terjadwal</span>
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={executeClearChat}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Bersihkan Isi Chat</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Conversation Stream */}
      <main
        ref={mainScrollRef}
        onScroll={handleMainScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative w-full flex flex-col"
      >

        {/* Banner notices */}
        {errorNotice && (
          <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between animate-fade-in shadow-2xs">
            <span>{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-red-600 dark:text-red-400 font-bold ml-2 underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {successNotice && (
          <div className="mx-4 mt-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </span>
          </div>
        )}

        {/* Push Notification Banner */}
        <NotificationPermissionBanner />

        {/* Message Thread.
            Margin 8pt di sisi kiri-kanan mengikuti spec WhatsApp: bubble
            lebih rapat ke tepi layar daripada elemen UI lain (16pt). */}
        <div className="flex flex-col px-2 lg:px-6 py-3 max-w-md lg:max-w-3xl w-full mx-auto" id="chat-thread">
          {/* Messages Loop */}
          {chat.messages.map((message, index) => {
            const isUser = message.role === "user";
            const isSelected = selectedMessageId === message.id;

            // Jarak antar bubble mengikuti spec: 2pt kalau pengirimnya sama
            // (terasa seperti satu rangkaian), 8pt kalau berganti pengirim.
            const prev = index > 0 ? chat.messages[index - 1] : null;
            const isSameSender = prev?.role === message.role;
            const showDateSeparator =
              index === 0 || !isSameDay(message.timestamp, prev!.timestamp);
            const gapClass =
              index === 0 || showDateSeparator ? "" : isSameSender ? "mt-[2px]" : "mt-2";

            return (
              <React.Fragment key={message.id}>
                {/* Pemisah tanggal WhatsApp style (Hari ini, Kemarin, nama hari, dsb.) */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center py-2.5 my-1">
                    <span className="text-[11px] font-medium tracking-tight text-neutral-600 dark:text-[#A1A1AA] bg-neutral-200/70 dark:bg-neutral-800/80 px-3 py-0.5 rounded-full shadow-2xs">
                      {formatDateSeparator(message.timestamp, settings.language || "id")}
                    </span>
                  </div>
                )}

                <div
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-message-in ${gapClass}`}
                >
                  {/* Container dengan swipe-to-reply indicator ala WhatsApp */}
                  <div className={`relative flex items-center w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    {/* Visual reply indicator ala WhatsApp yang muncul saat bubble digeser ke kanan */}
                    {(swipeOffsets[message.id] || 0) > 0 && (
                      <div
                        style={{
                          transform: `scale(${Math.min(1, (swipeOffsets[message.id] || 0) / SWIPE_REPLY_THRESHOLD)})`,
                          opacity: Math.min(1, (swipeOffsets[message.id] || 0) / 25),
                        }}
                        className={`absolute left-0 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors pointer-events-none ${
                          (swipeOffsets[message.id] || 0) >= SWIPE_REPLY_THRESHOLD
                            ? "bg-amber-500 text-neutral-950 shadow-xs"
                            : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        <Reply size={14} />
                      </div>
                    )}

                    {/* Message Bubble Container — long-press membuka menu konteks.
                        Sudut lancip (tail) ada di BAWAH, mengikuti WhatsApp: sisi
                        keluar di kanan-bawah, sisi masuk di kiri-bawah. */}
                    <div
                      id={`msg-${message.id}`}
                      style={{
                        transform: `translateX(${swipeOffsets[message.id] || 0}px)`,
                        transition: swipeOffsets[message.id]
                          ? "none"
                          : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                        touchAction: "pan-y",
                      }}
                      onPointerDown={(e) => startLongPress(message, e)}
                      onPointerUp={() => endSwipe(message)}
                      onPointerLeave={clearLongPress}
                      onPointerCancel={() => endSwipe(message)}
                      onPointerMove={moveLongPress}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`relative max-w-[80%] lg:max-w-[65%] px-3 py-2 cursor-pointer select-none touch-manipulation transition-[transform,opacity,box-shadow] duration-150 active:scale-[0.99] ${
                        highlightedMessageId === message.id
                          ? "ring-2 ring-amber-400 dark:ring-amber-400 shadow-md animate-pulse"
                          : ""
                      } ${
                        isUser
                          ? `${userBubbleBg} rounded-[12px] rounded-br-[0px] shadow-2xs`
                          : "bg-white dark:bg-[#1F2025] text-neutral-900 dark:text-[#F2F3F7] rounded-[12px] rounded-bl-[0px] border border-black/5 dark:border-white/10 shadow-2xs"
                      } ${
                        // Sembunyikan HANYA kalau preview pengganti benar-benar
                        // dirender. Kalau tidak, bubble (mis. berisi gambar) akan
                        // hilang tanpa ada yang menggantikannya.
                        isSelected &&
                        menuAnchor &&
                        message.text &&
                        message.text !== "[Foto]" &&
                        !message.image
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                    >
                      {/* Proses Berpikir AI (Collapsible Accordion) */}
                      {!isUser && Boolean(settings.showThinkingProcess) && message.thinkingProcess && (
                        <ThinkingAccordion
                          thinkingText={message.thinkingProcess}
                          accentColor={moodTheme.accentColor}
                        />
                      )}

                      {/* Kutipan pesan yang dibalas, seperti WhatsApp (bisa diklik untuk scroll ke pesan asli) */}
                      {message.replyTo && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScrollToMessage(message.replyTo?.id);
                          }}
                          style={!isUser ? { borderLeftColor: moodTheme.accentColor } : undefined}
                          className={`flex flex-col gap-0.5 mb-1.5 pl-2 py-1 rounded-r-md border-l-[3px] cursor-pointer hover:opacity-85 active:scale-[0.99] transition-transform ${
                            isUser
                              ? "border-neutral-900/40 bg-neutral-900/[0.07]"
                              : "border-[#F5B838] bg-black/[0.04] dark:bg-white/[0.05]"
                          }`}
                          title="Klik untuk melihat pesan yang dibalas"
                        >
                          <span
                            style={!isUser ? { color: moodTheme.accentHover || moodTheme.accentColor } : undefined}
                            className={`text-[11px] font-semibold ${
                              isUser
                                ? "text-neutral-900/80"
                                : "text-[#E5A929]"
                            }`}
                          >
                          {message.replyTo.isUser
                            ? "Kamu"
                            : character.name.split(" ")[0]}
                        </span>
                        <span
                          className={`text-[12px] line-clamp-2 leading-snug ${
                            isUser
                              ? "text-neutral-900/70"
                              : "text-neutral-500 dark:text-[#9B9BA3]"
                          }`}
                        >
                          {message.replyTo.text}
                        </span>
                      </div>
                    )}

                    {/* Gambar terlampir, dirender di atas teks */}
                    {message.image && (
                      <img
                        src={message.image.dataUrl}
                        alt="Lampiran"
                        className={`rounded-[14px] object-cover max-h-64 w-full ${
                          message.text && message.text !== "[Foto]" ? "mb-2" : ""
                        }`}
                      />
                    )}
                    {/* Voice note — pemutar sungguhan dengan waveform asli */}
                    {message.audio && (
                      <VoiceNoteBubble
                        audio={message.audio}
                        isUser={message.role === "user"}
                        hapticEnabled={settings.hapticFeedback !== false}
                      />
                    )}

                    {/* Sembunyikan placeholder lampiran kalau ada isinya.
                        Ukuran 15px mengikuti skala tipografi WhatsApp; barisnya
                        sedikit lebih rapat karena bubble-nya kini lebih ringkas. */}
                    {message.text &&
                      message.text !== "[Foto]" &&
                      message.text !== "[Pesan suara]" && (
                        <p
                          className={`text-[15px] leading-[1.35] whitespace-pre-wrap break-words ${
                            message.audio || message.image ? "mt-2" : ""
                          }`}
                        >
                          {renderFormattedMessage(message.text)}
                        </p>
                      )}

                    {/* Baris meta di DALAM bubble, seperti WhatsApp:
                        jam + centang status. Diletakkan rata kanan supaya
                        mengalir di samping teks terakhir. */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5 ${
                        isUser ? "text-neutral-900/55" : "text-neutral-400 dark:text-[#8A8A93]"
                      }`}
                    >
                      <span className="text-[11px] leading-none tabular-nums">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {isUser && (
                        <MessageTicks
                          state={message.readByCharacter ? "read" : "sent"}
                          tone="onBubble"
                        />
                      )}
                    </div>

                    {/* Badge reaksi, menempel di sudut bubble seperti WhatsApp */}
                    {message.reaction && (
                      <span
                        className={`absolute -bottom-2.5 ${
                          isUser ? "left-2" : "right-2"
                        } px-1.5 py-0.5 rounded-full bg-white dark:bg-[#2A2B31] border border-black/10 dark:border-white/15 shadow-sm text-[12px] leading-none`}
                      >
                        {message.reaction}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu konteks dirender sekali di luar loop, bukan per pesan */}
              </div>
            </React.Fragment>
          );
        })}

          {/* Skeleton Loading State untuk Generasi Foto / PAP */}
          {isGeneratingPhoto ? (
            <div className="flex flex-col items-start animate-fade-in">
              <div className="bg-white dark:bg-[#1F2025] rounded-[16px] rounded-bl-[0px] border border-black/5 dark:border-white/10 p-2.5 shadow-2xs w-52 flex flex-col gap-2 animate-pulse">
                <div className="w-full aspect-[9/16] max-h-52 bg-neutral-100 dark:bg-white/[0.08] rounded-xl flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 gap-2 border border-black/5 dark:border-white/5">
                  <Camera className="w-7 h-7 animate-bounce text-pink-400" />
                  <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                    Sedang mengambil foto...
                  </span>
                </div>
                <div className="h-2 w-2/3 bg-neutral-200 dark:bg-white/10 rounded-full" />
              </div>
              <span className="text-[11px] text-neutral-400 dark:text-[#71717A] mt-1 px-1">
                {character.name.split(" ")[0]} sedang mengambil foto...
              </span>
            </div>
          ) : (
            isTyping && (
              <div className="flex flex-col items-start animate-message-in">
                <div className="bg-white dark:bg-[#1F2025] text-neutral-900 dark:text-[#F2F3F7] rounded-[12px] rounded-bl-[0px] border border-black/5 dark:border-white/10 px-3 py-2 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-[#8A8A93] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-[#8A8A93] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-[#8A8A93] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[11px] text-neutral-400 dark:text-[#71717A] mt-1 px-1">
                  {character.name.split(" ")[0]} sedang mengetik...
                </span>
              </div>
            )
          )}

          {/* Spacer ekstra di bawah */}
          <div ref={messagesEndRef} className="h-4 shrink-0 w-full" />
        </div>
      </main>

      {/* Menu konteks pesan ala WhatsApp iOS */}
      {/* Portal ke body: panel desktop memakai transform, yang akan menggeser
          koordinat `fixed` menu ini dari koordinat layar. */}
      {createPortal(
      <AnimatePresence>
        {selectedMessage && menuAnchor && (
          <MessageContextMenu
            key="message-context-menu"
            text={selectedMessage.text}
            hasImage={Boolean(selectedMessage.image)}
            imageUrl={selectedMessage.image?.dataUrl}
            isUser={selectedMessage.role === "user"}
            userBubbleBg={userBubbleBg}
            anchorRect={menuAnchor}
            actions={contextMenuActions}
            quickReactions={["❤️", "😂", "😮", "😢", "🙏"]}
            onReact={(emoji) => handleReact(selectedMessage.id, emoji)}
            hideOriginalBubble={Boolean(
              selectedMessage.text &&
                selectedMessage.text !== "[Foto]" &&
                !selectedMessage.image
            )}
            onClose={() => {
              setSelectedMessageId(null);
              setMenuAnchor(null);
            }}
          />
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Perekam suara */}
      {isRecording && (
        <VoiceRecorder
          hapticEnabled={settings.hapticFeedback !== false}
          onRecorded={handleRecorded}
          onCancel={() => setIsRecording(false)}
        />
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onPick={handlePickEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Editing Message Banner */}
      {editingMessage && (
        <div className="fixed bottom-[74px] inset-x-0 z-30 max-w-md lg:max-w-3xl mx-auto px-4">
          <div className="bg-amber-50 dark:bg-[#F5B838]/15 border border-amber-200 dark:border-[#F5B838]/30 rounded-2xl p-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-md">
            <span className="truncate pr-2">Mengedit: "{editingMessage.text}"</span>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText("");
              }}
              className="text-amber-800 dark:text-amber-300 font-bold underline shrink-0 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bottom Input Bar Matching Screen 3 (Right Phone) */}
      <footer className="shrink-0 z-30 bg-white/85 dark:bg-[#16171B]/85 backdrop-blur-md border-t border-black/[0.06] dark:border-white/10 pb-safe w-full shadow-sm relative">
        {/* Floating Input Action Popover (Aksi Roleplay & Opsi) */}
        {showInputMenu && (
          <div
            ref={inputMenuRef}
            className="absolute bottom-[66px] right-4 sm:right-6 w-60 bg-white dark:bg-[#16171B] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-2 z-50 animate-slide-up flex flex-col"
          >
            <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-white/10 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 dark:text-[#71717A] uppercase tracking-wider">
                Opsi Chat
              </span>
              <button
                type="button"
                onClick={() => setShowInputMenu(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInputMenu(false);
                handleInsertActionFormat();
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#F5B838] flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[13px]">Aksi Roleplay (_aksi_)</span>
                <span className="text-[10.5px] text-neutral-400 font-normal">
                  Format aksi: _tindakan_
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowInputMenu(false);
                setInputText((prev) => (prev ? `${prev} coba pap dong` : "coba pap dong"));
                setTimeout(() => {
                  textareaRef.current?.focus();
                  adjustHeight();
                }, 10);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Camera size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[13px]">Minta Foto / PAP</span>
                <span className="text-[10.5px] text-neutral-400 font-normal">
                  Kirim teks minta foto
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Kutipan balasan, seperti WhatsApp (bisa diklik untuk melihat pesan yang dibalas) */}
        {replyTo && (
          <div className="px-3.5 pt-3 animate-fade-in">
            <div
              style={{ borderLeftColor: moodTheme.accentColor }}
              className="flex items-start gap-2 pl-2.5 py-1.5 rounded-r-lg border-l-[3px] bg-black/[0.04] dark:bg-white/[0.05]"
            >
              <div
                onClick={() => handleScrollToMessage(replyTo.id)}
                className="flex flex-col min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                title="Klik untuk melihat pesan asli"
              >
                <span
                  style={{ color: moodTheme.accentHover || moodTheme.accentColor }}
                  className="text-[11px] font-semibold"
                >
                  {replyTo.role === "user"
                    ? "Kamu"
                    : character.name.split(" ")[0]}
                </span>
                <span className="text-[12px] text-neutral-500 dark:text-[#9B9BA3] line-clamp-1 leading-snug">
                  {replyTo.audio
                    ? "Pesan suara"
                    : replyTo.image
                    ? "Foto"
                    : replyTo.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="p-1 rounded-full text-neutral-400 dark:text-[#71717A] hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                title="Batal balas"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Image preview strip — muncul kalau ada gambar dilampirkan */}
        {attachedImage && (
          <div className="px-3.5 pt-3 animate-fade-in">
            <div className="relative inline-block">
              <img
                src={attachedImage.dataUrl}
                alt="Lampiran"
                className="h-20 w-20 object-cover rounded-2xl border border-black/10 dark:border-white/15"
              />
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                title="Hapus lampiran"
              >
                <X size={13} />
              </button>
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-medium">
                {formatBytes(attachedImage.size)}
              </span>
            </div>
          </div>
        )}

        {/* Quota Notice Banner untuk Pengguna Free */}
        {!quotaInfo.isPaid && quotaInfo.remaining <= 0 && (
          <div className="px-3.5 py-1.5 bg-red-500/10 dark:bg-red-500/15 border-t border-red-500/20 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown size={14} className="shrink-0 text-amber-500" />
              <span className="truncate font-medium">Kuota chat harian habis ({quotaInfo.limit}/{quotaInfo.limit} pesan).</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuotaModalReason("exceeded");
                setShowQuotaModal(true);
              }}
              className="font-bold underline ml-2 shrink-0 cursor-pointer hover:opacity-80"
            >
              Aktivasi VIP Unlimited
            </button>
          </div>
        )}

        {!quotaInfo.isPaid && quotaInfo.remaining > 0 && quotaInfo.remaining <= 20 && (
          <div className="px-3.5 py-1 bg-amber-500/10 dark:bg-amber-500/15 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300">
            <span>Sisa kuota gratis hari ini: {quotaInfo.remaining} pesan</span>
            <button
              type="button"
              onClick={() => {
                setQuotaModalReason("manual");
                setShowQuotaModal(true);
              }}
              className="font-semibold underline ml-2 cursor-pointer"
            >
              Upgrade VIP
            </button>
          </div>
        )}

        <div className="min-h-[58px] px-3 py-2 flex items-end gap-2">
          {/* Smiley Emoji Button */}
          <button
            type="button"
            onClick={() => {
              haptics.light(settings.hapticFeedback !== false);
              setShowEmojiPicker((v) => !v);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer mb-0.5 ${
              showEmojiPicker
                ? "text-[#E5A929]"
                : "text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-800 dark:hover:text-white"
            }`}
            title="Emoji"
            aria-label="Emoji"
          >
            <Smile size={22} />
          </button>

          {/* Container Input Bulat / Pill */}
          <div className="flex-1 bg-[#F0F1F5] dark:bg-white/[0.08] rounded-2xl px-3 py-1.5 flex items-end gap-1.5 border border-transparent focus-within:border-[#F5B838]/40 transition-all min-h-[44px]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              disabled={isTyping || cooldownTime > 0}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isTyping && cooldownTime === 0) {
                    handleSend();
                  }
                }
              }}
              placeholder={
                cooldownTime > 0
                  ? `Tunggu ${cooldownTime}s...`
                  : !quotaInfo.isPaid && quotaInfo.remaining <= 0
                  ? "Kuota habis. Masukkan kode VIP..."
                  : (dict.messagePlaceholder || "Message")
              }
              className="w-full bg-transparent text-[14px] text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 resize-none outline-none leading-relaxed py-1 max-h-[130px] scrollbar-thin disabled:opacity-50"
            />

            {/* Tombol Attachment (Gambar & Tambah) */}
            <div className="flex items-center gap-1 pb-1 text-neutral-500 dark:text-[#8A8A93] shrink-0">
              <ChatImagePicker
                onImageSelected={handleImageSelected}
                disabled={isTyping}
                isPreparing={isPreparingImage}
                hasAttachment={!!attachedImage}
                dict={dict}
                onHaptic={() => haptics.light(settings.hapticFeedback !== false)}
              />

              <button
                type="button"
                onClick={() => {
                  haptics.light(settings.hapticFeedback !== false);
                  setShowInputMenu((v) => !v);
                }}
                className={`p-1 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                  showInputMenu
                    ? "text-[#F5B838]"
                    : "hover:text-neutral-800 dark:hover:text-white"
                }`}
                title="Menu Opsi Chat"
                aria-label="Menu Opsi Chat"
              >
                <Plus size={20} className={showInputMenu ? "rotate-45 transition-transform" : "transition-transform"} />
              </button>
            </div>
          </div>

          {/* Tombol Send / Voice Action */}
          <button
            type="button"
            disabled={isTyping || isPreparingImage || isPreparingAudio || cooldownTime > 0}
            onClick={() => {
              // Ada teks atau lampiran → kirim. Kosong → mulai merekam.
              if (inputText.trim() || attachedImage) {
                if (cooldownTime === 0) handleSend();
                return;
              }
              if (!isRecordingSupported()) {
                setErrorNotice(
                  "Browser ini tidak mendukung perekaman suara. Coba ketik pesanmu."
                );
                return;
              }
              setIsRecording(true);
            }}
            style={{
              backgroundColor: isPreparingAudio ? undefined : moodTheme.accentColor,
            }}
            className={`w-11 h-11 rounded-full text-neutral-950 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPreparingAudio || cooldownTime > 0
                ? "bg-neutral-300 dark:bg-white/20"
                : "hover:brightness-95"
            }`}
            title={
              inputText.trim() || attachedImage
                ? "Kirim Pesan"
                : isPreparingAudio
                ? "Memproses suara..."
                : "Rekam Pesan Suara"
            }
            aria-label={inputText.trim() || attachedImage ? "Kirim Pesan" : "Rekam Suara"}
          >
            {inputText.trim() || attachedImage ? (
              <Send size={18} className="translate-x-0.5" />
            ) : (
              <Mic
                size={19}
                className={isPreparingAudio ? "animate-pulse" : ""}
              />
            )}
          </button>
        </div>
      </footer>

      {/* Floating Jump to Bottom Button (WhatsApp style) */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="fixed sm:absolute right-4 bottom-20 z-30 w-10 h-10 rounded-full bg-white dark:bg-[#1E1F25] text-neutral-700 dark:text-[#C9CAD1] shadow-lg border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all animate-fade-in cursor-pointer"
          aria-label="Ke pesan terbaru"
          title="Ke pesan terbaru"
        >
          <ChevronDown size={20} />
        </button>
      )}

      {/* Character Profile / Detail View Modal Matching Screen 1 */}
      {showDetailSheet && (
        <CharacterDetailSheet
          character={character}
          chat={chat}
          onClose={() => setShowDetailSheet(false)}
          onStartChat={() => setShowDetailSheet(false)}
          onOpenMoodStats={() => {
            setShowDetailSheet(false);
            setShowMoodStatsModal(true);
          }}
          onEditCharacter={() => {
            setShowDetailSheet(false);
            onEditCharacter(character);
          }}
        />
      )}

      {/* Mood Trends Modal */}
      {showMoodStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16171B] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                Statistik Mood {character.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowMoodStatsModal(false)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-600 dark:text-[#9B9BA3] flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <MoodTrendsChart chat={chat} character={character} />
            <button
              type="button"
              onClick={() => setShowMoodStatsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#F5B838] hover:bg-[#E5A929] font-bold text-neutral-950 text-xs shadow-xs cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Tasks Modal */}
      <ScheduledTasksModal
        isOpen={showScheduledTasksModal}
        onClose={() => setShowScheduledTasksModal(false)}
        character={character}
      />

      {/* Custom Instructions Modal */}
      {showCustomInstructions && (
        <CustomInstructionsModal
          isOpen={showCustomInstructions}
          onClose={() => setShowCustomInstructions(false)}
          characterName={character.name}
          initialInstructions={character.customInstructions || ""}
          onSave={(updatedInstructions) => {
            const updated = {
              ...character,
              customInstructions: updatedInstructions,
            };
            onUpdateCharacter(updated);
            setSuccessNotice("Instruksi karakter berhasil diperbarui!");
            setTimeout(() => setSuccessNotice(null), 2500);
          }}
        />
      )}

      {/* Date Search Modal - Minimalist, NO emojis */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16171B] rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                Cari Berdasarkan Tanggal
              </h3>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-600 dark:text-[#9B9BA3] flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 dark:text-[#8A8A93] mb-1.5 block">
                Pilih Tanggal Percakapan
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                id="search-date-input"
                className="w-full bg-[#F0F1F5] dark:bg-white/[0.08] text-neutral-900 dark:text-[#F2F3F7] rounded-xl px-3 py-2 text-sm border border-transparent focus:border-[#F5B838] outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] font-semibold text-neutral-700 dark:text-[#C9CAD1] text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("search-date-input") as HTMLInputElement | null;
                  if (input && input.value) {
                    handleJumpToDate(input.value);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-[#F5B838] hover:bg-[#E5A929] font-bold text-neutral-950 text-xs shadow-xs cursor-pointer transition-colors"
              >
                Cari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota & Account Tier Activation Modal */}
      <QuotaModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        language={settings.language || "id"}
        reason={quotaModalReason}
      />
    </div>
  );
};
