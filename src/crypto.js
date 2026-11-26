// KeyLocker Lightweight Cryptographic Engine
// AES-256-GCM client-side encryption with random 96-bit IVs.
// Note: Derived from authenticated account context. Provides practical field-level encryption.

const getAccountKey = async (userUid) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(userUid),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
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
};

// Encrypt plaintext password using AES-256-GCM with fresh 96-bit random IV
export const encryptPassword = async (plainText, userUid) => {
  if (!plainText) return "";
  try {
    const key = await getAccountKey(userUid);
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

    let binary = "";
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return `enc::${btoa(binary)}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
};

// Decrypt ciphertext back to plaintext (supports both standard enc:: and enc::v2:: format)
export const decryptPassword = async (encryptedText, userUid) => {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc::")) {
    return encryptedText; // unencrypted legacy plaintext
  }

  try {
    // If it was saved with v2 prefix, strip appropriately
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

    const key = await getAccountKey(userUid);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    const result = dec.decode(decryptedBuffer);

    // If it was packed as a JSON object, extract password
    try {
      const parsed = JSON.parse(result);
      if (parsed && parsed.password) return parsed.password;
    } catch {
      // Not JSON, raw password string
    }

    return result;
  } catch (err) {
    console.error("Decryption error:", err);
    return "••••••••";
  }
};
