// Web Vibration API utility for tactile haptic feedback

export const haptics = {
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "vibrate" in navigator
    );
  },

  // Subtle tactile tap when user sends a message (~15ms)
  send(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(15);
    } catch {
      // safe fallback
    }
  },

  // Tactile double micro-pulse when receiving an incoming AI bubble
  receive(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate([18, 35, 20]);
    } catch {
      // safe fallback
    }
  },

  // Crisp micro-tap for buttons, tabs, menu items
  light(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(10);
    } catch {
      // safe fallback
    }
  },

  // Medium tactile pulse for primary buttons & confirmations
  impact(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(20);
    } catch {
      // safe fallback
    }
  },

  // Tactile double micro-pulse for success actions
  success(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate([15, 30, 20]);
    } catch {
      // safe fallback
    }
  },

  // Subtle buzz when error occurs
  error(enabled = true) {
    if (!enabled || !this.isSupported()) return;
    try {
      navigator.vibrate([30, 50, 30]);
    } catch {
      // safe fallback
    }
  },
};
