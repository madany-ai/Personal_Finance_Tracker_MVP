interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * جلب البيانات مع كاش ذكي في المتصفح لمنع تكرار الاستعلامات على قاعدة بيانات Neon
 * يقلل استهلاك باقة Neon المجانية ويجعل التنقل بين الصفحات لحظيًا (0 ثانية)
 */
export async function fetchWithClientCache<T>(
  url: string,
  options: {
    ttlMs?: number; // الافتراضي 45 ثانية
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const { ttlMs = 45000, forceRefresh = false } = options;
  const now = Date.now();
  const cached = memoryCache.get(url);

  if (!forceRefresh && cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل جلب البيانات' }));
    throw new Error(err.error || 'فشل جلب البيانات');
  }

  const data = await res.json();
  memoryCache.set(url, { data, timestamp: now });
  return data as T;
}

/**
 * إبطال الكاش فور تسجيل عملية أو تعديل حساب لضمان دقة الأرقام فورًا
 */
export function invalidateClientCache(urlPrefix?: string) {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}
