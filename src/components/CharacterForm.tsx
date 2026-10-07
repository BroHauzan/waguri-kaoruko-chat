import React, { useState, useRef } from "react";
import { Check, ChevronLeft, Camera, Plus, Upload, Loader2, Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Character, CharacterCategory, CharacterVisualProfile } from "../types";
import { PRESET_AVATARS, storage } from "../lib/storage";
import { compressAvatarImage } from "../lib/imageUtils";
import { fetchCharacterLore } from "../lib/loreService";
import { getActiveProvider } from "../lib/providers";

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
  "Ekspresif & Santai",
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
  const [hair, setHair] = useState(initialCharacter?.visualProfile?.hair || "");
  const [eyes, setEyes] = useState(initialCharacter?.visualProfile?.eyes || "");
  const [schoolName, setSchoolName] = useState(initialCharacter?.visualProfile?.schoolName || "");
  const [schoolUniform, setSchoolUniform] = useState(initialCharacter?.visualProfile?.schoolUniform || "");
  const [generalLook, setGeneralLook] = useState(initialCharacter?.visualProfile?.generalLook || "");
  const [isFetchingLore, setIsFetchingLore] = useState(false);
  const [loreNotice, setLoreNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showVisualDetails, setShowVisualDetails] = useState(Boolean(initialCharacter?.visualProfile));

  const [avatarUrl, setAvatarUrl] = useState(
    initialCharacter?.avatarUrl || PRESET_AVATARS[1]?.url || PRESET_AVATARS[0].url
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoFetchLore = async () => {
    if (!name.trim()) {
      setNameError("Ketik nama karakter terlebih dahulu sebelum mencari di internet.");
      return;
    }
    setNameError("");
    setIsFetchingLore(true);
    setLoreNotice(null);

    try {
      const settings = storage.getSettings();
      const activeProvider = getActiveProvider(settings);
      const apiKey = activeProvider.apiKey || settings.providers?.find((p) => p.apiKey)?.apiKey || "";

      const lore = await fetchCharacterLore(name.trim(), apiKey);

      if (lore) {
        if (lore.name) setName(lore.name);
        if (lore.tagline) setBio(lore.tagline);
        if (lore.personality) setPersonality(lore.personality);
        if (lore.speechStyle) setSpeakingStyle(lore.speechStyle);
        if (lore.firstMessage) setFirstMsg(lore.firstMessage);

        if (lore.visualProfile) {
          setHair(lore.visualProfile.hair || "");
          setEyes(lore.visualProfile.eyes || "");
          setSchoolName(lore.visualProfile.schoolName || "");
          setSchoolUniform(lore.visualProfile.schoolUniform || "");
          setGeneralLook(lore.visualProfile.generalLook || "");
          setShowVisualDetails(true);
        }

        setLoreNotice({
          type: "success",
          message: `Berhasil mengambil lore & ciri kanon untuk "${lore.name || name}"!`,
        });
        setTimeout(() => setLoreNotice(null), 5000);
      }
    } catch (err: any) {
      console.error("Auto fetch lore failed:", err);
      setLoreNotice({
        type: "error",
        message: err?.message || "Gagal mengambil data dari internet. Coba periksa koneksi atau API key.",
      });
      setTimeout(() => setLoreNotice(null), 6000);
    } finally {
      setIsFetchingLore(false);
    }
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setAvatarError(null);
      // Kompres otomatis gambar profil ke 400x400 JPEG ringan
      const compressedDataUrl = await compressAvatarImage(file, 400, 0.82);
      setAvatarUrl(compressedDataUrl);
      setShowAvatarPicker(false);
    } catch (err: any) {
      setAvatarError(err?.message || "Gagal mengompres gambar.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = "";
      }
    }
  };

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

    const visualProfile: CharacterVisualProfile | undefined =
      hair || eyes || schoolName || schoolUniform || generalLook
        ? {
            hair: hair.trim(),
            eyes: eyes.trim(),
            schoolName: schoolName.trim(),
            schoolUniform: schoolUniform.trim(),
            generalLook: generalLook.trim(),
          }
        : initialCharacter?.visualProfile;

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
      visualProfile,
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
            className="w-9 h-9 rounded-lg bg-white dark:bg-[#16171B] border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center text-neutral-800 dark:text-[#E4E5EA] active:scale-95 transition-all cursor-pointer mr-1"
            title="Kembali"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-[#F2F3F7]">
            {isEditing ? "Edit Karakter" : "Buat Karakter"}
          </h1>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="text-xs font-medium text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          Batal
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col px-5 pt-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-[#16171B] rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col items-center">
            <div
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={20} />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xs">
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
                          ? "border-amber-500 scale-105"
                          : "border-neutral-200 dark:border-white/15"
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Tombol Unggah Foto */}
                <div className="pt-1 flex flex-col gap-1.5">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-800 dark:text-[#E4E5EA] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-black/5 dark:border-white/10"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-amber-500" />
                        <span>Mengompres foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-amber-500" />
                        <span>Unggah Foto dari Perangkat</span>
                      </>
                    )}
                  </button>
                  {avatarError && (
                    <span className="text-[11px] text-red-500 font-medium text-center">
                      {avatarError}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="Atau masukkan URL gambar..."
                    className="flex-1 bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none"
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
                    className="px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Pakai
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields Card */}
          <div className="bg-white dark:bg-[#16171B] rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3.5">
            {/* Nama */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                  Nama Karakter
                </label>
                <button
                  type="button"
                  disabled={isFetchingLore}
                  onClick={handleAutoFetchLore}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  title="Cari profil, kepribadian, dan ciri fisik kanon dari internet"
                >
                  {isFetchingLore ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Mencari di Internet...</span>
                    </>
                  ) : (
                    <>
                      <Globe size={13} />
                      <span>Isi Otomatis</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Contoh: Waguri Kaoruko"
                required
                className="bg-neutral-100 dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3.5 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              {nameError && (
                <span className="text-xs font-semibold text-red-500 mt-0.5">{nameError}</span>
              )}
              {loreNotice && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg mt-1 font-medium flex items-center justify-between animate-fade-in ${
                    loreNotice.type === "success"
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                  }`}
                >
                  <span>{loreNotice.message}</span>
                  <button
                    type="button"
                    onClick={() => setLoreNotice(null)}
                    className="opacity-70 hover:opacity-100 ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Tagline / Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1]">
                Bio Singkat
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Contoh: Teman sekelas yang diam-diam perhatian..."
                className="bg-neutral-100 dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg p-3 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-y min-h-[52px] leading-relaxed"
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
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-neutral-950 font-semibold shadow-2xs"
                          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white border border-black/5 dark:border-white/5"
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
                className="bg-neutral-100 dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg p-3 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
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
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-neutral-950 font-semibold shadow-2xs"
                          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white border border-black/5 dark:border-white/5"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                rows={2}
                placeholder="Contoh: Santai dan akrab, suka bergurau..."
                className="bg-neutral-100 dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg p-3 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-y min-h-[52px] leading-relaxed"
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
                className="bg-neutral-100 dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg p-3 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              />
            </div>
          </div>

          {/* Profil Visual & Seragam Card */}
          <div className="bg-white dark:bg-[#16171B] rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowVisualDetails((prev) => !prev)}
              className="flex items-center justify-between w-full text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
                  <Camera size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-800 dark:text-[#E4E5EA]">
                      Profil Visual & Seragam
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      Foto PAP
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                    {hair || schoolUniform
                      ? "Ciri fisik sudah terisi"
                      : "Digunakan saat karakter mengirim foto di chat"}
                  </p>
                </div>
              </div>
              <div className="text-neutral-400 dark:text-[#71717A]">
                {showVisualDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {showVisualDetails && (
              <div className="pt-2 flex flex-col gap-3 border-t border-neutral-100 dark:border-white/5 animate-fade-in">
                {/* Rambut */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA]">
                    Ciri Rambut (Hair)
                  </label>
                  <input
                    type="text"
                    value={hair}
                    onChange={(e) => setHair(e.target.value)}
                    placeholder="Contoh: dark wavy hair with gentle bangs, shoulder length"
                    className="bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Mata */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA]">
                    Ciri Mata (Eyes)
                  </label>
                  <input
                    type="text"
                    value={eyes}
                    onChange={(e) => setEyes(e.target.value)}
                    placeholder="Contoh: warm expressive amber brown eyes"
                    className="bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Sekolah / Latar */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA]">
                    Sekolah / Organisasi (School / Setting)
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Contoh: Kikyo Girls' High School"
                    className="bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Seragam / Pakaian Khas */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA]">
                    Seragam / Pakaian Khas (Outfit / Uniform)
                  </label>
                  <input
                    type="text"
                    value={schoolUniform}
                    onChange={(e) => setSchoolUniform(e.target.value)}
                    placeholder="Contoh: prestigious navy blazer, ribbon tie, neat pleated skirt"
                    className="bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Ciri Khas Umum */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A1AA]">
                    Penampilan Umum (General Look)
                  </label>
                  <input
                    type="text"
                    value={generalLook}
                    onChange={(e) => setGeneralLook(e.target.value)}
                    placeholder="Contoh: petite, charming cute smile, gentle and expressive"
                    className="bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-1 pb-4">
            <button
              type="submit"
              disabled={isSaved}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-neutral-950 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
