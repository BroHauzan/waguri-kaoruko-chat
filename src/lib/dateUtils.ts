/**
 * Utilitas format tanggal & pemisah riwayat pesan obrolan (WhatsApp style).
 */

/**
 * Memeriksa apakah dua timestamp berada pada tanggal kalender yang sama.
 */
export function isSameDay(t1: number, t2: number): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format pemisah tanggal obrolan seperti WhatsApp:
 * - Hari ini: "Hari ini"
 * - Kemarin (lewat 23:59 kemarin): "Kemarin"
 * - Dalam 7 hari terakhir: Nama hari (Senin, Selasa, dsb.)
 * - Lebih lama: Format tanggal kalender (misal: "6 Okt 2026")
 */
export function formatDateSeparator(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const now = new Date();

  // Reset ke jam 00:00:00 untuk perbandingan hari yang presisi
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Hari ini";
  }
  if (diffDays === 1) {
    return "Kemarin";
  }
  if (diffDays > 1 && diffDays < 7) {
    return messageDate.toLocaleDateString("id-ID", { weekday: "long" });
  }

  const isSameYear = messageDate.getFullYear() === now.getFullYear();
  return messageDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
}
