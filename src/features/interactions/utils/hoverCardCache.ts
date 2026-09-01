type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
};

const caches = new Map<string, Map<string, CacheEntry<unknown>>>();

function bucket(name: string): Map<string, CacheEntry<unknown>> {
  const existing = caches.get(name);
  if (existing) return existing;
  const created = new Map<string, CacheEntry<unknown>>();
  caches.set(name, created);
  return created;
}

export function loadCached<T>(name: string, key: string, load: () => Promise<T>): Promise<T> {
  const store = bucket(name);
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing?.value !== undefined) return Promise.resolve(existing.value);
  if (existing?.promise) return existing.promise;

  const promise = load()
    .then((value) => {
      store.set(key, { value });
      return value;
    })
    .catch((error) => {
      store.delete(key);
      throw error;
    });

  store.set(key, { promise });
  return promise;
}
