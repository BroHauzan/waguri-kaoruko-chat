import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";
import { Chat, Character, Message } from "../types";

interface MoodTrendsChartProps {
  chat?: Chat;
  character?: Character;
}

export const MOOD_CONFIG: Record<
  string,
  { label: string; score: number }
> = {
  excited: { label: "Bersemangat", score: 9.5 },
  happy: { label: "Senang & Hangat", score: 8.5 },
  playful: { label: "Ceria", score: 8.0 },
  shy: { label: "Tersipu", score: 7.5 },
  neutral: { label: "Santai", score: 6.0 },
  worried: { label: "Perhatian", score: 5.5 },
  bored: { label: "Bosan", score: 4.5 },
  annoyed: { label: "Ngambek", score: 3.5 },
  sad: { label: "Sedih", score: 2.5 },
  angry: { label: "Kesal", score: 1.5 },
};

export const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({
  chat,
  character,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [filterRange, setFilterRange] = useState<"10" | "20" | "all">("10");

  const charName = character?.name || "Karakter";

  // Filter pesan karakter
  const allCharMessages: Message[] = (chat?.messages || []).filter(
    (m) => m.role === "char"
  );

  // Jika pesan kurang dari 2, tampilkan empty state minimalis
  if (allCharMessages.length < 2) {
    return (
      <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-2">
        <div className="w-9 h-9 rounded-xl bg-[#F5B838]/10 text-[#F5B838] flex items-center justify-center">
          <TrendingUp size={18} />
        </div>
        <h4 className="text-xs font-bold text-neutral-800 dark:text-[#E4E5EA]">
          Belum Cukup Data Tren Emosi
        </h4>
        <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93] max-w-xs leading-relaxed">
          Kirim beberapa pesan lagi dengan {charName} untuk melihat riwayat grafik emosinya.
        </p>
      </div>
    );
  }

  // Potong berdasarkan filter
  const filteredMessages =
    filterRange === "10"
      ? allCharMessages.slice(-10)
      : filterRange === "20"
      ? allCharMessages.slice(-20)
      : allCharMessages;

  // Titik data untuk grafik
  const points = filteredMessages.map((m, idx) => {
    const rawEmotion = (m.emotion || "happy").toLowerCase();
    const config = MOOD_CONFIG[rawEmotion] || MOOD_CONFIG.happy;
    const intensity = typeof m.intensity === "number" ? m.intensity : 7;
    // Skor ternormalisasi: 1 - 10
    const normalizedVal = Math.min(10, Math.max(1, config.score * 0.5 + intensity * 0.5));

    const date = new Date(m.timestamp);
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;

    return {
      index: idx,
      id: m.id,
      text: m.text,
      time: timeStr,
      emotionKey: rawEmotion,
      label: config.label,
      intensity,
      value: normalizedVal,
    };
  });

  // Statistik ringkas
  const avgIntensity =
    points.length > 0
      ? (
          points.reduce((acc, curr) => acc + curr.intensity, 0) / points.length
        ).toFixed(1)
      : "7.0";

  // Frekuensi emosi
  const moodCounts: Record<string, number> = {};
  points.forEach((p) => {
    moodCounts[p.emotionKey] = (moodCounts[p.emotionKey] || 0) + 1;
  });

  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const cfg = MOOD_CONFIG[key] || MOOD_CONFIG.happy;
      const percentage = Math.round((count / points.length) * 100);
      return { key, count, percentage, ...cfg };
    });

  const dominantMood = sortedMoods[0] || {
    label: "Senang & Hangat",
    percentage: 100,
    count: points.length,
  };

  // Dimensi SVG
  const svgWidth = 320;
  const svgHeight = 120;
  const paddingX = 16;
  const paddingTop = 14;
  const paddingBottom = 22;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Koordinat titik
  const coords = points.map((p, idx) => {
    const x =
      points.length > 1
        ? paddingX + (idx / (points.length - 1)) * chartWidth
        : paddingX + chartWidth / 2;
    const y =
      paddingTop +
      chartHeight -
      ((p.value - 1) / 9) * chartHeight;
    return { ...p, x, y };
  });

  // Jalur garis & area kurva
  let pathD = "";
  let areaD = "";
  if (coords.length > 0) {
    if (coords.length === 1) {
      pathD = `M ${coords[0].x - 12} ${coords[0].y} L ${coords[0].x + 12} ${coords[0].y}`;
      areaD = `M ${coords[0].x - 12} ${coords[0].y} L ${coords[0].x + 12} ${coords[0].y} L ${coords[0].x + 12} ${svgHeight - paddingBottom} L ${coords[0].x - 12} ${svgHeight - paddingBottom} Z`;
    } else {
      pathD = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
      areaD = `${pathD} L ${coords[coords.length - 1].x} ${
        svgHeight - paddingBottom
      } L ${coords[0].x} ${svgHeight - paddingBottom} Z`;
    }
  }

  const selectedPoint =
    selectedPointIndex !== null
      ? coords[selectedPointIndex]
      : coords[coords.length - 1];

  return (
    <div className="flex flex-col space-y-3">
      {/* Header & Filter Range */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-[#8A8A93] uppercase">
          Grafik Respons
        </span>
        <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-lg p-0.5 text-[11px]">
          {(["10", "20", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setFilterRange(r);
                setSelectedPointIndex(null);
              }}
              type="button"
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                filterRange === r
                  ? "bg-white dark:bg-[#202126] text-neutral-900 dark:text-white shadow-2xs font-semibold"
                  : "text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {r === "all" ? "Semua" : `${r} Chat`}
            </button>
          ))}
        </div>
      </div>

      {/* Ringkasan Statistik 3 Kolom */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            Dominan
          </span>
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 truncate">
            {dominantMood.label}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {dominantMood.percentage}% respons
          </span>
        </div>

        <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            Rata-rata
          </span>
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
            {avgIntensity} <span className="text-[10px] font-normal text-neutral-400">/ 10</span>
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Intensitas
          </span>
        </div>

        <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            Sampel
          </span>
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
            {points.length}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Pesan dianalisis
          </span>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-3.5 flex flex-col space-y-3">
        {/* Spotlight Card untuk titik yang dipilih */}
        {selectedPoint && (
          <div className="bg-white dark:bg-[#1C1D22] border border-black/5 dark:border-white/[0.08] rounded-lg p-2.5 flex flex-col gap-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5B838]" />
                <span className="font-bold text-neutral-900 dark:text-[#F2F3F7]">
                  {selectedPoint.label}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-[#8A8A93]">
                  • Intensitas {selectedPoint.intensity}/10
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 dark:text-[#71717A]">
                {selectedPoint.time}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-[#A1A2AA] line-clamp-2 leading-relaxed">
              "{selectedPoint.text}"
            </p>
          </div>
        )}

        {/* Minimal Line Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-[120px] overflow-visible select-none"
          >
            <defs>
              <linearGradient id="minimalMoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5B838" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#F5B838" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal baseline & top guideline */}
            <line
              x1={paddingX}
              y1={paddingTop}
              x2={svgWidth - paddingX}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.08"
              className="text-neutral-500 dark:text-white"
            />
            <line
              x1={paddingX}
              y1={svgHeight - paddingBottom}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.12"
              className="text-neutral-500 dark:text-white"
            />

            {/* Area under curve */}
            {areaD && <path d={areaD} fill="url(#minimalMoodGradient)" />}

            {/* Crisp clean line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#F5B838"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points */}
            {coords.map((c, i) => {
              const isSelected = selectedPoint?.id === c.id;
              return (
                <g
                  key={c.id || i}
                  onClick={() => setSelectedPointIndex(i)}
                  className="cursor-pointer"
                >
                  {/* Invisible Hit Area */}
                  <circle cx={c.x} cy={c.y} r="12" fill="transparent" />

                  {/* Core Circle */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isSelected ? "4.5" : "2.5"}
                    fill={isSelected ? "#F5B838" : "#A1A1AA"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-white dark:text-[#18191E] transition-all"
                  />

                  {/* Time label on first & last point */}
                  {(i === 0 || i === coords.length - 1) && (
                    <text
                      x={c.x}
                      y={svgHeight - 6}
                      fontSize="9"
                      fill="currentColor"
                      textAnchor={i === 0 ? "start" : "end"}
                      className="text-neutral-400 dark:text-neutral-500 font-mono"
                    >
                      {c.time}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Petunjuk Interaksi */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 dark:text-[#8A8A93] pt-0.5">
          <Info size={11} />
          <span>Ketuk titik pada grafik untuk melihat rincian percakapan</span>
        </div>
      </div>

      {/* Rincian Distribusi Emosi (Minimal List) */}
      <div className="bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] rounded-xl p-3 flex flex-col space-y-2">
        <span className="text-[11px] font-semibold text-neutral-600 dark:text-[#A1A2AA]">
          Distribusi Emosi Teratas
        </span>
        <div className="flex flex-col space-y-2">
          {sortedMoods.slice(0, 3).map((m) => (
            <div key={m.key} className="flex flex-col space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-700 dark:text-[#E4E5EA] font-medium">
                  {m.label}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                  {m.count} pesan ({m.percentage}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F5B838] transition-all duration-300"
                  style={{ width: `${m.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
