import { useCallback, useEffect, useState } from "react";
import { ThemeMode } from "../types";

/**
 * Menerapkan tema langsung ke elemen DOM secara sinkron tanpa jeda render.
 * Mengubah:
 * - document.documentElement (.dark & data-theme)
 * - document.body (.dark)
 * - colorScheme CSS
 * - meta tag theme-color
 */
export function applyTheme(mode: ThemeMode = "auto"): "light" | "dark" {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return mode === "dark" ? "dark" : "light";
  }

  const isDark =
    mode === "dark" ||
    (mode === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const resolved = isDark ? "dark" : "light";
  const root = document.documentElement;

  // Set class dan attribute untuk support selector .dark dan [data-theme="dark"]
  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  if (document.body) {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  root.style.colorScheme = resolved;

  // Update meta theme-color pada browser mobile & PWA
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((meta) => {
    meta.setAttribute("content", isDark ? "#0B0C0F" : "#F4F5F7");
  });

  return resolved;
}

/**
 * Central theme manager hook.
 *
 * - `light` / `dark`  → forced
 * - `auto`            → follows `prefers-color-scheme` and reacts live
 */
export function useTheme(mode: ThemeMode = "auto") {
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    return applyTheme(mode);
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    const timer = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      450
    );

    const actual = applyTheme(mode);
    setResolved(actual);

    if (mode !== "auto") {
      return () => window.clearTimeout(timer);
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const nextResolved = applyTheme("auto");
      setResolved(nextResolved);
    };

    mq.addEventListener("change", handler);
    return () => {
      window.clearTimeout(timer);
      mq.removeEventListener("change", handler);
    };
  }, [mode]);

  const toggle = useCallback(() => {
    setResolved((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  return { resolved, toggle };
}
