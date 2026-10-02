import React, { useMemo, useState } from "react";
import { X, Search } from "lucide-react";

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

/** Kategori emoji, disusun manual supaya tidak perlu dependensi tambahan. */
const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "smileys",
    label: "Ekspresi",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "😐",
      "😑", "😶", "😏", "😒", "🙄", "😬", "😮", "😯", "😲", "🥺",
      "😢", "😭", "😤", "😠", "😡", "🤬", "😳", "🥵", "🥶", "😱",
      "😨", "😰", "😥", "😓", "🤯", "😴", "🥱", "😪", "😵", "🤢",
      "🤮", "🤧", "😷", "🤒", "🤕", "🥳", "🥴", "😵‍💫", "🤠", "🥸",
    ],
  },
  {
    id: "gestures",
    label: "Gestur",
    emojis: [
      "👍", "👎", "👌", "🤌", "✌️", "🤞", "🫰", "🤟", "🤘", "👏",
      "🙌", "👐", "🤲", "🙏", "💪", "🫶", "👋", "🤙", "✋", "🖐️",
      "👊", "✊", "🤛", "🤜", "👈", "👉", "👆", "👇", "☝️", "✍️",
      "🫵", "💅", "🤳", "👀", "👁️", "👅", "👄", "🫦", "🧠", "🫀",
    ],
  },
  {
    id: "hearts",
    label: "Hati",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
      "💋", "💌", "🫂", "👩‍❤️‍👨", "💐", "🌹", "🥀", "🌷", "🌸", "🌺",
    ],
  },
  {
    id: "animals",
    label: "Hewan",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧",
      "🐦", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝",
      "🦋", "🐌", "🐞", "🐢", "🐍", "🦕", "🦖", "🐙", "🦑", "🐬",
    ],
  },
  {
    id: "food",
    label: "Makanan",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
      "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠",
      "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞",
      "🧇", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙",
      "🍰", "🎂", "🧁", "🥧", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩",
      "☕", "🍵", "🧋", "🥤", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹",
    ],
  },
  {
    id: "activities",
    label: "Aktivitas",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🏓", "🏸", "🥅", "🏒", "🏑", "🥍", "🏏", "🥊", "🥋", "🎽",
      "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤼",
      "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽",
      "🚴", "🚵", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹",
      "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳",
    ],
  },
  {
    id: "symbols",
    label: "Simbol",
    emojis: [
      "✨", "⭐", "🌟", "💫", "⚡", "🔥", "💥", "💢", "💦", "💨",
      "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "👑", "💎",
      "🌈", "☀️", "🌤️", "⛅", "🌧️", "⛈️", "❄️", "☃️", "🌊", "🌙",
      "🌛", "🌜", "🌚", "🌝", "🪐", "🌠", "🌌", "⭕", "✅", "❌",
      "❗", "❓", "💯", "🔔", "🔕", "📌", "📍", "🔗", "📎", "✏️",
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onPick, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);

  const activeEmojis = useMemo(() => {
    const cat =
      EMOJI_CATEGORIES.find((c) => c.id === activeCategory) ||
      EMOJI_CATEGORIES[0];
    return cat.emojis;
  }, [activeCategory]);

  // Pencarian sederhana: filter berdasarkan nama kategori, karena emoji
  // tidak punya metadata kata kunci di sini.
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const flat = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    const matchedCats = EMOJI_CATEGORIES.filter((c) =>
      c.label.toLowerCase().includes(q)
    ).flatMap((c) => c.emojis);
    // Gabungkan hasil nama kategori dengan daftar penuh kalau tidak ada
    // yang cocok, supaya user tetap bisa memilih.
    return matchedCats.length > 0 ? matchedCats : flat;
  }, [query]);

  const shown = searchResults ?? activeEmojis;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto px-3 pb-3 animate-slide-up">
      <div className="bg-white dark:bg-[#16171B] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[52vh]">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-black/5 dark:border-white/10">
          <div className="flex-1 bg-[#F0F1F5] dark:bg-white/[0.06] rounded-full px-3 h-9 flex items-center gap-2">
            <Search size={15} className="text-neutral-400 dark:text-[#71717A] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kategori emoji..."
              className="bg-transparent w-full text-[13px] text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-600 dark:text-[#9B9BA3] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category tabs */}
        {!searchResults && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 py-2 shrink-0">
            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#F5B838] text-neutral-950"
                      : "bg-[#F0F1F5] dark:bg-white/[0.06] text-neutral-600 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
          <div className="grid grid-cols-8 gap-0.5">
            {shown.map((emoji, idx) => (
              <button
                key={`${emoji}_${idx}`}
                type="button"
                onClick={() => onPick(emoji)}
                className="aspect-square rounded-xl flex items-center justify-center text-[22px] hover:bg-black/5 dark:hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
