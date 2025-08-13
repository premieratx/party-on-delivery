// Centralized runtime configuration with validation
const env = import.meta.env;

function getEnvVar(key: string, fallback?: string): string {
  const val = (env as any)[key];
  if (!val && fallback === undefined) {
    console.warn(`Environment variable ${key} is not set`);
    return "";
  }
  return String(val || fallback || "");
}

export const CONFIG = {
  NODE_ENV: env.MODE,
  SUPABASE_URL: getEnvVar("VITE_SUPABASE_URL", "https://acmlfzfliqupwxwoefdq.supabase.co"),
  SUPABASE_ANON_KEY: getEnvVar("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWxmemZsaXF1cHd4d29lZmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQxNTQsImV4cCI6MjA2ODUxMDE1NH0.1U3U-0IlnYFo55090c2Cg4AgP9IQs-xQB6xTom8Xcns"),
  SHOPIFY_STOREFRONT_URL: getEnvVar("VITE_SHOPIFY_STOREFRONT_URL", ""),
  SHOPIFY_STOREFRONT_TOKEN: getEnvVar("VITE_SHOPIFY_STOREFRONT_TOKEN", ""),
  STRIPE_PUBLISHABLE_KEY: getEnvVar("VITE_STRIPE_PUBLISHABLE_KEY", ""),
};
