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

  // W3C standard: 'only light' / 'only dark' menonaktifkan paksaan forced-dark browser mobile
  const colorSchemeVal = isDark ? "only dark" : "only light";
  root.style.colorScheme = colorSchemeVal;
  root.style.backgroundColor = isDark ? "#0B0C0F" : "#F4F5F7";

  if (document.body) {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.classList.remove("dark");
      document.body.setAttribute("data-theme", "light");
    }
    document.body.style.colorScheme = colorSchemeVal;
    document.body.style.backgroundColor = isDark ? "#0B0C0F" : "#F4F5F7";
  }

  // Update meta theme-color pada browser mobile & PWA
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((meta) => {
    meta.setAttribute("content", isDark ? "#0B0C0F" : "#F4F5F7");
  });

  // Sinkronkan meta color-scheme untuk memberitahu browser mobile (Mi Browser, Samsung Internet, dll)
  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.createElement("meta");
    colorSchemeMeta.setAttribute("name", "color-scheme");
    document.head.appendChild(colorSchemeMeta);
  }
  colorSchemeMeta.setAttribute("content", isDark ? "dark" : "light");

  let supportedMeta = document.querySelector('meta[name="supported-color-schemes"]');
  if (!supportedMeta) {
    supportedMeta = document.createElement("meta");
    supportedMeta.setAttribute("name", "supported-color-schemes");
    document.head.appendChild(supportedMeta);
  }
  supportedMeta.setAttribute("content", isDark ? "dark" : "light");

  const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (statusBarMeta) {
    statusBarMeta.setAttribute("content", isDark ? "black-translucent" : "default");
  }

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
