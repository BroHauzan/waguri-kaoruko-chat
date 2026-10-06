import React, { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "../lib/pushNotification";

export const NotificationPermissionBanner: React.FC = () => {
  const [permission, setPermission] = useState<string>("granted");
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  useEffect(() => {
    const current = getNotificationPermission();
    setPermission(current);
  }, []);

  if (permission === "granted" || permission === "unsupported" || dismissed) {
    return null;
  }

  const handleRequest = async () => {
    setIsActivating(true);
    const granted = await requestNotificationPermission();
    setIsActivating(false);
    if (granted) {
      setPermission("granted");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setDismissed(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="mx-4 mt-2 mb-1 p-3 bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-200 animate-fade-in shadow-lg">
        <span className="flex items-center gap-2">
          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Notifikasi aktif! Kamu akan diberitahu saat ada balasan baru.</span>
        </span>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-2 mb-1 p-3.5 liquid-glass rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-[#F5B838]/10 dark:border-[#F5B838]/25 flex flex-col gap-2.5 animate-slide-down shadow-lg relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 text-neutral-500 dark:text-white/40 hover:text-neutral-800 dark:hover:text-white p-1 rounded-full cursor-pointer"
        aria-label="Tutup saran notifikasi"
      >
        <X size={15} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-[#E5A929] dark:text-[#F5B838]">
          <Bell size={16} />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-neutral-900 dark:text-white tracking-tight">
            Aktifkan Notifikasi Balasan
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-white/70 leading-relaxed mt-0.5">
            Dapatkan pemberitahuan saat karakter membalas pesanmu meski aplikasi sedang kamu tutup.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 rounded-xl text-xs text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          Nanti Saja
        </button>
        <button
          onClick={handleRequest}
          disabled={isActivating}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F5B838] hover:bg-[#E5A929] active:scale-95 text-neutral-950 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <Bell size={13} />
          <span>{isActivating ? "Meminta izin..." : "Izinkan Notifikasi"}</span>
        </button>
      </div>
    </div>
  );
};
