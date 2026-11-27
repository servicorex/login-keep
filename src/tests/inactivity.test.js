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

test('Inactivity timeout constant is 10 minutes', () => {
  assert.equal(INACTIVITY_TIMEOUT_MS, 10 * 60 * 1000);
});

test('Session remains valid before 10 minutes, resets at minute 9, and expires at 10 minutes', (t) => {
  t.mock.timers.enable({ apis: ['Date'] });
  const storage = createMemoryStorage();
  const start = Date.now();
  setLastActivity(start, storage);

  // 9 minutes later -> still valid
  t.mock.timers.tick(9 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), false);

  // Activity at minute 9 resets the timer
  setLastActivity(Date.now(), storage);
  t.mock.timers.tick(9 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), false);

  // 1 more minute (10 minutes total since last activity) -> expired
  t.mock.timers.tick(1 * 60 * 1000);
  assert.equal(isSessionExpired(Date.now(), INACTIVITY_TIMEOUT_MS, storage), true);
});

test('Returning after 10 minutes of sleep or refreshing after expiry is detected immediately', () => {
  const storage = createMemoryStorage();
  const t0 = 1_700_000_000_000;
  setLastActivity(t0, storage);

  // Simulate computer sleep / page refresh after 10+ minutes
  const resumedAt = t0 + 10 * 60 * 1000 + 1000;
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
