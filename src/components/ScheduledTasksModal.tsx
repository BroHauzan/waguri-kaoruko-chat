import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, X, Check, Bell, BellOff, Calendar, Play, Loader2 } from "lucide-react";
import { ScheduledTask, Character } from "../types";
import { storage } from "../lib/storage";
import { executeSingleScheduledTask } from "../lib/routineService";

interface ScheduledTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
}

export const ScheduledTasksModal: React.FC<ScheduledTasksModalProps> = ({
  isOpen,
  onClose,
  character,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("07:00");
  const [instruction, setInstruction] = useState("");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const loadTasks = () => {
    const list = storage.getScheduledTasks(character.id);
    setTasks(list);
  };

  const handleRunNow = async (task: ScheduledTask) => {
    setRunningTaskId(task.id);
    setErrorNotice(null);
    setSuccessNotice(null);
    try {
      const ok = await executeSingleScheduledTask(task, undefined, true);
      if (ok) {
        setSuccessNotice(`Pesan jadwal "${task.title}" berhasil dikirim ke riwayat chat!`);
        setTimeout(() => setSuccessNotice(null), 3500);
      } else {
        setErrorNotice("Gagal mengeksekusi pesan jadwal.");
      }
    } catch {
      setErrorNotice("Terjadi kesalahan saat mengeksekusi pesan jadwal.");
    } finally {
      setRunningTaskId(null);
      loadTasks();
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      setShowAddForm(false);
      setErrorNotice(null);
    }
  }, [isOpen, character.id]);

  if (!isOpen) return null;

  const handleToggle = (task: ScheduledTask) => {
    storage.toggleScheduledTask(task.id, !task.enabled);
    loadTasks();
  };

  const handleDelete = (taskId: string) => {
    storage.deleteScheduledTask(taskId);
    loadTasks();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorNotice("Judul jadwal wajib diisi.");
      return;
    }
    if (!time.trim()) {
      setErrorNotice("Waktu jadwal wajib dipilih.");
      return;
    }
    if (!instruction.trim()) {
      setErrorNotice("Instruksi tugas untuk karakter wajib diisi.");
      return;
    }

    const newTask: ScheduledTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      characterId: character.id,
      title: title.trim(),
      time: time.trim(),
      instruction: instruction.trim(),
      enabled: true,
      repeatDaily,
      createdAt: Date.now(),
    };

    storage.saveScheduledTask(newTask);
    setTitle("");
    setTime("07:00");
    setInstruction("");
    setRepeatDaily(true);
    setShowAddForm(false);
    setErrorNotice(null);
    loadTasks();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#16171B] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#F5B838]" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                Instruksi Terjadwal
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93]">
                {character.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-neutral-600 dark:text-[#9B9BA3] flex items-center justify-center cursor-pointer transition-colors"
            title="Tutup"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 flex flex-col gap-3">
          {errorNotice && (
            <div className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
              {errorNotice}
            </div>
          )}
          {successNotice && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
              {successNotice}
            </div>
          )}

          {/* Form Tambah Jadwal */}
          {showAddForm ? (
            <form onSubmit={handleCreateTask} className="bg-neutral-50 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-[#E4E5EA]">
                  Buat Jadwal Baru
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">
                  Nama Jadwal
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sapaan Pagi"
                  className="bg-white dark:bg-white/[0.08] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg px-3 py-2 border border-neutral-200 dark:border-white/10 focus:outline-none focus:border-[#F5B838]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">
                    Waktu (Jam : Menit)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-white dark:bg-white/[0.08] text-xs text-neutral-900 dark:text-[#F2F3F7] rounded-lg px-3 py-2 border border-neutral-200 dark:border-white/10 focus:outline-none focus:border-[#F5B838]"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-end pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-[#C9CAD1]">
                    <input
                      type="checkbox"
                      checked={repeatDaily}
                      onChange={(e) => setRepeatDaily(e.target.checked)}
                      className="accent-[#F5B838] w-4 h-4 rounded cursor-pointer"
                    />
                    <span>Ulangi Setiap Hari</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-[#9B9BA3]">
                  Instruksi untuk Karakter
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Sapa hangat, tanya apakah tidurnya nyenyak dan ingatkan untuk sarapan"
                  className="bg-white dark:bg-white/[0.08] text-xs text-neutral-900 dark:text-[#F2F3F7] placeholder:text-neutral-400 dark:placeholder:text-white/35 rounded-lg p-2.5 border border-neutral-200 dark:border-white/10 focus:outline-none focus:border-[#F5B838] resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#F5B838] hover:bg-[#E5A929] text-neutral-950 text-xs font-bold transition-colors cursor-pointer shadow-xs mt-1"
              >
                Simpan Jadwal
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-white/20 hover:border-[#F5B838] dark:hover:border-[#F5B838] text-neutral-600 dark:text-[#C9CAD1] hover:text-[#F5B838] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Tambah Jadwal Tugas Baru</span>
            </button>
          )}

          {/* List Jadwal */}
          {tasks.length === 0 && !showAddForm ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-neutral-400 dark:text-[#71717A] gap-2">
              <Calendar size={28} className="opacity-40" />
              <p className="text-xs">Belum ada instruksi terjadwal untuk karakter ini.</p>
              <p className="text-[11px] max-w-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
                Kamu dapat membuat jadwal agar {character.name} menyapa atau mengingatkan sesuatu secara otomatis pada jam tertentu.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-xl p-3 flex items-start justify-between gap-2.5 transition-colors ${
                    task.enabled
                      ? "bg-white dark:bg-[#1C1D22] border-black/5 dark:border-white/10 shadow-2xs"
                      : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-neutral-900 dark:text-[#F2F3F7]">
                        {task.time}
                      </span>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-[#E4E5EA] truncate">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-[#A1A1AA]">
                        {task.repeatDaily ? "Harian" : "Sekali"}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-[#8A8A93] mt-1 line-clamp-2 leading-relaxed">
                      "{task.instruction}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {/* Uji Coba / Kirim Sekarang */}
                    <button
                      type="button"
                      disabled={runningTaskId === task.id}
                      onClick={() => handleRunNow(task)}
                      className="p-1.5 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 text-[#B45309] dark:text-[#F5B838] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      title="Uji coba kirim pesan jadwal ini sekarang"
                    >
                      {runningTaskId === task.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Play size={14} className="fill-current" />
                      )}
                    </button>

                    {/* Toggle Sakelar */}
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        task.enabled
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-neutral-200 dark:bg-white/10 text-neutral-400"
                      }`}
                      title={task.enabled ? "Nonaktifkan jadwal" : "Aktifkan jadwal"}
                    >
                      {task.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>

                    {/* Hapus */}
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Hapus jadwal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-100 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.14] text-xs font-semibold text-neutral-700 dark:text-[#C9CAD1] transition-colors cursor-pointer text-center"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
