import { supabase } from '@/integrations/supabase/client';

// Simple, fast, normalized instant cache client with in-memory TTL + single-flight
interface InstantOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

type InstantPayload = {
  collections: any[];
  products: any[];
  categories?: any[];
};

let __instantData: InstantPayload | null = null;
let __instantAt = 0;
let __instantInflight: Promise<InstantPayload> | null = null;
const INSTANT_TTL = 2 * 60 * 1000; // 2 minutes

let __collectionsCache: any[] | null = null;
let __collectionsAt = 0;
const COLLECTIONS_TTL = 10 * 60 * 1000; // 10 minutes

function normalizeInstantData(raw: any): InstantPayload {
  // The edge function responses vary in shape across callers; normalize it
  const candidate = raw?.data ?? raw;
  const collections = candidate?.collections ?? [];
  const products = candidate?.products ?? [];
  const categories = candidate?.categories ?? [];
  return { collections, products, categories };
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: () => T): Promise<T> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(fallback()), ms);
    p.then((v) => {
      clearTimeout(to);
      resolve(v);
    }).catch(() => {
      clearTimeout(to);
      resolve(fallback());
    });
  });
}

export async function getInstantProducts(options: InstantOptions = {}): Promise<InstantPayload> {
  const { forceRefresh = false, timeoutMs = 400 } = options; // default very fast timeout
  const now = Date.now();

  if (!forceRefresh && __instantData && now - __instantAt < INSTANT_TTL) {
    return __instantData;
  }

  if (!forceRefresh && __instantInflight) {
    // Return quickly but also race with timeout to avoid jank
    return withTimeout(
      __instantInflight,
      timeoutMs,
      () => __instantData ?? { collections: [], products: [], categories: [] }
    );
  }

  __instantInflight = (async () => {
    const { data, error } = await supabase.functions.invoke('instant-product-cache', {
      body: { forceRefresh },
    });
    if (error) throw error;

    // Some versions return { success, data }, others return the payload directly
    const payload = normalizeInstantData(data?.success ? data?.data : data);
    __instantData = payload;
    __instantAt = Date.now();
    return payload;
  })();

  try {
    return await withTimeout(
      __instantInflight,
      timeoutMs,
      () => __instantData ?? { collections: [], products: [], categories: [] }
    );
  } finally {
    __instantInflight = null;
  }
}

export async function getAllCollectionsCached(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && __collectionsCache && now - __collectionsAt < COLLECTIONS_TTL) {
    return __collectionsCache;
  }

  const { data, error } = await supabase.functions.invoke('get-all-collections');
  if (error) throw error;
  const collections = data?.collections ?? [];
  __collectionsCache = collections;
  __collectionsAt = Date.now();
  return collections;
}
