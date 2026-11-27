import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  LOGOUT_BROADCAST_KEY,
  getLastActivity,
  setLastActivity,
  clearLastActivity,
  isSessionExpired,
  broadcastLogout,
} from '../utils/inactivity.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('Inactivity timeout constant is 30 minutes', () => {
  assert.equal(INACTIVITY_TIMEOUT_MS, 30 * 60 * 1000);
});

test('Session remains active before 30 minutes and expires at 30 minutes', (t) => {
  t.mock.timers.enable({ apis: ['Date'] });
  const storage = createMemoryStorage();
  const start = Date.now();
  setLastActivity(start, storage);

  // 29 minutes later -> still active
  t.mock.timers.tick(29 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), false);

  // Interact at 29 minutes -> timer resets
  setLastActivity(Date.now(), storage);
  t.mock.timers.tick(29 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), false);

  // 1 more minute (30 minutes total since last activity) -> expired
  t.mock.timers.tick(1 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), true);
});

test('Sleep/resume or reopening after >30 minutes is detected immediately', () => {
  const storage = createMemoryStorage();
  const t0 = 1_700_000_000_000;
  setLastActivity(t0, storage);

  // Simulate computer sleep for 45 minutes
  const resumedAt = t0 + 45 * 60 * 1000;
  assert.equal(isSessionExpired(resumedAt, INACTIVITY_TIMEOUT_MS, storage), true);
});

test('clearLastActivity and broadcastLogout update storage properly', () => {
  const storage = createMemoryStorage();
  setLastActivity(123456, storage);
  assert.equal(getLastActivity(storage), 123456);

  clearLastActivity(storage);
  assert.equal(storage.getItem(LAST_ACTIVITY_KEY), null);
  assert.equal(getLastActivity(storage), null);

  broadcastLogout(storage);
  assert.ok(storage.getItem(LOGOUT_BROADCAST_KEY));
});

