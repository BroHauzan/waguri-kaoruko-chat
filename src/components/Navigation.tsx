import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, MessageSquare, Plus, Heart, User } from "lucide-react";

export type NavTab = "chats" | "create" | "settings";

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeChatsCount?: number;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: typeof Home;
  title: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "Pesan", icon: MessageSquare, title: "Pesan Obrolan" },
  { id: "create", label: "Buat", icon: Plus, title: "Buat Karakter Baru" },
  { id: "settings", label: "Akun", icon: User, title: "Pengaturan & Profil" },
];

// Apple Design: critically damped spring, no overshoot.
// damping 1.0 / response ~0.35 — graceful, non-distracting.
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 };

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  activeChatsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-4 inset-x-0 z-50 pointer-events-none pb-safe flex justify-center px-4">
      {/* Liquid Glass pill — translucent material, content scrolls under it */}
      <div className="liquid-glass-nav liquid-glass-sheen rounded-full h-[58px] px-3.5 flex items-center gap-2 pointer-events-auto">
        {/* Static accent icons (no pill) */}
        <button
          onClick={() => onTabChange("chats")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 dark:text-white/40 hover:text-neutral-700 dark:hover:text-white/70 active:scale-90 transition-all cursor-pointer"
          type="button"
          title="Beranda"
          aria-label="Beranda"
        >
          <Home size={20} strokeWidth={1.8} />
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative min-w-[42px] h-[42px] px-3 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-neutral-400 dark:text-white/40 hover:text-neutral-700 dark:hover:text-white/70"
              type="button"
              title={item.title}
              aria-label={item.title}
            >
              {/* Active pill — shared layoutId so it glides between tabs */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full bg-[#F5B838] shadow-sm"
                />
              )}

              {/* Icon + label sit above the pill */}
              <motion.span
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                transition={SPRING}
                className={`relative z-10 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "text-neutral-900 font-semibold"
                    : "text-inherit"
                }`}
              >
                <Icon
                  size={item.id === "create" ? 20 : 19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={isActive && item.id === "chats" ? "fill-neutral-900/15" : ""}
                />
                {isActive && (
                  <span className="text-[12px] tracking-tight font-medium pr-0.5">
                    {item.label}
                  </span>
                )}
              </motion.span>

              {/* Unread badge */}
              <AnimatePresence>
                {activeChatsCount > 0 && !isActive && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={SPRING}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F5B838]"
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}

        {/* Static accent icon (no pill) */}
        <button
          onClick={() => onTabChange("chats")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 dark:text-white/40 hover:text-neutral-700 dark:hover:text-white/70 active:scale-90 transition-all cursor-pointer"
          type="button"
          title="Favorit"
          aria-label="Favorit"
        >
          <Heart size={19} strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  );
};
