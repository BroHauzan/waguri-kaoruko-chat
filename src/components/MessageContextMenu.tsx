import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Copy, Play, Edit3, Trash2, Check, X } from "lucide-react";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

interface MessageContextMenuProps {
  /** Teks pesan yang sedang dipilih, dipakai untuk preview mengambang. */
  text: string;
  hasImage: boolean;
  imageUrl?: string;
  isUser: boolean;
  /** Posisi bubble di layar, untuk menempatkan preview persis di atasnya. */
  anchorRect: { top: number; left: number; width: number; height: number };
  actions: ContextMenuAction[];
  /** Emoji reaksi cepat, ditiru dari baris reaksi WhatsApp. */
  quickReactions?: string[];
  onReact?: (emoji: string) => void;
  /** Warna latar bubble user (mengikuti mood theme dinamis). */
  userBubbleBg?: string;
  hideOriginalBubble: boolean;
  onClose: () => void;
}

/**
 * Menu konteks pesan bergaya WhatsApp iOS.
 *
 * Alur visualnya: seluruh layar diburamkan dan digelapkan, lalu bubble pesan
 * yang dipilih "terangkat" ke atas lapisan blur dengan posisi yang sama persis
 * seperti aslinya, baru diikuti deretan aksi.
 *
 * Bubble asli di belakangnya disembunyikan (bukan dipindah) supaya tidak ada
 * dua salinan yang terlihat; preview di sini menggantikannya.
 */
export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  text,
  hasImage,
  imageUrl,
  isUser,
  anchorRect,
  actions,
  quickReactions,
  onReact,
  userBubbleBg,
  hideOriginalBubble,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  // Ukur tinggi menu supaya preview bisa diposisikan tepat di atasnya dan
  // tidak pernah keluar dari layar.
  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Kunci scroll latar selama menu terbuka.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape menutup menu — kebiasaan desktop, murah untuk ditambahkan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const BUBBLE_GAP = 12;
  const EDGE_PADDING = 16;
  const VIEWPORT_WIDTH =
    typeof window !== "undefined" ? window.innerWidth : 390;

  // Preview bubble hanya dirender kalau pemanggil bilang bubble asli
  // disembunyikan. Kalau tidak, bubble asli tetap terlihat di belakang blur
  // dan tidak boleh ada salinan.
  const showBubble = hideOriginalBubble;

  const bubbleWidth = Math.min(
    anchorRect.width,
    VIEWPORT_WIDTH - EDGE_PADDING * 2
  );

  // Preview ditaruh di posisi aslinya. Kalau mepet atas atau tidak cukup ruang
  // untuk menu di bawahnya, geser ke atas supaya keduanya tetap muat.
  const spaceForMenu = menuHeight + BUBBLE_GAP + EDGE_PADDING;
  const minBubbleTop = EDGE_PADDING + 8;
  const maxBubbleTop = Math.max(
    minBubbleTop,
    viewportHeight - spaceForMenu - Math.max(anchorRect.height, 44)
  );

  const bubbleTop = Math.max(
    minBubbleTop,
    Math.min(anchorRect.top, maxBubbleTop)
  );

  // Menu selalu di bawah preview kalau ada ruang; kalau tidak, ia naik
  // menempel ke bawah preview yang sudah digeser.
  const menuTop = showBubble
    ? Math.min(
        bubbleTop + Math.max(anchorRect.height, 44) + BUBBLE_GAP,
        viewportHeight - menuHeight - EDGE_PADDING
      )
    : Math.max(
        EDGE_PADDING,
        Math.min(
          anchorRect.top + anchorRect.height + BUBBLE_GAP,
          viewportHeight - menuHeight - EDGE_PADDING
        )
      );

  const bubbleLeft = Math.max(
    EDGE_PADDING,
    Math.min(anchorRect.left, VIEWPORT_WIDTH - bubbleWidth - EDGE_PADDING)
  );

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
        {/* Latar: gelap + blur, meniru dimming WhatsApp */}
        <div
          className="absolute inset-0 bg-black/45 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bubble yang "terangkat" — posisinya sama dengan aslinya.
            Hanya dirender kalau bubble asli disembunyikan. */}
        {showBubble && (
          <motion.div
            initial={{ scale: 1, y: 0 }}
            animate={{ scale: 1.04, y: -2 }}
            exit={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.32 }}
            style={{
              position: "fixed",
              top: bubbleTop,
              left: bubbleLeft,
              width: bubbleWidth,
              transformOrigin: isUser ? "bottom right" : "bottom left",
            }}
            className={`px-4 py-3 rounded-[20px] shadow-2xl pointer-events-none ${
              isUser
                ? `${userBubbleBg || "bg-[#F5B838] text-neutral-900"} rounded-tr-[4px]`
                : "bg-white dark:bg-[#1F2025] text-neutral-900 dark:text-[#F2F3F7] rounded-tl-[4px]"
            }`}
          >
            {hasImage && imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className={`rounded-[14px] object-cover max-h-56 w-full ${
                  text && text !== "[Foto]" ? "mb-2" : ""
                }`}
              />
            )}
            {text && text !== "[Foto]" && (
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                {text}
              </p>
            )}
          </motion.div>
        )}

        {/* Panel aksi */}
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          style={{
            position: "fixed",
            top: menuTop,
            left: bubbleLeft,
            width: bubbleWidth,
            transformOrigin: isUser ? "top right" : "top left",
          }}
          className="bg-white/95 dark:bg-[#1C1D22]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
        >
          {/* Baris reaksi cepat, seperti WhatsApp */}
          {quickReactions && quickReactions.length > 0 && onReact && (
            <div className="flex items-center justify-around px-1.5 py-2 border-b border-black/5 dark:border-white/10">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[21px] hover:bg-black/5 dark:hover:bg-white/[0.1] active:scale-90 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Daftar aksi */}
          <div className="flex flex-col py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onSelect}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-[14px] font-medium transition-colors cursor-pointer ${
                  action.danger
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    : "text-neutral-800 dark:text-[#E4E5EA] hover:bg-black/5 dark:hover:bg-white/[0.08]"
                }`}
              >
                <span className="shrink-0">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
    </motion.div>
  );
};
