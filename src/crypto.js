// KeyLocker Zero-Knowledge Cryptographic Engine
// AES-256-GCM + PBKDF2-HMAC-SHA256 (600,000 iterations)
// Supports full payload encryption, emergency recovery, and backward compatibility with v1

export const PBKDF2_ITERATIONS = 600000;

// Utility: convert Uint8Array to hex string
export const bytesToHex = (bytes) => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Utility: convert hex string to Uint8Array
export const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

// Generate 16 bytes cryptographically secure random salt
export const generateUserSalt = () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(salt);
};

// Generate 24-character clean Emergency Recovery Code (e.g. "A7B9-KD24-91MX-LL09-W4Q1-Z8P3")
export const generateRecoveryKey = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, 1, I, O
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  let code = '';
  for (let i = 0; i < 24; i++) {
    code += chars[randomBytes[i] % chars.length];
    if ((i + 1) % 4 === 0 && i !== 23) {
      code += '-';
    }
  }
  return code;
};

// Derive AES-GCM Key from Master Password + Salt
export const deriveMasterKey = async (masterPassword, saltHex) => {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true, // Extractable to export raw key for verifier computation
    ["encrypt", "decrypt"]
  );
};

// Derive Key from Emergency Recovery Code
export const deriveKeyFromRecoveryCode = async (recoveryCode, saltHex) => {
  const cleanCode = recoveryCode.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
  const enc = new TextEncoder();
  const codeKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(cleanCode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: 100000,
      hash: "SHA-256"
    },
    codeKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Compute Key Verifier (SHA-256 hash of derived key bytes)
export const computeKeyVerifier = async (key) => {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", rawKey);
  return bytesToHex(new Uint8Array(hashBuffer));
};

// Encrypt full payload object into ciphertext with version prefix
export const encryptFullPayload = async (payloadObj, key) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit CSPRNG nonce
  const plainBytes = enc.encode(JSON.stringify(payloadObj));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plainBytes
  );

  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  // Convert to Base64
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return `enc::v2::${btoa(binary)}`;
};

// Decrypt full payload object
export const decryptFullPayload = async (encryptedString, key) => {
  if (!encryptedString || !encryptedString.startsWith('enc::v2::')) {
    throw new Error('Not a v2 encrypted payload');
  }

  const base64Data = encryptedString.slice('enc::v2::'.length);
  const binary = atob(base64Data);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const cipherData = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherData
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuffer));
};

// -------------------------------------------------------------
// Legacy v1 Fallback Support (For Safe Non-Destructive Migration)
// -------------------------------------------------------------
const getLegacyUidKey = async (userUid) => {
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
    ["decrypt"]
  );
};

export const decryptLegacyPassword = async (encryptedText, userUid) => {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc::")) {
    return encryptedText; // plaintext legacy
  }

  try {
    const base64Data = encryptedText.slice(5);
    const binary = atob(base64Data);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    const key = await getLegacyUidKey(userUid);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Legacy decryption error:", err);
    return "••••••••";
  }
};
