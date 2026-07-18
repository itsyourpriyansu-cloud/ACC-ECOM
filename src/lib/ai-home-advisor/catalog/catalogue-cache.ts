export const catalogueCache = new Map<string, { expiresAt: number; value: unknown }>()

export function readCache<T>(key: string): T | null {
  const cached = catalogueCache.get(key)
  if (!cached || cached.expiresAt < Date.now()) return null
  return cached.value as T
}

export function writeCache<T>(key: string, value: T, ttlMs = 60_000): T {
  catalogueCache.set(key, { expiresAt: Date.now() + ttlMs, value })
  return value
}
