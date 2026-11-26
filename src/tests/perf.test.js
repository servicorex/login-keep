import test from 'node:test';
import assert from 'node:assert';
import {
  encryptPassword,
  decryptPassword,
  getAccountKey,
  clearCachedKey
} from '../crypto.js';

test('KeyLocker Performance & Functional Verification', async (t) => {
  const uid = 'test_user_uid_perf_123';

  await t.test('1. Encrypt and decrypt roundtrip matches exactly', async () => {
    clearCachedKey();
    const plain = 'SuperSecret123!@#';
    const cipher = await encryptPassword(plain, uid);

    assert.ok(cipher.startsWith('enc::'), 'Cipher must begin with enc:: prefix');
    assert.ok(!cipher.includes(plain), 'Ciphertext must not expose plaintext');

    const decrypted = await decryptPassword(cipher, uid);
    assert.strictEqual(decrypted, plain, 'Decrypted value must match plaintext exactly');
  });

  await t.test('2. Key caching reduces re-derivation overhead to near 0ms', async () => {
    clearCachedKey();
    const startFirst = performance.now();
    const key1 = await getAccountKey(uid);
    const firstDuration = performance.now() - startFirst;

    const startSecond = performance.now();
    const key2 = await getAccountKey(uid);
    const secondDuration = performance.now() - startSecond;

    assert.strictEqual(key1, key2, 'Cached key instance must be identical');
    assert.ok(secondDuration < 1, 'Subsequent key lookups must be under 1ms');
    console.log(`First derivation: ${firstDuration.toFixed(2)}ms, Cached retrieval: ${secondDuration.toFixed(3)}ms`);
  });

  await t.test('3. Decrypts v2 JSON payload seamlessly (backward compatibility)', async () => {
    const payload = JSON.stringify({ website: 'Netflix', password: 'legacy_pass_123' });
    const key = await getAccountKey(uid);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(payload));
    const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuf), iv.length);

    let bin = '';
    for (let i = 0; i < combined.length; i++) bin += String.fromCharCode(combined[i]);
    const v2Cipher = `enc::v2::${btoa(bin)}`;

    const recovered = await decryptPassword(v2Cipher, uid, key);
    assert.strictEqual(recovered, 'legacy_pass_123', 'Must parse and recover password from v2 JSON payload');
  });
});
