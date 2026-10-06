import React, { useState } from "react";
import { Check, ChevronLeft, Camera, Plus } from "lucide-react";
import { Character, CharacterCategory } from "../types";
import { PRESET_AVATARS } from "../lib/storage";

interface CharacterFormProps {
  initialCharacter?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
}

const PERSONALITY_TAGS = [
  "Ceria",
  "Tsundere",
  "Perhatian",
  "Humoris",
  "Manja",
  "Kalem",
];

const STYLE_TAGS = [
  "Santai & Akrab",
  "Banyak Emoji ✨",
  "Lembut & Manis",
  "Singkat & Cuek",
];

export const CharacterForm: React.FC<CharacterFormProps> = ({
  initialCharacter,
  onSave,
  onCancel,
}) => {
  const isEditing = !!initialCharacter;

  const [name, setName] = useState(initialCharacter?.name || "");
  const [nameError, setNameError] = useState("");
  const [bio, setBio] = useState(initialCharacter?.tagline || "");
  const [personality, setPersonality] = useState(initialCharacter?.personality || "");
  const [speakingStyle, setSpeakingStyle] = useState(initialCharacter?.speakingStyle || "");
  const [firstMsg, setFirstMsg] = useState(initialCharacter?.greeting || "");
  const [avatarUrl, setAvatarUrl] = useState(
    initialCharacter?.avatarUrl || PRESET_AVATARS[1]?.url || PRESET_AVATARS[0].url
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const toggleTag = (
    currentText: string,
    setter: (val: string) => void,
    tag: string
  ) => {
    if (!currentText.trim()) {
      setter(tag);
      return;
    }
    const tags = currentText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.includes(tag)) {
      setter(tags.filter((t) => t !== tag).join(", "));
    } else {
      setter([...tags, tag].join(", "));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Nama karakter wajib diisi");
      return;
    }
    setNameError("");

    const newChar: Character = {
      id: initialCharacter?.id || `char_${Date.now()}`,
      name: name.trim(),
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0].url,
      tagline: bio.trim() || "Teman yang perhatian dan asik diajak ngobrol",
      category: (initialCharacter?.category as CharacterCategory) || "Santai",
      personality: personality.trim() || "Ramah, ceria, perhatian",
      speakingStyle: speakingStyle.trim() || "Santai sehari-hari",
      backstory: initialCharacter?.backstory || "Sahabat dekat yang selalu ada waktu untukmu",
      relationship: initialCharacter?.relationship || "Teman dekat",
      greeting: firstMsg.trim() || "Hai! Lagi apa kamu sekarang? Kangen nih ngobrol.",
      exampleDialogues: initialCharacter?.exampleDialogues || [],
      defaultMood: initialCharacter?.defaultMood || "happy",
      customInstructions: initialCharacter?.customInstructions || "",
      createdAt: initialCharacter?.createdAt || Date.now(),
    };

    setIsSaved(true);
    setTimeout(() => {
      onSave(newChar);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-36 sm:pb-40 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Header Ringkas */}
      <header className="w-full px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            type="button"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-800 dark:text-[#E4E5EA] active:scale-95 transition-all cursor-pointer mr-1"
            title="Kembali"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[19px] font-bold tracking-tight text-neutral-900 dark:text-[#F2F3F7]">
            {isEditing ? "Edit Karakter" : "Buat Karakter"}
          </h1>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="text-sm font-medium text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          Batal
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col px-5 pt-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Section Ringkas */}
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col items-center">
            <div
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#F5B838] shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={20} />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#F5B838] text-neutral-950 flex items-center justify-center shadow-xs">
                <Camera size={13} />
              </div>
            </div>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="w-full mt-3 pt-3 border-t border-neutral-100 dark:border-white/10 flex flex-col gap-2.5 animate-fade-in">
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(p.url);
                        setShowAvatarPicker(false);
                      }}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer mx-auto ${
                        avatarUrl === p.url
                          ? "border-[#F5B838] scale-105"
                          : "border-neutral-200 dark:border-white/15"
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="URL gambar kustom..."
                    className="flex-1 bg-[#F0F1F5] dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-xl px-3 py-2 border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setAvatarUrl(customAvatarInput.trim());
                        setCustomAvatarInput("");
                        setShowAvatarPicker(false);
                      }
                    }}
                    className="px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Pakai
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields Card */}
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-4">
            {/* Nama */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Nama Karakter
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Contoh: Waguri Kaoruko"
                required
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-3 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
              {nameError && (
                <span className="text-xs font-semibold text-red-500 mt-0.5">{nameError}</span>
              )}
            </div>

            {/* Tagline / Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Bio Singkat
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Teman sekelas yang diam-diam perhatian"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-3 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
            </div>

            {/* Kepribadian */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Kepribadian
              </label>

              {/* Chips Sederhana */}
              <div className="flex flex-wrap gap-1.5">
                {PERSONALITY_TAGS.map((tag) => {
                  const isSelected = personality
                    .split(",")
                    .map((t) => t.trim())
                    .includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(personality, setPersonality, tag)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#F5B838] text-neutral-950 font-semibold shadow-2xs"
                          : "bg-[#F0F1F5] dark:bg-white/[0.06] text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={2}
                placeholder="Contoh: Ceria, sedikit tsundere tapi perhatian..."
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl p-3.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 resize-none"
              />
            </div>

            {/* Gaya Bicara */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Gaya Bicara
              </label>

              {/* Chips Sederhana */}
              <div className="flex flex-wrap gap-1.5">
                {STYLE_TAGS.map((tag) => {
                  const isSelected = speakingStyle
                    .split(",")
                    .map((t) => t.trim())
                    .includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(speakingStyle, setSpeakingStyle, tag)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#F5B838] text-neutral-950 font-semibold shadow-2xs"
                          : "bg-[#F0F1F5] dark:bg-white/[0.06] text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                placeholder="Contoh: Santai dan akrab, suka pakai emoji ✨"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-3 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
            </div>

            {/* Pesan Sapaan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Pesan Sapaan Pertama
              </label>
              <textarea
                value={firstMsg}
                onChange={(e) => setFirstMsg(e.target.value)}
                rows={2}
                placeholder="Contoh: Hai! Lagi apa sekarang? Kangen deh ngobrol :)"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl p-3.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1 pb-4">
            <button
              type="submit"
              disabled={isSaved}
              className="w-full py-3.5 rounded-full bg-[#F5B838] hover:bg-[#E5A929] active:scale-98 text-neutral-950 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <Check size={18} />
                  <span>Disimpan!</span>
                </>
              ) : (
                <>
                  {isEditing ? <Check size={18} /> : <Plus size={18} />}
                  <span>{isEditing ? "Simpan Perubahan" : "Simpan & Mulai Chat"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
