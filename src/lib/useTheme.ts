import { useCallback, useEffect, useState } from "react";
import { ThemeMode } from "../types";

/**
 * Central theme manager.
 *
 * - `light` / `dark`  → forced
 * - `auto`            → follows `prefers-color-scheme` and react live
 *
 * The `.dark` class lives on <html> (:root). CSS tokens in index.css
 * key off `:root.dark`, and Tailwind's `dark:` variant resolves to the
 * same selector via `@custom-variant`.
 */
export function useTheme(mode: ThemeMode = "auto") {
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (mode === "light" || mode === "dark") return mode;
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply the resolved theme to <html> and sync color-scheme.
  useEffect(() => {
    const root = document.documentElement;
    // Enable the eased cross-fade only for the theme swap itself,
    // then remove it so hover/press feedback stays instant.
    root.classList.add("theme-transition");
    const timer = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      450
    );

    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;

    return () => window.clearTimeout(timer);
  }, [resolved]);

  // Resolve mode → concrete scheme, and track the OS preference when auto.
  useEffect(() => {
    if (mode !== "auto") {
      setResolved(mode);
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setResolved(mq.matches ? "dark" : "light");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mode]);

  const toggle = useCallback(() => {
    setResolved((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { resolved, toggle };
}
