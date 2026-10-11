/**
 * Helper kriptografi untuk keamanan PIN arsip client-side.
 * Menggunakan Web Crypto API (crypto.subtle) dengan fallback SHA-256.
 */

const PIN_SALT = "waguri_pin_salt_v1_";

/**
 * Menghasilkan hash SHA-256 dari PIN dengan salt.
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = (pin || "").trim();
  if (!clean) return "";

  const salted = `${PIN_SALT}${clean}`;

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // fallback
    }
  }

  // Fallback sinkron sederhana (DJB2-like hex) jika crypto.subtle tidak tersedia
  let hash = 5381;
  for (let i = 0; i < salted.length; i++) {
    hash = ((hash << 5) + hash + salted.charCodeAt(i)) & 0xffffffff;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Cek apakah PIN yang dimasukkan cocok dengan PIN yang tersimpan.
 * Mendukung backward-compatibility untuk PIN lama yang belum di-hash.
 */
export async function verifyPin(enteredPin: string, storedPinOrHash?: string): Promise<boolean> {
  if (!storedPinOrHash) return true; // Tidak ada PIN
  const cleanEntered = (enteredPin || "").trim();
  if (!cleanEntered) return false;

  // 1. Cek apakah storedPin adalah hash SHA-256 (64 karakter hex) atau fallback hash
  const isHashed = storedPinOrHash.length === 64 || storedPinOrHash.startsWith("hash_");

  if (isHashed) {
    const enteredHash = await hashPin(cleanEntered);
    return enteredHash === storedPinOrHash;
  }

  // 2. Backward compatibility: Jika PIN lama tersimpan sebagai plaintext (misal "1234")
  return cleanEntered === storedPinOrHash;
}
