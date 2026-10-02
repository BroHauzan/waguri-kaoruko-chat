import React, { useState, useMemo } from "react";
import { Search, Plus, Sparkles, MessageSquare, ChevronRight, Edit3 } from "lucide-react";
import { Character, CharacterCategory, Chat } from "../types";
import { getMoodMeta } from "../lib/moodConfig";

interface HomeScreenProps {
  userName: string;
  characters: Character[];
  chats: Record<string, Chat>;
  onSelectCharacter: (char: Character) => void;
  onCreateCharacter: () => void;
  onEditCharacter: (char: Character) => void;
}

const CATEGORIES: CharacterCategory[] = ["Semua", "Santai", "Roleplay", "Curhat", "Lucu"];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  characters,
  chats,
  onSelectCharacter,
  onCreateCharacter,
  onEditCharacter,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategory>("Semua");

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const matchQuery =
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.personality.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "Semua" || char.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [characters, searchQuery, selectedCategory]);

  return (
    <div className="min-h-full pb-28 pt-4 px-4 flex flex-col">
      {/* Top Header & Greeting */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-white/55 font-medium tracking-wide uppercase">
            <Sparkles size={13} className="text-[#F0A869]" />
            <span>AI Character Chat</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/95 mt-0.5">
            Yo, <span className="bg-gradient-to-r from-[#8B7CF6] via-white to-[#F0A869] bg-clip-text text-transparent">{userName || "Temen"}</span> 👋
          </h1>
        </div>
        <button
          onClick={onCreateCharacter}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.18] backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] group active:scale-95"
          title="Bikin Karakter Baru"
        >
          <Plus size={20} className="text-white/80 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Glass Search Bar */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari karakter, kepribadian, gaya ngomong..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/[0.16] focus:border-[#8B7CF6]/60 rounded-full text-white/90 placeholder-white/40 text-sm backdrop-blur-xl outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs bg-white/10 rounded-full px-2 py-0.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontal Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4 -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? "bg-gradient-to-r from-[#8B7CF6]/80 to-[#F0A869]/80 border-white/40 text-[#14111F] font-bold shadow-[0_4px_16px_rgba(139,124,246,0.3)] scale-[1.02]"
                  : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.14] text-white/70"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Character Cards List */}
      <div className="space-y-3 flex-1">
        {filteredCharacters.length === 0 ? (
          <div className="bg-white/[0.05] border border-white/[0.12] rounded-[28px] p-8 text-center backdrop-blur-xl my-6">
            <p className="text-white/60 text-sm mb-3">Tidak ada karakter yang cocok dengan pencarian.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs text-white/80 hover:bg-white/15 transition-all"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredCharacters.map((char) => {
            const chat = chats[char.id];
            const currentEmotion = chat?.currentMood?.emotion || char.defaultMood || "neutral";
            const mood = getMoodMeta(currentEmotion);
            const messageCount = chat?.messages?.length || 0;

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="group relative bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.16] hover:border-white/[0.28] backdrop-blur-2xl rounded-[28px] p-3.5 transition-all duration-200 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(107,91,210,0.2)] active:scale-[0.99] flex items-center gap-3.5"
              >
                {/* 3D Avatar with Mood Dot */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/25 shadow-md bg-purple-950/40">
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  {/* Mood Glowing Dot */}
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[12px] bg-[#1a162b] border border-white/30 shadow-lg"
                    title={`Mood: ${mood.label}`}
                    style={{
                      boxShadow: `0 0 10px ${mood.glowColor}`,
                    }}
                  >
                    <span>{mood.emoji}</span>
                  </div>
                </div>

                {/* Character Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white/95 truncate tracking-tight group-hover:text-white">
                        {char.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-white/60">
                        {char.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCharacter(char);
                        }}
                        className="p-1.5 rounded-full hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors"
                        title="Edit Karakter"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/65 line-clamp-1 mt-0.5 leading-relaxed">
                    {char.tagline}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {/* Small mood badge */}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${mood.badgeStyle}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {mood.label}
                    </span>

                    {messageCount > 0 && (
                      <span className="text-[10px] text-white/45 flex items-center gap-1">
                        <MessageSquare size={10} />
                        {messageCount} pesan
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Arrow */}
                <div className="shrink-0 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Gradient "+ Bikin Karakter" Pill Button */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
        <button
          onClick={onCreateCharacter}
          className="pointer-events-auto w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#8B7CF6] via-white to-[#F0A869] text-[#14111F] font-bold text-sm shadow-[0_10px_30px_rgba(139,124,246,0.4)] hover:shadow-[0_12px_36px_rgba(240,168,105,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Bikin Karakter Baru</span>
        </button>
      </div>
    </div>
  );
};
