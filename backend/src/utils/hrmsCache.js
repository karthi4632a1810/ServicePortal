const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const store = new Map();

export function getHrmsCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setHrmsCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearHrmsCache(key) {
  if (key) store.delete(key);
  else store.clear();
}
