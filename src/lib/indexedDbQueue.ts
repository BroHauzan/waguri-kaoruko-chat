import { Character, Chat } from "../types";

export interface PendingTask {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  userMessage: string;
  chatSnapshot: Chat;
  character: Character;
  createdAt: number;
  status: "pending" | "processing" | "completed" | "failed";
  /** Lampiran gambar milik pesan ini. Sengaja hanya menyimpan base64 dan
   *  mimeType — TANPA dataUrl. dataUrl adalah duplikat base64 dengan prefix,
   *  dan menyimpannya berarti menulis payload gambar dua kali lipat ke
   *  IndexedDB pada setiap pengiriman. */
  image?: { base64: string; mimeType: string };
  /** Lampiran suara milik pesan ini, alasan yang sama seperti `image`. */
  audio?: { base64: string; mimeType: string };
  response?: {
    messages: string[];
    emotion?: string;
    intensity?: number;
  };
  error?: string;
}

const DB_NAME = "kaoruko_chat_db";
const DB_VERSION = 1;
const STORE_NAME = "pending_tasks";

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("characterId", "characterId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function enqueueTask(task: PendingTask): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(task);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // Transaksi bisa dibatalkan (mis. kuota penuh). Tanpa handler ini,
    // promise tidak pernah settle dan pemanggil menggantung.
    tx.onabort = () =>
      reject(tx.error || new Error("Transaksi IndexedDB dibatalkan."));
  });
}

export async function getPendingTasks(): Promise<PendingTask[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const all: PendingTask[] = req.result || [];
      const pending = all.filter((t) => t.status === "pending" || t.status === "processing");
      resolve(pending);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTasks(): Promise<PendingTask[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateTask(task: PendingTask): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(task);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function removeTask(taskId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(taskId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCompletedTasks(): Promise<void> {
  const all = await getAllTasks();
  const completed = all.filter((t) => t.status === "completed" || t.status === "failed");
  for (const t of completed) {
    await removeTask(t.id);
  }
}
