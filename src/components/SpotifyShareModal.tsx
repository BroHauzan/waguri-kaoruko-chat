import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Share2, Check, Sparkles, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Character } from "../types";
import { haptics } from "../lib/haptics";

interface SpotifyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
}

export const SpotifyShareModal: React.FC<SpotifyShareModalProps> = ({
  isOpen,
  onClose,
  character,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const websiteUrl = typeof window !== "undefined" ? window.location.origin : "https://waguri-kaoruko-ai.app";

  // Generate canvas representation
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGeneratingImage(true);

    const generateCard = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Spotify Card Canvas Ratio: 1080 x 1440 (3:4 High Quality)
        const width = 1080;
        const height = 1440;
        canvas.width = width;
        canvas.height = height;

        // Background dark gradient (Spotify Canvas mood)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#16171F");
        bgGrad.addColorStop(0.5, "#0D0E12");
        bgGrad.addColorStop(1, "#08090C");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Load Character Image
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // Fallback jika avatar gagal dimuat
            resolve(null);
          };
          img.src = character.avatarUrl;
        });

        // 1. Draw Big Character Artwork Card (with rounded corners)
        const imgX = 80;
        const imgY = 160;
        const imgW = width - 160;
        const imgH = 760;
        const radius = 40;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, radius);
        ctx.clip();

        if (img.complete && img.naturalWidth > 0) {
          // Cover sizing
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const targetAspect = imgW / imgH;
          let renderW = imgW;
          let renderH = imgH;
          let renderX = imgX;
          let renderY = imgY;

          if (imgAspect > targetAspect) {
            renderW = imgH * imgAspect;
            renderX = imgX - (renderW - imgW) / 2;
          } else {
            renderH = imgW / imgAspect;
            renderY = imgY - (renderH - imgH) / 2;
          }

          ctx.drawImage(img, renderX, renderY, renderW, renderH);
        } else {
          // Fallback pattern
          ctx.fillStyle = "#22242C";
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }

        // Inner bottom shadow on artwork
        const innerGrad = ctx.createLinearGradient(0, imgY + imgH - 300, 0, imgY + imgH);
        innerGrad.addColorStop(0, "rgba(0,0,0,0)");
        innerGrad.addColorStop(1, "rgba(8,9,12,0.85)");
        ctx.fillStyle = innerGrad;
        ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.restore();

        // 2. Top Header Brand Bar
        ctx.fillStyle = "#F5B838";
        ctx.beginPath();
        ctx.arc(104, 96, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#F2F3F7";
        ctx.fillText("WAGURI KAORUKO AI", 130, 106);

        ctx.font = "normal 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#8E909B";
        ctx.textAlign = "right";
        ctx.fillText("Interactive Character", width - 80, 106);
        ctx.textAlign = "left";

        // 3. Bottom Editorial Lyric/Quote Card (Spotify Style)
        const quoteY = 980;

        // Character Name Title
        ctx.font = "bold 58px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(character.name, 80, quoteY);

        // Category Tag
        if (character.category) {
          ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillStyle = "#F5B838";
          ctx.fillText(`•  ${character.category.toUpperCase()}`, 80 + ctx.measureText(character.name).width + 20, quoteY - 10);
        }

        // Character Quote / Tagline
        const quoteText = character.tagline || character.greeting || "Sahabat dekat yang hangat, ceria, dan selalu ada untukmu.";
        ctx.font = "italic 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#D6D8E2";

        // Wrap text helper
        const maxQuoteWidth = width - 160;
        const words = quoteText.split(" ");
        let line = "“";
        let currY = quoteY + 68;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxQuoteWidth && n > 0) {
            ctx.fillText(line, 80, currY);
            line = words[n] + " ";
            currY += 46;
            if (currY > quoteY + 180) {
              line += "...”";
              break;
            }
          } else {
            line = testLine;
          }
        }
        if (!line.includes("”")) line += "”";
        ctx.fillText(line, 80, currY);

        // 4. Bottom Spotify-Style Audio Bar & Link
        const footerY = 1290;

        // Separator line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, footerY - 40);
        ctx.lineTo(width - 80, footerY - 40);
        ctx.stroke();

        // Waveform bars dummy visual
        const barX = 80;
        const heights = [16, 28, 42, 24, 38, 54, 30, 48, 20, 36, 50, 26, 40, 18];
        heights.forEach((h, i) => {
          ctx.fillStyle = i % 2 === 0 ? "#F5B838" : "#E2E4EB";
          ctx.beginPath();
          ctx.roundRect(barX + i * 16, footerY - h / 2, 8, h, 4);
          ctx.fill();
        });

        // Website CTA Text
        ctx.textAlign = "right";
        ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Ngobrol bareng sekarang di:", width - 80, footerY - 8);

        ctx.font = "normal 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#F5B838";
        ctx.fillText(websiteUrl.replace(/^https?:\/\//, ""), width - 80, footerY + 26);
        ctx.textAlign = "left";

        const dataUrl = canvas.toDataURL("image/png");
        if (isMounted) {
          setPreviewDataUrl(dataUrl);
          setIsGeneratingImage(false);
        }
      } catch (err) {
        console.error("Failed to generate share card canvas:", err);
        if (isMounted) setIsGeneratingImage(false);
      }
    };

    generateCard();

    return () => {
      isMounted = false;
    };
  }, [isOpen, character, websiteUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    haptics.light(true);
    if (!previewDataUrl) return;

    const link = document.createElement("a");
    link.download = `share-${character.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = previewDataUrl;
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyLink = () => {
    haptics.light(true);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(websiteUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    haptics.light(true);
    if (navigator.share) {
      try {
        if (previewDataUrl && navigator.canShare) {
          // Convert dataUrl to blob file if supported
          const blob = await (await fetch(previewDataUrl)).blob();
          const file = new File([blob], `${character.name}.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: character.name,
              text: `Yuk ngobrol bareng ${character.name}! ${character.tagline || ""}`,
              url: websiteUrl,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: character.name,
          text: `Yuk ngobrol bareng ${character.name}! ${character.tagline || ""}`,
          url: websiteUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white overflow-hidden max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#F5B838]/20 text-[#F5B838] flex items-center justify-center">
              <Share2 size={15} />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Bagikan Kartu Karakter
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer text-neutral-400 hover:text-white"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-2">
          {isGeneratingImage || !previewDataUrl ? (
            <div className="w-full aspect-[3/4] max-h-[380px] rounded-2xl bg-neutral-950 border border-white/10 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 size={28} className="animate-spin text-[#F5B838]" />
              <span className="text-xs">Membuat kartu estetik...</span>
            </div>
          ) : (
            <div className="w-full aspect-[3/4] max-h-[380px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 relative group">
              <img
                src={previewDataUrl}
                alt={`Kartu ${character.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20">
                  Format Spotify Canvas (3:4)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isGeneratingImage || !previewDataUrl}
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check size={15} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download size={15} className="text-[#F5B838]" />
                  <span>Unduh Gambar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={15} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={15} className="text-[#F5B838]" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            disabled={isGeneratingImage || !previewDataUrl}
            onClick={handleNativeShare}
            className="w-full py-3 rounded-full bg-[#F5B838] hover:bg-[#E5A929] active:scale-98 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Share2 size={16} />
            <span>Bagikan ke Media Sosial</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
