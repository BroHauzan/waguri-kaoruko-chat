import { useSyncExternalStore } from "react";

/** Breakpoint desktop; sama dengan `lg:` Tailwind supaya JS dan CSS selalu sepakat. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Berlangganan ke media query dan mengembalikan hasilnya secara reaktif.
 * Memakai useSyncExternalStore agar tidak ada render pertama yang salah layout.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
