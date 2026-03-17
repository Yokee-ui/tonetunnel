const TTL_MS = 5 * 60 * 60 * 1000; // 5 hours

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const streamCache = new Map<string, CacheEntry>();

export function getCached(videoId: string): string | null {
  const entry = streamCache.get(videoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    streamCache.delete(videoId);
    return null;
  }
  return entry.url;
}

export function setCache(videoId: string, url: string): void {
  streamCache.set(videoId, { url, expiresAt: Date.now() + TTL_MS });
}

export function deleteCache(videoId: string): void {
  streamCache.delete(videoId);
}

export function getCacheSize(): number {
  return streamCache.size;
}
