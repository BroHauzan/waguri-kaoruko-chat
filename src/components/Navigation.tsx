import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Plus, User } from "lucide-react";
import { AppLanguage } from "../types";
import { getDictionary } from "../lib/i18n";

export type NavTab = "chats" | "create" | "settings";

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeChatsCount?: number;
  language?: AppLanguage;
}

// Apple Design: critically damped spring, no overshoot.
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  activeChatsCount = 0,
  language = "id",
}) => {
  const dict = getDictionary(language);

  const navItems = [
    {
      id: "chats" as NavTab,
      label: dict.navChats,
      icon: MessageSquare,
      title: dict.navChatsTitle,
    },
    {
      id: "create" as NavTab,
      label: dict.navCreate,
      icon: Plus,
      title: dict.navCreateTitle,
    },
    {
      id: "settings" as NavTab,
      label: dict.navSettings,
      icon: User,
      title: dict.navSettingsTitle,
    },
  ];

  return (
    <nav className="fixed bottom-4 inset-x-0 z-50 pointer-events-none pb-safe flex justify-center px-4">
      {/* Floating Tab Bar — restrained translucent pill */}
      <div className="liquid-glass-nav rounded-full h-[58px] px-2.5 flex items-center gap-1 pointer-events-auto shadow-md">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative min-w-[56px] min-h-[44px] h-[44px] px-3.5 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-neutral-500 dark:text-white/45 hover:text-neutral-800 dark:hover:text-white/80 transition-colors"
              type="button"
              title={item.title}
              aria-label={item.title}
            >
              {/* Active pill — shared layoutId so it glides between tabs */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full bg-[#F5B838] shadow-xs"
                />
              )}

              {/* Icon + label sit above the pill */}
              <motion.span
                whileTap={{ scale: 0.94 }}
                transition={SPRING}
                className={`relative z-10 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "text-neutral-950 font-semibold"
                    : "text-inherit"
                }`}
              >
                <Icon
                  size={item.id === "create" ? 19 : 18}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={isActive && item.id === "chats" ? "fill-neutral-950/15" : ""}
                />
                {isActive && (
                  <span className="text-[12px] tracking-tight font-medium pr-0.5">
                    {item.label}
                  </span>
                )}
              </motion.span>

              {/* Unread badge */}
              <AnimatePresence>
                {activeChatsCount > 0 && !isActive && item.id === "chats" && (
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
      </div>
    </nav>
  );
};
