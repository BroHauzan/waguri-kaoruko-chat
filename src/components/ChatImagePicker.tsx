import React, { useRef, useState, useEffect } from "react";
import { Image as ImageIcon, Camera } from "lucide-react";

interface ChatImagePickerProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
  isPreparing?: boolean;
  hasAttachment?: boolean;
  dict?: {
    photoAttachment?: string;
    takePhoto?: string;
    chooseFromGallery?: string;
  };
  onHaptic?: () => void;
}

export function ChatImagePicker({
  onImageSelected,
  disabled = false,
  isPreparing = false,
  hasAttachment = false,
  dict,
  onHaptic,
}: ChatImagePickerProps) {
  const [showMenu, setShowMenu] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Tutup menu saat menekan tombol Escape
  useEffect(() => {
    if (!showMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMenu]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      setShowMenu(false);
      // Reset value agar bisa memilih file yang sama jika diperlukan
      e.target.value = "";
    }
  };

  const handleToggleMenu = () => {
    if (disabled || isPreparing) return;
    onHaptic?.();
    setShowMenu((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* 1. Input Galeri Biasa */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 2. Input Kamera Langsung (HTML5 Media Capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Tombol Ikon Gambar di Bar Input */}
      <button
        type="button"
        disabled={disabled || isPreparing}
        onClick={handleToggleMenu}
        className={`p-1 rounded-full flex items-center justify-center active:scale-90 transition-all cursor-pointer disabled:opacity-50 ${
          hasAttachment
            ? "text-[#E5A929]"
            : "hover:text-neutral-800 dark:hover:text-white text-neutral-500 dark:text-[#8A8A93]"
        }`}
        title={
          isPreparing
            ? "Memuat gambar..."
            : dict?.photoAttachment || "Kirim foto"
        }
        aria-label={dict?.photoAttachment || "Kirim foto"}
        aria-expanded={showMenu}
      >
        <ImageIcon
          size={19}
          className={isPreparing ? "animate-pulse" : ""}
        />
      </button>

      {/* Pop-up Menu Pilihan (WhatsApp Style) */}
      {showMenu && (
        <>
          {/* Backdrop untuk menutup menu saat klik di luar */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowMenu(false)}
          />

          <div className="absolute bottom-10 right-0 bg-white dark:bg-[#222226] border border-black/10 dark:border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-50 min-w-[185px] animate-fade-in backdrop-blur-md">
            {/* Opsi 1: Kamera Langsung */}
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onHaptic?.();
                cameraInputRef.current?.click();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 dark:text-pink-400 flex items-center justify-center shrink-0">
                <Camera size={16} />
              </div>
              <div className="flex flex-col">
                <span>{dict?.takePhoto || "Ambil Foto"}</span>
                <span className="text-[10px] text-neutral-400 dark:text-zinc-400 font-normal">
                  Kamera Perangkat
                </span>
              </div>
            </button>

            {/* Opsi 2: Galeri Foto */}
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onHaptic?.();
                galleryInputRef.current?.click();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ImageIcon size={16} />
              </div>
              <div className="flex flex-col">
                <span>{dict?.chooseFromGallery || "Pilih dari Galeri"}</span>
                <span className="text-[10px] text-neutral-400 dark:text-zinc-400 font-normal">
                  Album & File
                </span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
