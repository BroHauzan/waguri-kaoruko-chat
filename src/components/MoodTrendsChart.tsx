import React, { useState } from "react";
import {
  TrendingUp,
  Smile,
  Heart,
  MessageCircle,
  Info,
  Calendar,
} from "lucide-react";
import { Chat, Character, Message } from "../types";

interface MoodTrendsChartProps {
  chat?: Chat;
  character?: Character;
}

export const MOOD_CONFIG: Record<
  string,
  { label: string; color: string; score: number; emoji: string }
> = {
  excited: { label: "Bersemangat", color: "#F59E0B", score: 9.5, emoji: "✨" },
  happy: { label: "Senang & Hangat", color: "#10B981", score: 8.5, emoji: "🥰" },
  playful: { label: "Ceria / Gemas", color: "#8B7CF6", score: 8.0, emoji: "😋" },
  shy: { label: "Salting / Tersipu", color: "#EC4899", score: 7.5, emoji: "😳" },
  neutral: { label: "Santai", color: "#64748B", score: 6.0, emoji: "🙂" },
  worried: { label: "Khawatir / Perhatian", color: "#06B6D4", score: 5.5, emoji: "🥺" },
  bored: { label: "Bosan", color: "#94A3B8", score: 4.5, emoji: "🥱" },
  annoyed: { label: "Ngambek / Pouty", color: "#F97316", score: 3.5, emoji: "😤" },
  sad: { label: "Sedih", color: "#3B82F6", score: 2.5, emoji: "😢" },
  angry: { label: "Kesal", color: "#EF4444", score: 1.5, emoji: "😡" },
};

export const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({
  chat,
  character,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [filterRange, setFilterRange] = useState<"10" | "20" | "all">("10");

  const charName = character?.name || "Waguri Kaoruko";

  // Filter messages to character messages
  const allCharMessages: Message[] = (chat?.messages || []).filter(
    (m) => m.role === "char"
  );

  // If there are fewer than 2 messages, display an honest empty state (R-17, R-27, R-38)
  if (allCharMessages.length < 2) {
    return (
      <div className="bg-neutral-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] rounded-[20px] p-6 text-center flex flex-col items-center justify-center space-y-2.5">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
          <TrendingUp size={22} />
        </div>
        <h4 className="text-sm font-bold text-neutral-800 dark:text-[#E4E5EA]">
          Belum Cukup Data Tren Mood
        </h4>
        <p className="text-xs text-neutral-500 dark:text-[#8A8A93] max-w-xs leading-relaxed">
          Mulai percakapan lebih lanjut dengan {charName} untuk menganalisis dinamika emosinya secara otomatis.
        </p>
      </div>
    );
  }

  const displayMessages = allCharMessages;

  // Slice based on filter range
  const filteredMessages =
    filterRange === "10"
      ? displayMessages.slice(-10)
      : filterRange === "20"
      ? displayMessages.slice(-20)
      : displayMessages;

  // Process data points for the SVG chart
  const points = filteredMessages.map((m, idx) => {
    const rawEmotion = (m.emotion || "happy").toLowerCase();
    const config = MOOD_CONFIG[rawEmotion] || MOOD_CONFIG.happy;
    const intensity = typeof m.intensity === "number" ? m.intensity : 7;
    // Normalized score: 1 to 10
    const normalizedVal = Math.min(10, Math.max(1, (config.score * 0.5 + intensity * 0.5)));

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
      emoji: config.emoji,
      color: config.color,
      intensity,
      value: normalizedVal,
    };
  });

  // Calculate statistics
  const totalUserMsgs = (chat?.messages || []).filter((m) => m.role === "user").length;
  const totalCharMsgs = allCharMessages.length;
  const avgIntensity =
    points.length > 0
      ? (
          points.reduce((acc, curr) => acc + curr.intensity, 0) / points.length
        ).toFixed(1)
      : "7.0";

  // Mood frequency breakdown
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
    emoji: "🥰",
    color: "#10B981",
    percentage: 100,
  };

  // SVG dimensions
  const svgWidth = 320;
  const svgHeight = 140;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 28;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Map points to SVG coordinates
  const coords = points.map((p, idx) => {
    const x =
      points.length > 1
        ? paddingX + (idx / (points.length - 1)) * chartWidth
        : paddingX + chartWidth / 2;
    // value ranges from 1 to 10. Higher value = lower Y (top)
    const y =
      paddingTop +
      chartHeight -
      ((p.value - 1) / 9) * chartHeight;
    return { ...p, x, y };
  });

  // Generate SVG path strings
  let pathD = "";
  let areaD = "";
  if (coords.length > 0) {
    if (coords.length === 1) {
      pathD = `M ${coords[0].x - 10} ${coords[0].y} L ${coords[0].x + 10} ${coords[0].y}`;
      areaD = `M ${coords[0].x - 10} ${coords[0].y} L ${coords[0].x + 10} ${coords[0].y} L ${coords[0].x + 10} ${svgHeight - paddingBottom} L ${coords[0].x - 10} ${svgHeight - paddingBottom} Z`;
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
    selectedPointIndex !== null ? coords[selectedPointIndex] : coords[coords.length - 1];

  return (
    <div className="flex flex-col space-y-3">
      {/* Header with Title and Range Picker */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#F5B838]" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-600 dark:text-[#9B9BA3]">
            TREN MOOD {charName.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center bg-neutral-100 dark:bg-white/[0.08] border border-black/5 dark:border-white/10 rounded-lg p-0.5 text-[11px]">
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
                  ? "bg-[#F5B838] text-neutral-900 shadow-2xs font-semibold"
                  : "text-neutral-500 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {r === "all" ? "Semua" : `${r} Chat`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-neutral-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] rounded-[20px] p-4 shadow-xs flex flex-col space-y-3.5 relative overflow-hidden">
        {/* Selected Data Point Spotlight Card */}
        {selectedPoint && (
          <div className="flex items-center justify-between bg-white dark:bg-[#1C1D22] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{selectedPoint.emoji}</span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-[#F2F3F7] truncate">
                    {selectedPoint.label}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.2 rounded-full border"
                    style={{
                      borderColor: `${selectedPoint.color}50`,
                      backgroundColor: `${selectedPoint.color}15`,
                      color: selectedPoint.color,
                    }}
                  >
                    Intensitas: {selectedPoint.intensity}/10
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93] truncate max-w-[200px] mt-0.5">
                  "{selectedPoint.text}"
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <span className="text-[11px] font-mono text-neutral-400 dark:text-[#71717A]">
                {selectedPoint.time}
              </span>
            </div>
          </div>
        )}

        {/* SVG Interactive Line Chart */}
        <div className="relative w-full overflow-hidden flex flex-col items-center">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-[140px] overflow-visible select-none"
          >
            <defs>
              <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5B838" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F5B838" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line
              x1={paddingX}
              y1={paddingTop}
              x2={svgWidth - paddingX}
              y2={paddingTop}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeDasharray="3 3"
              className="text-neutral-500 dark:text-white"
            />
            <line
              x1={paddingX}
              y1={paddingTop + chartHeight / 2}
              x2={svgWidth - paddingX}
              y2={paddingTop + chartHeight / 2}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeDasharray="3 3"
              className="text-neutral-500 dark:text-white"
            />
            <line
              x1={paddingX}
              y1={svgHeight - paddingBottom}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingBottom}
              stroke="currentColor"
              strokeOpacity="0.2"
              className="text-neutral-500 dark:text-white"
            />

            {/* Y Axis Guide Labels */}
            <text
              x={paddingX - 4}
              y={paddingTop + 4}
              fontSize="9"
              textAnchor="end"
              fill="currentColor"
              className="text-neutral-500 dark:text-white/40"
            >
              10
            </text>
            <text
              x={paddingX - 4}
              y={paddingTop + chartHeight / 2 + 3}
              fontSize="9"
              textAnchor="end"
              fill="currentColor"
              className="text-neutral-500 dark:text-white/40"
            >
              5
            </text>
            <text
              x={paddingX - 4}
              y={svgHeight - paddingBottom + 3}
              fontSize="9"
              textAnchor="end"
              fill="currentColor"
              className="text-neutral-500 dark:text-white/40"
            >
              1
            </text>

            {/* Shaded Area Under Curve */}
            {areaD && <path d={areaD} fill="url(#moodGradient)" />}

            {/* Smooth Curve Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#8B7CF6"
                strokeWidth="2.5"
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
                  className="cursor-pointer group"
                >
                  {/* Invisible Hit Target */}
                  <circle cx={c.x} cy={c.y} r="14" fill="transparent" />

                  {/* Outer Pulsing Ring when Selected */}
                  {isSelected && (
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="8"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}

                  {/* Core Circle */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isSelected ? "5.5" : "3.5"}
                    fill={c.color}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="transition-all duration-200 text-white dark:text-[#1C1C1E]"
                  />

                  {/* X Axis Time Labels (Show first, middle, last) */}
                  {(i === 0 ||
                    i === coords.length - 1 ||
                    (coords.length > 4 && i === Math.floor(coords.length / 2))) && (
                    <text
                      x={c.x}
                      y={svgHeight - 10}
                      fontSize="9"
                      fill="currentColor"
                      textAnchor="middle"
                      fontFamily="monospace"
                      className="text-neutral-500 dark:text-white/40"
                    >
                      {c.time}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tap instruction hint */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-white/40 pt-1">
          <Info size={12} />
          <span>Ketuk salah satu titik pada grafik untuk melihat pesan & mood</span>
        </div>

        {/* Quick Stat Pill Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-xl p-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] text-neutral-500 dark:text-white/50 flex items-center gap-1">
              <Smile size={11} className="text-emerald-500 dark:text-emerald-400" />
              Rata-rata Mood
            </span>
            <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
              {avgIntensity}
              <span className="text-xs text-neutral-400 dark:text-white/40 font-normal">/10</span>
            </span>
          </div>

          <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-xl p-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] text-neutral-500 dark:text-white/50 flex items-center gap-1">
              <Heart size={11} className="text-amber-500 dark:text-amber-400" />
              Dominan
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300 mt-1 truncate max-w-full">
              {dominantMood.emoji} {dominantMood.label}
            </span>
          </div>

          <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-xl p-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] text-neutral-500 dark:text-white/50 flex items-center gap-1">
              <MessageCircle size={11} className="text-[#F5B838]" />
              Total Pesan
            </span>
            <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
              {totalUserMsgs + totalCharMsgs}
            </span>
          </div>
        </div>

        {/* Mood Distribution Bar Breakdown */}
        <div className="flex flex-col space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-600 dark:text-white/60 font-medium">Distribusi Emosi</span>
            <span className="text-neutral-400 dark:text-white/40">{points.length} respons terekam</span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-black/[0.06] dark:bg-white/[0.06]">
            {sortedMoods.map((m) => (
              <div
                key={m.key}
                style={{
                  width: `${m.percentage}%`,
                  backgroundColor: m.color,
                }}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                title={`${m.label}: ${m.percentage}%`}
              />
            ))}
          </div>

          {/* Mood Legend Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sortedMoods.slice(0, 4).map((m) => (
              <span
                key={m.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-neutral-700 dark:text-white/80"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="text-neutral-400 dark:text-white/40">({m.percentage}%)</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
