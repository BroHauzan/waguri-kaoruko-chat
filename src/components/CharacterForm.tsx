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

export const MAIN_SKILL_SPEAKING_STYLE =
  "Gaya chat santai sahabat dekat ala WhatsApp/LINE, seluruh pesan huruf kecil tanpa kapital awal, tanpa tanda titik di akhir kalimat, dilarang tanda seru, panggilan selalu aku-kamu, sering selipkan vokal panjang (iyaaa, bangett, okeyyy, belumm) dan partikel santai (ihhh, sihh, donggg, hehehe), diksi santai (nggak/engga, udah, lagi, bikin, gimana, kenapa)";

const STYLE_TAGS = [
  "Sahabat Santai (aku-kamu)",
  "Huruf Kecil & Tanpa Titik",
  "Vokal Panjang (iyaaa/bangett)",
  "Partikel Chat (ihhh/donggg/hehehe)",
  "Hangat & Pengertian",
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
  const [speakingStyle, setSpeakingStyle] = useState(
    initialCharacter?.speakingStyle || MAIN_SKILL_SPEAKING_STYLE
  );
  const [backstory, setBackstory] = useState(initialCharacter?.backstory || "");
  const [firstMsg, setFirstMsg] = useState(
    initialCharacter?.greeting || "eh kamu lagi santai engga, lagi ngapain nih hehehe"
  );
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

      // Hanya ambil API key jika provider bertipe 'gemini' (jangan gunakan key dari Nara Router / OpenAI / sk-...)
      let geminiApiKey = "";
      if (activeProvider.type === "gemini" && activeProvider.apiKey?.trim()) {
        geminiApiKey = activeProvider.apiKey.trim();
      } else {
        const foundGemini = settings.providers?.find(
          (p) => p.type === "gemini" && p.apiKey?.trim()
        );
        if (foundGemini?.apiKey?.trim()) {
          geminiApiKey = foundGemini.apiKey.trim();
        }
      }

      // Pastikan bukan token sk- (misal jika user salah input key OpenAI/Nara di kolom Gemini)
      if (geminiApiKey.startsWith("sk-")) {
        geminiApiKey = "";
      }

      const lore = await fetchCharacterLore(name.trim(), geminiApiKey);

      if (lore) {
        if (lore.name) setName(lore.name);
        if (lore.tagline) setBio(lore.tagline);
        if (lore.personality) setPersonality(lore.personality);
        if (lore.speechStyle) {
          let formattedStyle = lore.speechStyle.trim();
          if (
            !formattedStyle.toLowerCase().includes("tanpa titik") ||
            !formattedStyle.toLowerCase().includes("huruf kecil")
          ) {
            formattedStyle = `${formattedStyle}. Gaya chat santai sahabat dekat ala WhatsApp/LINE, seluruh pesan huruf kecil tanpa kapital awal, tanpa tanda titik di akhir kalimat, dilarang tanda seru, panggilan selalu aku-kamu, sering selipkan vokal panjang (iyaaa, bangett, okeyyy, belumm) dan partikel santai (ihhh, sihh, donggg, hehehe), diksi santai (nggak/engga, udah, lagi, bikin, gimana, kenapa)`;
          }
          setSpeakingStyle(formattedStyle);
        }
        if (lore.firstMessage) {
          let cleanFirstMsg = lore.firstMessage
            .replace(/!+/g, "")
            .replace(/\.+$/g, "")
            .trim();
          if (cleanFirstMsg) {
            cleanFirstMsg = cleanFirstMsg.charAt(0).toLowerCase() + cleanFirstMsg.slice(1);
          }
          setFirstMsg(cleanFirstMsg);
        }

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
      let errorMsg = err?.message || "Gagal mengambil data dari internet. Coba periksa koneksi atau API key.";
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        // bukan JSON string
      }
      if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID")) {
        errorMsg = "API Key Gemini tidak valid. Silakan cek API key di Pengaturan > Provider AI atau gunakan setelan server.";
      }
      setLoreNotice({
        type: "error",
        message: errorMsg,
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
      backstory: backstory.trim() || initialCharacter?.backstory || "Sahabat dekat yang selalu ada waktu untukmu",
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
    <div className="flex-1 flex flex-col relative z-10 w-full pt-safe pb-36 sm:pb-40 bg-[#F4F5F7] dark:bg-[#0D0F12] text-neutral-900 dark:text-neutral-200 transition-colors">
      {/* ========================================================
          1. STITCH CENTERED HEADER
          ======================================================== */}
      <header className="sticky top-0 z-30 bg-[#F4F5F7]/90 dark:bg-[#0D0F12]/90 backdrop-blur-md px-5 pt-4 pb-3 flex items-center justify-between border-b border-black/5 dark:border-white/[0.04] relative">
        <button
          onClick={onCancel}
          type="button"
          aria-label="Kembali"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white -ml-1 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Screen Title Centered */}
        <h1 className="absolute left-1/2 -translate-x-1/2 m-0 text-center text-[17px] font-bold text-neutral-900 dark:text-white pointer-events-none whitespace-nowrap">
          {isEditing ? "Edit Karakter" : "Buat Karakter"}
        </h1>

        {/* Right action items: Cancel */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            type="button"
            className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg"
          >
            Batal
          </button>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="px-5 pt-4 flex-1 flex flex-col space-y-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ========================================================
              2. AVATAR SECTION (Circular frame + camera badge)
              ======================================================== */}
          <section className="flex flex-col items-center justify-center pt-2 pb-1">
            <div
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#F5B838]/60 dark:ring-white/10 ring-offset-2 ring-offset-[#F4F5F7] dark:ring-offset-[#0D0F12] shadow-xl relative bg-neutral-200 dark:bg-neutral-900">
                <img
                  src={avatarUrl}
                  alt="Avatar Karakter"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Floating glass camera badge */}
              <div className="absolute bottom-0 right-0 bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/15 text-[#B45309] dark:text-[#F5B838] p-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center justify-center translate-x-1">
                <Camera size={14} />
              </div>
            </div>

            <p className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-400 tracking-wide font-normal">
              Ketuk untuk ganti foto profil
            </p>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="w-full max-w-sm mt-3 p-4 bg-white dark:bg-[#16171B] rounded-2xl border border-black/10 dark:border-white/10 shadow-lg flex flex-col gap-3 animate-fade-in">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Pilih Preset Avatar
                </span>
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
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-black/5 dark:border-white/10"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#F5B838]" />
                        <span>Mengompres foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-[#F5B838]" />
                        <span>Unggah Foto dari Galeri</span>
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
                    className="flex-1 bg-neutral-100 dark:bg-white/[0.06] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-xl px-3 py-2 border border-black/5 dark:border-white/10 focus:outline-none focus:border-[#F5B838]"
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
                    className="px-3.5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Pakai
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ========================================================
              3. EDITORIAL FORM FIELDS (Clean borders & uppercase labels)
              ======================================================== */}
          <section className="space-y-6">
            {/* Field: Nama Karakter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                  NAMA KARAKTER
                </label>
                <button
                  type="button"
                  disabled={isFetchingLore}
                  onClick={handleAutoFetchLore}
                  className="text-xs font-semibold text-[#B45309] dark:text-[#F5B838] hover:underline flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Cari profil, kepribadian, dan ciri fisik kanon dari internet"
                >
                  {isFetchingLore ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Mencari di Internet...</span>
                    </>
                  ) : (
                    <>
                      <span>✦</span>
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
                placeholder="Masukkan nama karakter..."
                required
                className="w-full bg-transparent px-0 py-2 text-[18px] font-semibold text-neutral-900 dark:text-white tracking-tight border-0 border-b border-black/10 dark:border-white/10 focus:ring-0 focus:border-[#F5B838] transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
              />
              {nameError && (
                <span className="text-xs font-semibold text-red-500 mt-0.5 block">{nameError}</span>
              )}
              {loreNotice && (
                <div
                  className={`text-xs px-3 py-2 rounded-xl mt-2 font-medium flex items-center justify-between animate-fade-in ${
                    loreNotice.type === "success"
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                  }`}
                >
                  <span>{loreNotice.message}</span>
                  <button
                    type="button"
                    onClick={() => setLoreNotice(null)}
                    className="opacity-70 hover:opacity-100 ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Field: Bio Singkat */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                BIO SINGKAT
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan bio singkat karakter..."
                rows={2}
                className="w-full bg-transparent px-0 py-1.5 text-sm text-neutral-800 dark:text-neutral-300 leading-relaxed border-0 border-b border-black/10 dark:border-white/10 focus:ring-0 focus:border-[#F5B838] transition-colors resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
              />
            </div>

            {/* Field: Kepribadian & Sifat */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                  KEPRIBADIAN &amp; SIFAT
                </label>
              </div>

              {/* Personality Tags Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
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
                          ? "bg-[#F5B838] text-neutral-950 font-bold shadow-xs"
                          : "bg-white dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-black/10 dark:border-white/10"
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
                placeholder="Tentukan kepribadian..."
                rows={3}
                className="w-full bg-transparent px-0 py-1.5 text-sm text-neutral-800 dark:text-neutral-300 leading-relaxed border-0 border-b border-black/10 dark:border-white/10 focus:ring-0 focus:border-[#F5B838] transition-colors resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
              />
            </div>

            {/* Field: Latar Belakang & Persona */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                  LATAR BELAKANG &amp; PERSONA
                </label>
              </div>
              <textarea
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                placeholder="Tuliskan kisah masa lalu, persona, dan latar belakang..."
                rows={4}
                className="w-full bg-transparent px-0 py-1.5 text-sm text-neutral-800 dark:text-neutral-300 leading-relaxed border-0 border-b border-black/10 dark:border-white/10 focus:ring-0 focus:border-[#F5B838] transition-colors resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
              />
            </div>
          </section>

          {/* ========================================================
              4. GAYA BICARA SECTION (With Style Chips & Greeting Preview)
              ======================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                GAYA BICARA
              </label>
            </div>

            {/* Stylized Rule Sheet Container */}
            <div className="bg-white dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-xs">
              {/* Chips Row */}
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
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#F5B838] text-neutral-950 font-bold"
                          : "bg-neutral-100 dark:bg-neutral-900/80 border border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
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
                rows={3}
                placeholder="Aturan gaya bicara: huruf kecil tanpa titik akhir, santai aku-kamu..."
                className="w-full bg-transparent text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed border-t border-black/5 dark:border-white/[0.05] pt-2.5 outline-none resize-none"
              />
            </div>

            {/* First Greeting Message */}
            <div className="pt-2 space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#F5B838]/90">
                PESAN SAPAAN PERTAMA
              </label>
              <textarea
                value={firstMsg}
                onChange={(e) => setFirstMsg(e.target.value)}
                rows={2}
                placeholder="eh kamu lagi santai engga, lagi ngapain nih hehehe"
                className="w-full bg-transparent px-0 py-1.5 text-sm text-neutral-800 dark:text-neutral-200 border-0 border-b border-black/10 dark:border-white/10 focus:ring-0 focus:border-[#F5B838] outline-none resize-none"
              />
            </div>
          </section>

          {/* ========================================================
              5. VISUAL PROFILE COLLAPSIBLE (Foto PAP)
              ======================================================== */}
          <section>
            <div className="bg-white dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-all shadow-xs">
              <div
                onClick={() => setShowVisualDetails((prev) => !prev)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <Camera size={18} className="text-[#F5B838] shrink-0" />
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Profil Visual &amp; Foto PAP
                    </h2>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Panduan fisik saat karakter mengirim foto
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#B45309] dark:text-[#F5B838] font-medium">
                    {hair || schoolUniform ? "Terkonfigurasi" : "Opsional"}
                  </span>
                  {showVisualDetails ? (
                    <ChevronUp size={16} className="text-neutral-400" />
                  ) : (
                    <ChevronDown size={16} className="text-neutral-400" />
                  )}
                </div>
              </div>

              {showVisualDetails && (
                <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Ciri Rambut (Hair)
                    </label>
                    <input
                      type="text"
                      value={hair}
                      onChange={(e) => setHair(e.target.value)}
                      placeholder="Contoh: dark wavy hair with gentle bangs, shoulder length"
                      className="w-full bg-neutral-100 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-200 outline-none focus:border-[#F5B838]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Ciri Mata (Eyes)
                    </label>
                    <input
                      type="text"
                      value={eyes}
                      onChange={(e) => setEyes(e.target.value)}
                      placeholder="Contoh: warm expressive amber brown eyes"
                      className="w-full bg-neutral-100 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-200 outline-none focus:border-[#F5B838]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Sekolah / Latar (School)
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Contoh: Kikyo Girls' High School"
                      className="w-full bg-neutral-100 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-200 outline-none focus:border-[#F5B838]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Seragam / Pakaian (Uniform)
                    </label>
                    <input
                      type="text"
                      value={schoolUniform}
                      onChange={(e) => setSchoolUniform(e.target.value)}
                      placeholder="Contoh: prestigious navy blazer with ribbon tie and pleated skirt"
                      className="w-full bg-neutral-100 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-200 outline-none focus:border-[#F5B838]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      Penampilan Umum (General Look)
                    </label>
                    <input
                      type="text"
                      value={generalLook}
                      onChange={(e) => setGeneralLook(e.target.value)}
                      placeholder="Contoh: petite stature with charming cute smile"
                      className="w-full bg-neutral-100 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-200 outline-none focus:border-[#F5B838]"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================
              6. PRIMARY ACTION BUTTON (Save / Start Chat)
              ======================================================== */}
          <section className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isSaved}
              className="w-full py-3.5 px-6 rounded-full bg-[#F5B838] hover:bg-[#E5A929] active:scale-[0.99] text-neutral-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <Check size={18} />
                  <span>Karakter Disimpan!</span>
                </>
              ) : (
                <>
                  {isEditing ? <Check size={18} /> : <Plus size={18} />}
                  <span>{isEditing ? "Simpan Perubahan" : "Simpan & Mulai Chat"}</span>
                </>
              )}
            </button>
          </section>
        </form>
      </main>
    </div>
  );
};

