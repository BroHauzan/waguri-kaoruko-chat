import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  Server,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MessageSquare,
  Crown,
  Lock,
} from "lucide-react";
import { AIProvider, ProviderType, Settings } from "../types";
import {
  GEMINI_MODEL_PRESETS,
  GEMINI_IMAGE_MODEL_PRESETS,
  getActiveProvider,
  getProviderList,
  makeProviderId,
  isProviderPaidOnly,
  BUILTIN_ATRIA_PROVIDER,
  BUILTIN_NARA_PROVIDER,
  BUILTIN_GEMINI_PROVIDER,
} from "../lib/providers";
import { isPaidUser } from "../lib/quotaService";
import { haptics } from "../lib/haptics";

interface ProviderManagerProps {
  settings: Settings;
  hapticFeedback: boolean;
  onSaveSettings: (settings: Settings) => void;
  showToast: (msg: string) => void;
  embedded?: boolean;
  onRequirePaid?: () => void;
}

const EMPTY_FORM = {
  id: "",
  name: "",
  type: "openai-compatible" as ProviderType,
  baseUrl: "",
  apiKey: "",
  model: "",
  imageModel: "gemini-3.1-flash-lite-image",
};

/** Contoh base URL supaya user tahu format yang benar. */
const BASE_URL_EXAMPLES = [
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { label: "Groq", url: "https://api.groq.com/openai/v1" },
  { label: "DeepSeek", url: "https://api.deepseek.com/v1" },
];

export const ProviderManager: React.FC<ProviderManagerProps> = ({
  settings,
  hapticFeedback,
  onSaveSettings,
  showToast,
  embedded = false,
  onRequirePaid,
}) => {
  const providers = getProviderList(settings);
  const activeProvider = getActiveProvider(settings);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showKey, setShowKey] = useState(false);

  const isNew = !form.id;

  const persist = (nextProviders: AIProvider[], nextActiveId?: string) => {
    onSaveSettings({
      ...settings,
      providers: nextProviders,
      activeProviderId: nextActiveId ?? settings.activeProviderId,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("waguri_quota_updated"));
    }
  };

  const handleSelect = (provider: AIProvider) => {
    const isPaid = isPaidUser();
    if (isProviderPaidOnly(provider) && !isPaid) {
      haptics.error(hapticFeedback);
      showToast("Provider Gemini hanya tersedia untuk akun Paid (VIP)");
      onRequirePaid?.();
      return;
    }

    haptics.light(hapticFeedback);
    persist(providers, provider.id);
    showToast(`Provider aktif: ${provider.name}`);
  };

  const openNew = () => {
    haptics.light(hapticFeedback);
    setForm({ ...EMPTY_FORM });
    setShowKey(false);
    setIsEditing(true);
  };

  const openEdit = (provider: AIProvider) => {
    haptics.light(hapticFeedback);
    setForm({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: provider.model,
      imageModel: provider.imageModel || "gemini-3.1-flash-lite-image",
    });
    setShowKey(false);
    setIsEditing(true);
  };

  const handleDelete = (provider: AIProvider) => {
    if (provider.isBuiltin) return;
    if (!confirm(`Hapus provider "${provider.name}"?`)) return;

    const next = providers.filter((p) => p.id !== provider.id);
    // Kalau yang dihapus sedang aktif, pindah ke entri pertama yang tersisa.
    const nextActiveId =
      settings.activeProviderId === provider.id
        ? next[0]?.id ?? ""
        : settings.activeProviderId;

    haptics.light(hapticFeedback);
    persist(next, nextActiveId);
    showToast("Provider dihapus");
  };

  const handleSubmit = () => {
    const name = form.name.trim();
    if (!name) {
      showToast("Nama provider wajib diisi");
      return;
    }

    if (form.type === "openai-compatible") {
      if (!form.baseUrl.trim()) {
        showToast("Base URL wajib diisi");
        return;
      }
      if (!form.model.trim()) {
        showToast("Nama model wajib diisi");
        return;
      }
    }

    const entry: AIProvider = {
      id: form.id || makeProviderId(),
      name,
      type: form.type,
      baseUrl: form.baseUrl.trim().replace(/\/+$/, ""),
      apiKey: form.apiKey.trim(),
      model: form.model.trim() || "gemini-3.1-flash-lite",
      imageModel: form.imageModel.trim() || "gemini-3.1-flash-lite-image",
      isBuiltin: form.id
        ? providers.find((p) => p.id === form.id)?.isBuiltin
        : false,
      createdAt: form.id
        ? providers.find((p) => p.id === form.id)?.createdAt ?? Date.now()
        : Date.now(),
    };

    const exists = providers.some((p) => p.id === entry.id);
    const next = exists
      ? providers.map((p) => (p.id === entry.id ? entry : p))
      : [...providers, entry];

    haptics.light(hapticFeedback);
    persist(next);
    setIsEditing(false);
    showToast(exists ? "Provider diperbarui" : "Provider ditambahkan");
  };

  return (
    <div
      className={
        embedded
          ? "flex flex-col gap-3"
          : "bg-white dark:bg-[#16171B] rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-xs flex flex-col gap-3"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!embedded && (
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-[#F5B838]/15 text-[#F5B838] flex items-center justify-center">
              <Server size={16} />
            </div>
          )}
          <div className="flex flex-col">
            <span
              className={
                embedded
                  ? "text-xs font-semibold text-neutral-500 dark:text-[#8A8A93]"
                  : "text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]"
              }
            >
              {embedded ? "Pilih provider yang dipakai:" : "Provider AI"}
            </span>
            {!embedded && (
              <span className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                Pilih sumber model yang dipakai
              </span>
            )}
          </div>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={openNew}
            className={`rounded-full bg-[#F0F1F5] dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-700 dark:text-[#C9CAD1] flex items-center gap-1 cursor-pointer transition-colors ${
              embedded
                ? "px-2.5 py-1 text-xs font-semibold"
                : "w-8 h-8 justify-center"
            }`}
            title="Tambah provider"
          >
            <Plus size={15} />
            {embedded && <span>Tambah</span>}
          </button>
        )}
      </div>

      {/* Provider list */}
      {!isEditing && (
        <div className="flex flex-col gap-2">
          {providers.map((provider) => {
            const isActive = provider.id === activeProvider.id;
            const paid = isPaidUser();
            const isPaidOnly = isProviderPaidOnly(provider);
            const isLocked = isPaidOnly && !paid;
            const isDefault = provider.id === BUILTIN_NARA_PROVIDER.id;
            const isAtria = provider.id === BUILTIN_ATRIA_PROVIDER.id || provider.name.toLowerCase().includes("atria");

            return (
              <div
                key={provider.id}
                className={`rounded-2xl border p-3 flex items-center gap-3 transition-colors ${
                  isActive
                    ? "border-[#F5B838]/60 bg-[#F5B838]/10"
                    : isLocked
                    ? "border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/[0.03]"
                    : "border-black/5 dark:border-white/10 bg-[#F8F9FA] dark:bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(provider)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-neutral-900 dark:text-[#F2F3F7] truncate">
                      {provider.name}
                    </span>

                    {/* Badge Default */}
                    {isDefault && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 uppercase">
                        Default
                      </span>
                    )}

                    {/* Badge Kuota */}
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 shrink-0">
                      {isPaidOnly
                        ? "Unlimited (VIP)"
                        : isAtria
                        ? "500 chat / hari"
                        : "200 chat / hari"}
                    </span>

                    {/* Badge VIP Paid */}
                    {isPaidOnly && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 uppercase ${
                          isLocked
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isLocked ? <Lock size={9} /> : <Crown size={9} />}
                        <span>{isLocked ? "VIP Paid Only" : "VIP Paid"}</span>
                      </span>
                    )}

                    {/* Badge Aktif */}
                    {isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5B838] text-neutral-900 shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-[11px] text-neutral-600 dark:text-[#A1A1AA] truncate flex items-center gap-1">
                      <MessageSquare size={11} className="text-[#F5B838] shrink-0" />
                      <span>Teks: {provider.model || "combo/waguriapp"}</span>
                    </span>
                    <span className="text-[11px] text-neutral-600 dark:text-[#A1A1AA] truncate flex items-center gap-1">
                      <ImageIcon size={11} className="text-pink-400 shrink-0" />
                      <span>Gambar: {provider.imageModel || "gemini-3.1-flash-lite-image"}</span>
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(provider)}
                    className="p-1.5 rounded-full text-neutral-400 dark:text-[#71717A] hover:text-neutral-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Edit provider"
                  >
                    <Pencil size={13} />
                  </button>
                  {!provider.isBuiltin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(provider)}
                      className="p-1.5 rounded-full text-neutral-400 dark:text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Hapus provider"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor */}
      {isEditing && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 dark:text-[#C9CAD1] uppercase tracking-wider">
              {isNew ? "Provider Baru" : "Edit Provider"}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-full text-neutral-400 dark:text-[#71717A] hover:text-neutral-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={15} />
            </button>
          </div>

          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93]">
              Nama
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: OpenRouter Claude"
              className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
            />
          </div>

          {/* Tipe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93]">
              Tipe
            </label>
            <div className="grid grid-cols-2 bg-[#F0F1F5] dark:bg-white/[0.06] p-1 rounded-2xl gap-1">
              {(
                [
                  { id: "gemini" as ProviderType, label: "Gemini" },
                  { id: "openai-compatible" as ProviderType, label: "OpenAI-compatible" },
                ] as const
              ).map((opt) => {
                const isSel = form.type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: opt.id,
                        model: opt.id === "gemini" && !form.model
                          ? GEMINI_MODEL_PRESETS[0]
                          : form.model,
                      })
                    }
                    className={`py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      isSel
                        ? "bg-[#F5B838] text-neutral-950 shadow-xs"
                        : "text-neutral-600 dark:text-[#8A8A93] hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base URL — hanya untuk openai-compatible */}
          {form.type === "openai-compatible" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93]">
                Base URL
              </label>
              <input
                type="url"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://openrouter.ai/api/v1"
                className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {BASE_URL_EXAMPLES.map((ex) => (
                  <button
                    key={ex.url}
                    type="button"
                    onClick={() => setForm({ ...form, baseUrl: ex.url })}
                    className="px-2 py-1 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93]">
              API Key
              {form.type === "gemini" && (
                <span className="font-normal"> (kosongkan jika menggunakan .env)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={form.type === "gemini" ? "AIza... / AQ..." : "sk-..."}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl pl-4 pr-11 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#71717A] hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                title={showKey ? "Sembunyikan" : "Tampilkan"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Model Teks (Chat) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93] flex items-center gap-1.5">
              <MessageSquare size={13} className="text-[#F5B838]" />
              <span>Model Teks (Chat)</span>
            </label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder={
                form.type === "gemini"
                  ? "gemini-3.1-flash-lite"
                  : "anthropic/claude-sonnet-4.5"
              }
              className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
            />
            {form.type === "gemini" && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {GEMINI_MODEL_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, model: m })}
                    className="px-2 py-1 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Khusus Gambar (Foto / PAP) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#8A8A93] flex items-center gap-1.5">
              <ImageIcon size={13} className="text-pink-400" />
              <span>Model Khusus Gambar (Foto / PAP)</span>
            </label>
            <input
              type="text"
              value={form.imageModel}
              onChange={(e) => setForm({ ...form, imageModel: e.target.value })}
              placeholder="gemini-3.1-flash-lite-image"
              className="bg-[#F0F1F5] dark:bg-white/[0.06] text-sm text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-2xl px-4 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-[#F5B838]/50"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GEMINI_IMAGE_MODEL_PRESETS.map((im) => (
                <button
                  key={im}
                  type="button"
                  onClick={() => setForm({ ...form, imageModel: im })}
                  className="px-2 py-1 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 text-neutral-600 dark:text-[#9B9BA3] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {im}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 rounded-full bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 font-bold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isNew ? <Plus size={15} /> : <Check size={15} />}
            <span>{isNew ? "Tambah Provider" : "Simpan Perubahan"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
