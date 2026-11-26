// KeyLocker Lightweight Cryptographic Engine
// Optimized with in-memory key caching for sub-millisecond encryption/decryption.

let cachedAccountKey = null;
let cachedKeyUid = null;

// Get or derive AES-GCM key once per authenticated session
export const getAccountKey = async (userUid) => {
  if (cachedAccountKey && cachedKeyUid === userUid) {
    return cachedAccountKey;
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(userUid),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derived = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("keylocker_vault_salt_v1"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  cachedAccountKey = derived;
  cachedKeyUid = userUid;
  return derived;
};

// Clear cached key on sign-out
export const clearCachedKey = () => {
  cachedAccountKey = null;
  cachedKeyUid = null;
};

// Fast single-pass Base64 encoder without string concatenation loop
const bufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + chunkSize, len))
    );
  }
  return btoa(binary);
};

// Encrypt plaintext password using AES-256-GCM with fresh 96-bit random IV
export const encryptPassword = async (plainText, userUid, preloadedKey = null) => {
  if (!plainText) return "";
  try {
    const key = preloadedKey || await getAccountKey(userUid);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit unique IV
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return `enc::${bufferToBase64(combined)}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
};

// Decrypt ciphertext back to plaintext
export const decryptPassword = async (encryptedText, userUid, preloadedKey = null) => {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc::")) {
    return encryptedText; // unencrypted legacy plaintext
  }

  try {
    let base64Data = encryptedText;
    if (base64Data.startsWith("enc::v2::")) {
      base64Data = base64Data.slice("enc::v2::".length);
    } else {
      base64Data = base64Data.slice("enc::".length);
    }

    const binary = atob(base64Data);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    const key = preloadedKey || await getAccountKey(userUid);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    const result = dec.decode(decryptedBuffer);

    // If it was packed as JSON object, extract password
    try {
      const parsed = JSON.parse(result);
      if (parsed && parsed.password) return parsed.password;
    } catch {
      // not JSON
    }

    return result;
  } catch (err) {
    console.error("Decryption error:", err);
    return "••••••••";
  }
};
