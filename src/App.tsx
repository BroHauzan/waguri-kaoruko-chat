import React, { useState, useEffect, useRef } from "react";
import { Character, Chat, Settings } from "./types";
import { storage } from "./lib/storage";
import { useTheme } from "./lib/useTheme";
import { Navigation, NavTab } from "./components/Navigation";
import { ChatsListScreen } from "./components/ChatsListScreen";
import { ChatScreen } from "./components/ChatScreen";
import { CharacterForm } from "./components/CharacterForm";
import { SettingsScreen } from "./components/SettingsScreen";
import { playNotificationSound } from "./lib/notificationSound";
import { InAppNotificationBanner } from "./components/InAppNotificationBanner";
import { haptics } from "./lib/haptics";
import { backgroundQueue } from "./lib/backgroundQueueProcessor";
import { useMediaQuery, DESKTOP_QUERY } from "./lib/useMediaQuery";
import { DesktopEmptyState } from "./components/DesktopEmptyState";

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [currentTab, setCurrentTab] = useState<NavTab>("chats");
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [typingCharacterIds, setTypingCharacterIds] = useState<Record<string, boolean>>({});
  const [unreadCharacterIds, setUnreadCharacterIds] = useState<Set<string>>(new Set());
  const [activeNotification, setActiveNotification] = useState<{
    character: Character;
    messageText: string;
  } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const activeCharacterRef = useRef<Character | null>(null);
  const editingCharacterRef = useRef<Character | null>(null);
  const currentTabRef = useRef<NavTab>("chats");

  useEffect(() => {
    activeCharacterRef.current = activeCharacter;
  }, [activeCharacter]);

  useEffect(() => {
    editingCharacterRef.current = editingCharacter;
  }, [editingCharacter]);

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  // Theme — resolves `auto` against the OS preference, live.
  useTheme(settings.theme || "dark");

  // Desktop (>= lg) memakai layout dua panel ala WhatsApp Web.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  // Load initial data on mount
  useEffect(() => {
    const loadedCharacters = storage.getCharacters();
    const loadedChats = storage.getChats();
    const loadedSettings = storage.getSettings();

    setCharacters(loadedCharacters);
    setChats(loadedChats);
    setSettings(loadedSettings);

    // When user first opens the app, directly open Waguri Kaoruko's chat where she greeted first
    if (
      loadedCharacters.length === 1 &&
      loadedCharacters[0].id === "waguri-kaoruko"
    ) {
      const kaorukoChat =
        loadedChats["waguri-kaoruko"] ||
        storage.getChatByCharacterId("waguri-kaoruko", loadedCharacters[0]);
      if (kaorukoChat.messages.length <= 1) {
        setActiveCharacter(loadedCharacters[0]);
      }
    }

    // Resume any pending tasks in IndexedDB from previous sessions or reloads
    backgroundQueue.resumePendingTasks(loadedSettings);

    // Listen to background queue completions
    const unsubscribeQueue = backgroundQueue.subscribe((data) => {
      setChats((prev) => ({
        ...prev,
        [data.characterId]: data.chat,
      }));
      setTypingCharacterIds((prev) => ({
        ...prev,
        [data.characterId]: false,
      }));

      // If user is not currently inside that specific chat, show unread and in-app banner
      if (activeCharacter?.id !== data.characterId) {
        setUnreadCharacterIds((prev) => new Set([...prev, data.characterId]));
        setActiveNotification({
          character: data.character,
          messageText: data.lastReplyText,
        });
      }
    });

    const handleVisibilityOrOnline = () => {
      setIsOffline(!navigator.onLine);
      if (document.visibilityState === "visible" && navigator.onLine) {
        backgroundQueue.resumePendingTasks(storage.getSettings());
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityOrOnline);
    window.addEventListener("online", handleVisibilityOrOnline);
    window.addEventListener("offline", handleVisibilityOrOnline);

    // Listen for Service Worker notificationclick message
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_TO_CHAT" && event.data?.characterId) {
        const char = loadedCharacters.find((c) => c.id === event.data.characterId);
        if (char) {
          handleSelectCharacter(char);
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    return () => {
      unsubscribeQueue();
      window.removeEventListener("visibilitychange", handleVisibilityOrOnline);
      window.removeEventListener("online", handleVisibilityOrOnline);
      window.removeEventListener("offline", handleVisibilityOrOnline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, []);

  // Browser History & Android Hardware Back Button Handling
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ screen: "main", tab: "chats" }, "");
    }

    const handlePopState = () => {
      if (activeCharacterRef.current) {
        setActiveCharacter(null);
      } else if (editingCharacterRef.current) {
        setEditingCharacter(null);
      } else if (currentTabRef.current !== "chats") {
        setCurrentTab("chats");
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Capacitor hardware backButton listener support
    const capApp = (window as any).Capacitor?.Plugins?.App;
    let capRemove: (() => void) | undefined;
    if (capApp?.addListener) {
      capApp
        .addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          if (activeCharacterRef.current) {
            setActiveCharacter(null);
          } else if (editingCharacterRef.current) {
            setEditingCharacter(null);
          } else if (currentTabRef.current !== "chats") {
            setCurrentTab("chats");
          } else if (canGoBack) {
            window.history.back();
          } else {
            capApp.exitApp();
          }
        })
        .then((handle: any) => {
          capRemove = () => handle?.remove?.();
        });
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      capRemove?.();
    };
  }, []);

  const handleSelectCharacter = (char: Character, pushHistory = true) => {
    const chat = storage.getChatByCharacterId(char.id, char);
    setChats((prev) => ({ ...prev, [char.id]: chat }));
    if (pushHistory && !isDesktop) {
      window.history.pushState({ screen: "chat", characterId: char.id }, "");
    }
    setActiveCharacter(char);
    // Mark character as read when chat is opened
    setUnreadCharacterIds((prev) => {
      const next = new Set(prev);
      next.delete(char.id);
      return next;
    });
    // Dismiss active notification if it was for this character
    if (activeNotification?.character.id === char.id) {
      setActiveNotification(null);
    }
  };

  const handleCloseChat = () => {
    if (window.history.state?.screen === "chat") {
      window.history.back();
    } else {
      setActiveCharacter(null);
    }
  };

  const handleTypingChange = (characterId: string, isTyping: boolean) => {
    setTypingCharacterIds((prev) => ({
      ...prev,
      [characterId]: isTyping,
    }));
  };

  const handleBackgroundReply = (character: Character, lastReplyText: string) => {
    // If user is currently looking at another screen or list (not inside this character's chat)
    if (activeCharacter?.id !== character.id) {
      setUnreadCharacterIds((prev) => new Set([...prev, character.id]));
      playNotificationSound();
      haptics.receive(settings.hapticFeedback !== false);
      setActiveNotification({
        character,
        messageText: lastReplyText,
      });

      // Browser Notification if granted
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(character.name, {
            body: lastReplyText,
            icon: character.avatarUrl,
          });
        } catch (e) {
          // ignore notification error in sandbox
        }
      }
    }
  };

  const handleUpdateChat = (updatedChat: Chat) => {
    storage.saveChat(updatedChat);
    setChats((prev) => ({
      ...prev,
      [updatedChat.characterId]: updatedChat,
    }));
  };

  const handleClearChat = (characterId: string) => {
    const char = characters.find((c) => c.id === characterId) || activeCharacter;
    const freshChat = storage.clearChatHistory(characterId, char || undefined);
    setChats((prev) => ({
      ...prev,
      [characterId]: freshChat,
    }));
    return freshChat;
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    storage.saveCharacter(updatedChar);
    setCharacters((prev) =>
      prev.map((c) => (c.id === updatedChar.id ? updatedChar : c))
    );
    if (activeCharacter?.id === updatedChar.id) {
      setActiveCharacter(updatedChar);
    }
  };

  const handleDeleteCharacter = (characterId: string) => {
    storage.deleteCharacter(characterId);
    const updatedChars = storage.getCharacters();
    const updatedChats = storage.getChats();
    setCharacters(updatedChars);
    setChats(updatedChats);

    if (activeCharacter?.id === characterId) {
      setActiveCharacter(null);
    }
    if (editingCharacter?.id === characterId) {
      setEditingCharacter(null);
    }
  };

  const handleTogglePinCharacter = (characterId: string) => {
    storage.togglePin(characterId);
    setCharacters(storage.getCharacters());
  };

  const handleToggleArchiveCharacter = (characterId: string) => {
    storage.toggleArchive(characterId);
    setCharacters(storage.getCharacters());
  };

  const handleSaveCharacterForm = (char: Character) => {
    storage.saveCharacter(char);
    const updated = storage.getCharacters();
    setCharacters(updated);
    setEditingCharacter(null);
    setCurrentTab("chats");
    handleSelectCharacter(char);
  };

  const handleClearAllData = () => {
    storage.clearAllData();
    const resetChars = storage.getCharacters();
    const resetChats = storage.getChats();
    const resetSettings = storage.getSettings();

    setCharacters(resetChars);
    setChats(resetChats);
    setSettings(resetSettings);
    setActiveCharacter(null);
    setEditingCharacter(null);
    setCurrentTab("chats");
  };

  const handleSaveSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const activeChatsCount = Object.keys(chats).filter(
    (k) => (chats[k]?.messages?.length || 0) > 0
  ).length;

  const chatView = activeCharacter ? (
    /* Active Chat View. key memastikan state chat ter-reset saat pindah karakter (desktop). */
    <ChatScreen
      key={activeCharacter.id}
      character={activeCharacter}
      chat={
        chats[activeCharacter.id] ||
        storage.getChatByCharacterId(activeCharacter.id, activeCharacter)
      }
      settings={settings}
      onBack={handleCloseChat}
      onUpdateChat={handleUpdateChat}
      onClearChat={handleClearChat}
      onUpdateCharacter={handleUpdateCharacter}
      onEditCharacter={(char) => {
        setActiveCharacter(null);
        setEditingCharacter(char);
      }}
      onDeleteCharacter={handleDeleteCharacter}
      onBackgroundReply={handleBackgroundReply}
      onTypingChange={handleTypingChange}
    />
  ) : null;

  const editView = editingCharacter ? (
    <CharacterForm
      key={editingCharacter.id}
      initialCharacter={editingCharacter}
      onSave={handleSaveCharacterForm}
      onCancel={() => setEditingCharacter(null)}
    />
  ) : null;

  /* Tab Navigation Views: Obrolan (chats), Buat (+), Akun & Pengaturan (settings) */
  const tabViews = (
    <div className="flex-1 flex flex-col">
      {/* Page transition — keyed so it re-runs on tab change */}
      <div key={currentTab} className="flex-1 flex flex-col animate-page-in">
        {currentTab === "chats" && (
          <ChatsListScreen
            characters={characters}
            chats={chats}
            typingCharacterIds={typingCharacterIds}
            unreadCharacterIds={unreadCharacterIds}
            activeCharacterId={isDesktop ? activeCharacter?.id : undefined}
            onSelectCharacter={handleSelectCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onTogglePinCharacter={handleTogglePinCharacter}
            onToggleArchiveCharacter={handleToggleArchiveCharacter}
            onCreateNew={() => setCurrentTab("create")}
            language={settings.language || "id"}
            hapticFeedback={settings.hapticFeedback !== false}
          />
        )}

        {currentTab === "create" && (
          <CharacterForm
            initialCharacter={null}
            onSave={handleSaveCharacterForm}
            onCancel={() => setCurrentTab("chats")}
          />
        )}

        {currentTab === "settings" && (
          <SettingsScreen
            settings={settings}
            characters={characters}
            chats={chats}
            onBack={() => setCurrentTab("chats")}
            onSaveSettings={handleSaveSettings}
            onClearAllData={handleClearAllData}
          />
        )}
      </div>

      {/* Liquid Glass Floating Tab Bar (Always Accessible) */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setEditingCharacter(null);
          setCurrentTab(tab);
        }}
        activeChatsCount={activeChatsCount}
        language={settings.language || "id"}
      />
    </div>
  );

  /* Dynamic Floating In-App Notification Banner */
  const notificationBanner = activeNotification ? (
    <InAppNotificationBanner
      character={activeNotification.character}
      messageText={activeNotification.messageText}
      onClick={() => {
        handleSelectCharacter(activeNotification.character);
        setActiveNotification(null);
      }}
      onDismiss={() => setActiveNotification(null)}
    />
  ) : null;

  const offlineBanner = isOffline ? (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#F5B838] text-neutral-900 text-xs font-bold px-4 py-2 text-center shadow-md animate-fade-in">
      Koneksi terputus. Pesan akan terkirim otomatis saat online.
    </div>
  ) : null;

  /* Desktop: dua panel seperti WhatsApp Web (daftar di kiri, obrolan di kanan).
     Setiap panel punya `transform-gpu` supaya elemen `fixed` di dalamnya
     (header, input bar, tab bar, modal) menempel ke panel, bukan ke layar.
     Scroller dipisah ke div dalam agar elemen fixed tidak ikut tergulung. */
  if (isDesktop) {
    return (
      <div className="h-screen w-full flex bg-[#E9EBEF] dark:bg-[#15161A] selection:bg-[#F5B838]/30 font-['Inter',-apple-system,sans-serif] text-[#18181B] dark:text-[#F2F3F7]">
        <aside className="relative w-[380px] xl:w-[420px] shrink-0 h-screen overflow-hidden transform-gpu bg-[#F4F5F7] dark:bg-[#0B0C0F] border-r border-black/10 dark:border-white/10">
          <div className="h-full overflow-y-auto flex flex-col">{tabViews}</div>
        </aside>

        <section className="relative flex-1 min-w-0 h-screen overflow-hidden transform-gpu bg-[#F4F5F7] dark:bg-[#0B0C0F]">
          <div className="h-full overflow-y-auto flex flex-col">
            {chatView ||
              editView || (
                <DesktopEmptyState
                  onCreateCharacter={() => setCurrentTab("create")}
                  language={settings.language || "id"}
                />
              )}
          </div>
        </section>

        {notificationBanner}
        {offlineBanner}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9EBEF] dark:bg-[#15161A] sm:py-6 flex justify-center selection:bg-[#F5B838]/30 font-['Inter',-apple-system,sans-serif]">
      {/* Mobile Device Frame Container (max-w-md responsive) matching reference */}
      <div className={`relative w-full max-w-md ${activeCharacter ? "h-dvh max-h-dvh overflow-hidden" : "min-h-screen"} bg-[#F4F5F7] dark:bg-[#0B0C0F] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-black/10 dark:sm:border-white/10 sm:overflow-hidden flex flex-col z-10 text-[#18181B] dark:text-[#F2F3F7]`}>
        {chatView || editView || tabViews}
      </div>

      {notificationBanner}
      {offlineBanner}
    </div>
  );
}
