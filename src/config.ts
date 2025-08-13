// Centralized runtime configuration with validation
const env = import.meta.env;

function requireEnv(key: string): string {
  const val = (env as any)[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return String(val);
}

export const CONFIG = {
  NODE_ENV: env.MODE,
  SUPABASE_URL: requireEnv("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("VITE_SUPABASE_ANON_KEY"),
  SHOPIFY_STOREFRONT_URL: (env as any).VITE_SHOPIFY_STOREFRONT_URL ?? "",
  SHOPIFY_STOREFRONT_TOKEN: (env as any).VITE_SHOPIFY_STOREFRONT_TOKEN ?? "",
  STRIPE_PUBLISHABLE_KEY: (env as any).VITE_STRIPE_PUBLISHABLE_KEY ?? "",
};
