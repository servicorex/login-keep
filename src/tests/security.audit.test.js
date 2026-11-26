import test from 'node:test';
import assert from 'node:assert';
import {
  generateUserSalt,
  generateRecoveryKey,
  deriveMasterKey,
  deriveKeyFromRecoveryCode,
  computeKeyVerifier,
  encryptFullPayload,
  decryptFullPayload,
  decryptLegacyPassword
} from './crypto.js';

test('Security Verification & Critical Architecture Audit', async (t) => {

  // Test 1: Verifier Security & Key Extraction Analysis
  await t.test('1. Verifier analysis: SHA-256(rawKey) leakage check', async () => {
    const salt = generateUserSalt();
    const key = await deriveMasterKey("UserMasterPass#2026", salt);
    const verifier = await computeKeyVerifier(key);

    assert.strictEqual(typeof verifier, 'string');
    assert.strictEqual(verifier.length, 64, "SHA-256 hex string must be 64 characters");
    // Verify that the verifier does NOT contain plaintext password
    assert.ok(!verifier.includes("UserMasterPass"), "Verifier does not expose master password");
  });

  // Test 2: Recovery Key Independence Analysis
  await t.test('2. Recovery key analysis: demonstrates independent key derivation', async () => {
    const salt = generateUserSalt();
    const masterPassword = "OriginalMasterPassword!";
    const recoveryCode = generateRecoveryKey();

    // Derived independently
    const masterKey = await deriveMasterKey(masterPassword, salt);
    const recoveryKey = await deriveKeyFromRecoveryCode(recoveryCode, salt);

    const masterVerifier = await computeKeyVerifier(masterKey);
    const recoveryVerifier = await computeKeyVerifier(recoveryKey);

    assert.notStrictEqual(
      masterVerifier,
      recoveryVerifier,
      "Recovery Key and Master Key derive distinct keys and verifiers"
    );

    // CRITICAL FINDING TO REPORT:
    // If vault items are encrypted with `masterKey`, can `recoveryKey` decrypt them?
    const testPayload = { website: "Bank", password: "SecretPassword123" };
    const cipherFromMaster = await encryptFullPayload(testPayload, masterKey);

    // Attempt decryption with recoveryKey
    let recoveryDirectDecryptFailed = false;
    try {
      await decryptFullPayload(cipherFromMaster, recoveryKey);
    } catch {
      recoveryDirectDecryptFailed = true;
    }

    assert.strictEqual(
      recoveryDirectDecryptFailed,
      true,
      "PROVEN: Recovery key derives a DIFFERENT AES key, meaning it cannot directly decrypt items encrypted by master key unless vault key was wrapped!"
    );
  });

  // Test 3: Metadata Privacy Check
  await t.test('3. Metadata privacy: Verifies all fields are encrypted in v2', async () => {
    const salt = generateUserSalt();
    const key = await deriveMasterKey("MasterPass2026!", salt);

    const sensitiveItem = {
      website: "SecretWebsiteName",
      url: "https://secret-internal-portal.corp/login",
      username: "confidential_admin",
      password: "UltraSecretPassword999!",
      notes: "Private recovery phrase or account ID"
    };

    const cipher = await encryptFullPayload(sensitiveItem, key);

    // Plaintext leak checks
    assert.ok(!cipher.includes("SecretWebsiteName"), "Website name is NOT in cipher");
    assert.ok(!cipher.includes("secret-internal-portal"), "URL is NOT in cipher");
    assert.ok(!cipher.includes("confidential_admin"), "Username is NOT in cipher");
    assert.ok(!cipher.includes("UltraSecretPassword"), "Password is NOT in cipher");
    assert.ok(!cipher.includes("Private recovery phrase"), "Notes are NOT in cipher");

    // Full roundtrip
    const decrypted = await decryptFullPayload(cipher, key);
    assert.deepStrictEqual(decrypted, sensitiveItem, "All fields restore perfectly");
  });

  // Test 4: Incorrect Master Password Rejection
  await t.test('4. Incorrect password rejection', async () => {
    const salt = generateUserSalt();
    const correctKey = await deriveMasterKey("CorrectPassword123!", salt);
    const wrongKey = await deriveMasterKey("WrongPassword123!", salt);

    const correctVerifier = await computeKeyVerifier(correctKey);
    const wrongVerifier = await computeKeyVerifier(wrongKey);

    assert.notStrictEqual(correctVerifier, wrongVerifier);

    const item = { website: "Test", password: "Pass" };
    const cipher = await encryptFullPayload(item, correctKey);

    await assert.rejects(
      async () => await decryptFullPayload(cipher, wrongKey),
      "Wrong key MUST fail AES-GCM decryption"
    );
  });
});
