import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.removeItem("waguri_last_seen_update_id");
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B0C0F] text-white flex flex-col items-center justify-center p-6 text-center select-none font-['Inter',-apple-system,sans-serif]">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-[#F5B838] flex items-center justify-center mb-5 shadow-lg shadow-amber-500/5">
            <AlertTriangle size={32} />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white mb-2">
            Terjadi Kendala Memuat Aplikasi
          </h1>
          <p className="text-xs text-[#8A8A93] max-w-sm mb-6 leading-relaxed">
            Aplikasi mengalami galat saat memuat komponen atau pembaruan baru. Jangan khawatir, data obrolan dan karaktermu tetap aman.
          </p>

          {this.state.error && (
            <div className="mb-6 p-3 rounded-xl bg-white/[0.04] border border-white/10 max-w-sm w-full text-left overflow-x-auto text-[11px] font-mono text-red-400">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 py-3 px-4 rounded-xl bg-[#F5B838] hover:bg-[#E5AA30] text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Muat Ulang</span>
            </button>
            <button
              type="button"
              onClick={this.handleHardReset}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-white/10"
              title="Bersihkan cache dan muat ulang"
            >
              <Trash2 size={14} />
              <span>Reset Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
