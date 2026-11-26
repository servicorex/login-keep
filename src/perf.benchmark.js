import { performance } from 'node:perf_hooks';

// Simulate un-cached PBKDF2 key derivation for N items
const testDerivationTime = async (iterations = 10) => {
  const enc = new TextEncoder();
  const uid = "user_test_uid_1234567890";

  console.log(`--- Measuring ${iterations} items decryption key derivation ---`);

  // UNCACHED: Re-deriving for every item
  const startUncached = performance.now();
  for (let i = 0; i < iterations; i++) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(uid),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    await crypto.subtle.deriveKey(
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
  }
  const endUncached = performance.now();
  const uncachedTotal = endUncached - startUncached;
  console.log(`Uncached (recomputing PBKDF2 per item): ${uncachedTotal.toFixed(2)} ms`);

  // CACHED: Computing once and reusing CryptoKey
  const startCached = performance.now();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const cachedKey = await crypto.subtle.deriveKey(
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
  // Reusing key for all iterations
  for (let i = 0; i < iterations; i++) {
    // Zero overhead
    const k = cachedKey;
  }
  const endCached = performance.now();
  const cachedTotal = endCached - startCached;
  console.log(`Cached in RAM (1 PBKDF2 derivation total): ${cachedTotal.toFixed(2)} ms`);
  console.log(`Speedup factor: ${(uncachedTotal / cachedTotal).toFixed(1)}x faster\n`);
};

testDerivationTime(5);
testDerivationTime(20);
