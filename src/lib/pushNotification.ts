import { playNotificationSound } from "./notificationSound";

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for background push-like alerts and offline support
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

/**
 * Check if the browser supports notifications and what the current permission is
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Explicitly request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.warn("Failed to request notification permission:", e);
    return false;
  }
}

export interface PushNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  characterId?: string;
}

/**
 * Display a push-like native system notification using Service Worker
 */
export async function sendPushLikeNotification(
  title: string,
  options: PushNotificationOptions
): Promise<void> {
  playNotificationSound();

  const permission = getNotificationPermission();
  if (permission !== "granted") {
    return;
  }

  const notificationOptions = {
    body: options.body,
    icon:
      options.icon ||
      "/waguri-pfp.jpg",
    badge: options.badge || "/favicon.ico",
    tag: options.tag || `chat-${options.characterId || "alert"}`,
    data: {
      characterId: options.characterId,
    },
  };

  try {
    if (!swRegistration && "serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    if (swRegistration && "showNotification" in swRegistration) {
      await swRegistration.showNotification(title, notificationOptions);
      return;
    }

    // Try service worker controller postMessage
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        options: notificationOptions,
      });
      return;
    }

    // Direct Notification fallback
    if ("Notification" in window) {
      new Notification(title, notificationOptions);
    }
  } catch (e) {
    console.warn("Error sending native push notification:", e);
  }
}
