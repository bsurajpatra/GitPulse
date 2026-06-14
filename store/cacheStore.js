import Store from 'electron-store';

const store = new Store({
  name: 'github_analytics_cache',
  schema: {
    cached_stats: {
      type: 'object',
      default: {}
    }
  }
});

const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

export const getCachedData = (key) => {
  const cache = store.get('cached_stats');
  const entry = cache[key];
  
  if (entry && (Date.now() - entry.timestamp < CACHE_EXPIRY_MS)) {
    return entry.data;
  }
  return null;
};

export const setCachedData = (key, data) => {
  const cache = store.get('cached_stats');
  cache[key] = {
    timestamp: Date.now(),
    data: data
  };
  store.set('cached_stats', cache);
};

export const clearExpiredCache = () => {
  const cache = store.get('cached_stats');
  const now = Date.now();
  const cleanedCache = {};
  
  Object.entries(cache).forEach(([key, entry]) => {
    if (now - entry.timestamp < CACHE_EXPIRY_MS) {
      cleanedCache[key] = entry;
    }
  });
  
  store.set('cached_stats', cleanedCache);
};

export default { getCachedData, setCachedData, clearExpiredCache };
