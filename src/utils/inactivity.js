export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const LAST_ACTIVITY_KEY = 'loginkeep_last_activity';
export const LOGOUT_BROADCAST_KEY = 'loginkeep_logout_event';
export const INACTIVITY_MESSAGE = 'Your session expired due to inactivity. Please sign in again.';

function getDefaultStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getLastActivity(storage = getDefaultStorage()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastActivity(timestamp = Date.now(), storage = getDefaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // ignore storage quota/access errors
  }
}

export function clearLastActivity(storage = getDefaultStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

export function isSessionExpired(
  now = Date.now(),
  timeoutMs = INACTIVITY_TIMEOUT_MS,
  storage = getDefaultStorage()
) {
  const last = getLastActivity(storage);
  if (last === null) return false;
  return now - last >= timeoutMs;
}

export function broadcastLogout(storage = getDefaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

