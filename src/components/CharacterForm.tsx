import React, { useState } from "react";
import { Check, ChevronLeft, Camera, Sparkles } from "lucide-react";
import { Character, CharacterCategory } from "../types";
import { PRESET_AVATARS } from "../lib/storage";

interface CharacterFormProps {
  initialCharacter?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({
  initialCharacter,
  onSave,
  onCancel,
}) => {
  const isEditing = !!initialCharacter;

  const [name, setName] = useState(initialCharacter?.name || "");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama karakter wajib diisi!");
      return;
    }

    const newChar: Character = {
      id: initialCharacter?.id || `char_${Date.now()}`,
      name: name.trim(),
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0].url,
      tagline: bio.trim() || "Teman yang perhatian dan asik diajak ngobrol",
      category: (initialCharacter?.category as CharacterCategory) || "Santai",
      personality: personality.trim() || "Ramah, ceria, perhatian, kadang menggoda",
      speakingStyle: speakingStyle.trim() || "Bahasa santai sehari-hari, ekspresif",
      backstory: initialCharacter?.backstory || "Sahabat dekat yang selalu ada waktu untukmu",
      relationship: initialCharacter?.relationship || "Teman dekat",
      greeting: firstMsg.trim() || "Hai! Lagi apa kamu? Kangen nih ngobrol sama kamu.",
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
    <div className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-32 bg-[#F4F5F7] dark:bg-[#0B0C0F]">
      {/* Top Header */}
      <header className="w-full px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            type="button"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-800 dark:text-[#E4E5EA] active:scale-95 transition-all cursor-pointer mr-1"
            title="Kembali"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-neutral-900 dark:text-[#F2F3F7]">
            {isEditing ? "Edit Karakter" : "Buat Karakter"}
          </h1>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="text-[14px] text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          Batal
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col px-5 pt-1">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-xs flex flex-col items-center justify-center">
            <div
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#F5B838] shadow-sm cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={20} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="mt-2 text-xs font-semibold text-[#E5A929] hover:underline cursor-pointer"
            >
              Ubah Foto Karakter
            </button>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="w-full mt-4 pt-3 border-t border-neutral-100 dark:border-white/10 flex flex-col gap-3 animate-fade-in">
                <span className="text-xs font-medium text-neutral-500 dark:text-[#8A8A93]">
                  Pilih Preset Avatar:
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(p.url);
                        setShowAvatarPicker(false);
                      }}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
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
                    placeholder="Atau tempel URL gambar..."
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
                    className="px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
                  >
                    Gunakan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields Card */}
          <div className="bg-white dark:bg-[#16171B] rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-4">
            {/* Nama */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
                Nama Karakter
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Waguri Kaoruko, Olivia..."
                required
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-3 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
            </div>

            {/* Tagline / Bio Singkat */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
                Tagline / Bio Singkat
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
                Kepribadian
              </label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={2}
                placeholder="Contoh: Ramah, suka ngambek lucu, ekspresif..."
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl p-4 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 resize-none"
              />
            </div>

            {/* Gaya Bicara */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
                Gaya Bicara
              </label>
              <input
                type="text"
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                placeholder="Contoh: Santai bahasa gaul, sering pakai emoji hehe"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-3 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
            </div>

            {/* Sapaan Pertama */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
                Pesan Sapaan Pertama
              </label>
              <textarea
                value={firstMsg}
                onChange={(e) => setFirstMsg(e.target.value)}
                rows={2}
                placeholder="Contoh: lagi apa kamu? udah makan belum? :)"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl p-4 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50 resize-none"
              />
            </div>
          </div>

          {/* Submit Button in Warm Amber Yellow */}
          <button
            type="submit"
            disabled={isSaved}
            className="w-full py-4 rounded-full bg-[#F5B838] hover:bg-[#E5A929] active:scale-98 text-neutral-950 font-bold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check size={18} />
                <span>Berhasil Disimpan!</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{isEditing ? "Simpan Perubahan" : "Simpan & Mulai Chat"}</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
