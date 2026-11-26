import test from 'node:test';
import assert from 'node:assert';

// Implementation of crypto primitives to verify before writing to production code
const PBKDF2_ITERATIONS = 600000;

// Generate 16 bytes random salt
const generateSalt = () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

// Derive AES-GCM Key from Master Password + Salt
const deriveMasterKey = async (masterPassword, saltHex) => {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
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
    true, // extractable for verifier hash
    ["encrypt", "decrypt"]
  );
};

// Compute verification hash (SHA-256 of raw key bytes)
const computeKeyVerifier = async (key) => {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", rawKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Encrypt full payload
const encryptFullPayload = async (payloadObj, key) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit unique nonce
  const plainBytes = enc.encode(JSON.stringify(payloadObj));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plainBytes
  );

  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  return `enc::v2::${Buffer.from(combined).toString('base64')}`;
};

// Decrypt full payload
const decryptFullPayload = async (encryptedString, key) => {
  if (!encryptedString.startsWith('enc::v2::')) {
    throw new Error('Invalid version');
  }
  const base64 = encryptedString.slice('enc::v2::'.length);
  const combined = Buffer.from(base64, 'base64');
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuffer));
};

// Test Suite
test('Crypto Unit Tests: PBKDF2 + AES-GCM-256 Full Payload', async (t) => {
  await t.test('derives key and verifies keyVerifier consistency', async () => {
    const password = "SuperSecretMasterPassword123!";
    const salt = generateSalt();
    const key1 = await deriveMasterKey(password, salt);
    const verifier1 = await computeKeyVerifier(key1);

    const key2 = await deriveMasterKey(password, salt);
    const verifier2 = await computeKeyVerifier(key2);

    assert.strictEqual(verifier1, verifier2, "Key verifiers must match for identical password & salt");
  });

  await t.test('wrong password produces different verifier', async () => {
    const salt = generateSalt();
    const key1 = await deriveMasterKey("PasswordA", salt);
    const key2 = await deriveMasterKey("PasswordB", salt);

    const verifier1 = await computeKeyVerifier(key1);
    const verifier2 = await computeKeyVerifier(key2);

    assert.notStrictEqual(verifier1, verifier2, "Different passwords must produce different verifiers");
  });

  await t.test('encrypts and decrypts full payload (website, username, password, url)', async () => {
    const salt = generateSalt();
    const key = await deriveMasterKey("MyVaultKey2026", salt);

    const originalData = {
      website: "GitHub",
      url: "https://github.com/login",
      username: "dev_user",
      password: "SuperSecretToken#999!",
      notes: "Personal API access token"
    };

    const ciphertext = await encryptFullPayload(originalData, key);
    assert.ok(ciphertext.startsWith('enc::v2::'), "Ciphertext must have v2 prefix");
    assert.ok(!ciphertext.includes("GitHub"), "Website must not appear in ciphertext");
    assert.ok(!ciphertext.includes("dev_user"), "Username must not appear in ciphertext");
    assert.ok(!ciphertext.includes("SuperSecretToken"), "Password must not appear in ciphertext");

    const decrypted = await decryptFullPayload(ciphertext, key);
    assert.deepStrictEqual(decrypted, originalData, "Decrypted data must match original exactly");
  });

  await t.test('tampered ciphertext fails AES-GCM tag verification', async () => {
    const salt = generateSalt();
    const key = await deriveMasterKey("MyVaultKey2026", salt);
    const originalData = { password: "Secret" };
    const ciphertext = await encryptFullPayload(originalData, key);

    // Tamper with one byte in the base64 payload
    const prefix = 'enc::v2::';
    const b64 = ciphertext.slice(prefix.length);
    const tamperedB64 = b64.slice(0, 15) + (b64[15] === 'A' ? 'B' : 'A') + b64.slice(16);

    await assert.rejects(
      async () => {
        await decryptFullPayload(`${prefix}${tamperedB64}`, key);
      },
      "Tampered ciphertext must reject during decryption"
    );
  });
});

