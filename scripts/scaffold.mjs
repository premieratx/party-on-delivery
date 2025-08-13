// scripts/scaffold.mjs
// One-paste installer for the Lovable Patch Pack.
// Usage:
//   node scripts/scaffold.mjs
//
// It writes drop-in files to stabilize the home page, add error boundaries,
// hardened networking, config guards, PWA scaffolding, and security headers.
// Safe by default: does NOT overwrite existing files unless you flip OVERWRITE=true.

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---- Config ----
const OVERWRITE = false; // change to true if you want to overwrite existing files

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeFile(relPath, contents) {
  const dest = path.join(ROOT, relPath);
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest) && !OVERWRITE) {
    console.log('SKIP (exists):', relPath);
    return;
  }
  fs.writeFileSync(dest, contents);
  console.log('WROTE:', relPath);
}

const TODAY = new Date().toISOString().slice(0,10);

const files = {
  "README_PATCH.md":
`# Lovable Patch Pack — Party On Delivery (${TODAY})
This pack creates drop-in components to fix a broken home page and improve reliability, security, performance, and UX.

## Quick start
1) Wrap your app with providers + error boundary (see src/main.example.tsx)
2) Fix Tailwind scan globs
3) Replace fetch() with request() from src/utils/http.ts
4) Use src/config.ts for env (VITE_*)
5) Add CSP + preconnect tags from index.head.example.html
`,

  "src/providers/AppProviders.tsx":
`import React, { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, err: any) => {
        const status = err?.status ?? err?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  );
}
`,

  "src/components/ErrorBoundary.tsx":
`import React from "react";

type Fallback = React.ReactNode | ((error: Error) => React.ReactNode);

export class ErrorBoundary extends React.Component<{ fallback?: Fallback }, { error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught", error, info);
  }
  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(this.state.error);
      return (
        fallback ?? (
          <div className="min-h-dvh grid place-items-center p-6 text-center">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">{this.state.error.message}</p>
              <button
                className="px-4 py-2 rounded-xl bg-black text-white"
                onClick={() => location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
`,

  "src/components/LoadingScreen.tsx":
`import React from "react";

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading…" }) => (
  <div className="min-h-dvh grid place-items-center p-6">
    <div className="w-full max-w-md space-y-4 text-center">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gray-200" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);
`,

  "src/components/SkeletonCard.tsx":
`import React from "react";

export const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border p-4 space-y-3 animate-pulse">
    <div className="h-40 w-full rounded-xl bg-gray-200" />
    <div className="h-4 w-3/5 rounded bg-gray-200" />
    <div className="h-4 w-2/5 rounded bg-gray-200" />
    <div className="h-9 w-full rounded-xl bg-gray-200" />
  </div>
);
`,

  "src/utils/http.ts":
`export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpError extends Error {
  status?: number;
  info?: any;
  constructor(message: string, status?: number, info?: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

type Options = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT = 12000;

export async function request<T = unknown>(url: string, opts: Options = {}): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT, retries = 1 } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "content-type": body ? "application/json" : "text/plain",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include",
      keepalive: method !== "GET",
    });
    if (!res.ok) {
      const info = await safeJson(res);
      throw new HttpError(info?.message || res.statusText, res.status, info);
    }
    return (await safeJson(res)) as T;
  } catch (err: any) {
    if (retries > 0 && (err?.name === "AbortError" || !err?.status || err?.status >= 500)) {
      await new Promise((r) => setTimeout(r, backoffDelay(retries)));
      return request<T>(url, { ...opts, retries: retries - 1 });
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

function backoffDelay(remRetries: number) {
  const attempt = remRetries;
  return 250 * Math.pow(2, attempt);
}

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
`,

  "src/config.ts":
`// Centralized runtime configuration with validation
const env = import.meta.env;

function requireEnv(key: string): string {
  const val = (env as any)[key];
  if (!val) throw new Error(\`Missing required env: \${key}\`);
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
`,

  "src/hooks/useEnv.ts":
`import { useMemo } from "react";
import { CONFIG } from "../config";

export function useEnv() {
  return useMemo(() => CONFIG, []);
}
`,

  "src/routes/home/HomeHero.tsx":
`import React from "react";

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid gap-8 md:grid-cols-2 items-center">
        <div>
          <h1 className="text-4xl/tight md:text-5xl/tight font-extrabold tracking-tight">
            Instant party & concierge delivery in Austin
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Alcohol, party kits, rentals, and more — delivered fast to your Airbnb or boat.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/shop" className="inline-flex items-center rounded-2xl px-5 py-3 bg-black text-white">
              Shop now
            </a>
            <a href="/concierge" className="inline-flex items-center rounded-2xl px-5 py-3 border">
              Book concierge
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Open late • Verified ID on delivery • No hidden fees</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </section>
  );
};
`,

  "src/routes/home/HomeHealthCheck.tsx":
`import React from "react";
import { request } from "../../utils/http";

export const HomeHealthCheck: React.FC = () => {
  const [status, setStatus] = React.useState<string>("checking…");
  React.useEffect(() => {
    (async () => {
      try {
        const data = await request<{ ok: boolean }>("/api/health", { timeoutMs: 5000, retries: 0 });
        setStatus(data.ok ? "ok" : "degraded");
      } catch (e: any) {
        setStatus(e?.message || "error");
      }
    })();
  }, []);

  return (
    <div className="fixed bottom-3 right-3 rounded-xl border bg-white/80 backdrop-blur px-3 py-2 text-xs">
      Home health: <strong>{status}</strong>
    </div>
  );
};
`,

  "src/main.example.tsx":
`import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

createRoot(rootEl).render(
  <AppProviders>
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.Suspense>
  </AppProviders>
);
`,

  "public/manifest.webmanifest":
JSON.stringify({
  name: "Party On Delivery",
  short_name: "POD",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#000000",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
  ]
}, null, 2),

  "public/security.txt":
"Contact: mailto:security@partyondelivery.com\nPolicy: https://partyondelivery.com/security\nPreferred-Languages: en\n",

  "public/_headers.example":
"# Example CDN/hosting headers (adapt for your host)\n\
/*\n\
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n\
  X-Content-Type-Options: nosniff\n\
  X-Frame-Options: DENY\n\
  Referrer-Policy: strict-origin-when-cross-origin\n\
  Permissions-Policy: geolocation=(), camera=(), microphone=()\n\
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co https://*.shopify.com https://*.stripe.com; img-src 'self' data: blob: https:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'self'; base-uri 'self';\n\
)\n",

  "index.head.example.html":
"<!-- Paste these into <head> of index.html -->\n\
<link rel=\"preconnect\" href=\"https://cdn.shopify.com\" crossorigin>\n\
<link rel=\"preconnect\" href=\"https://*.supabase.co\" crossorigin>\n\
<link rel=\"preconnect\" href=\"https://api.stripe.com\" crossorigin>\n\
\n\
<link rel=\"manifest\" href=\"/manifest.webmanifest\">\n\
<meta name=\"theme-color\" content=\"#000000\" />\n\
\n\
<!-- Basic CSP (tighten as needed) -->\n\
<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; connect-src 'self' https://*.supabase.co https://*.shopify.com https://api.stripe.com; img-src 'self' data: blob: https:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; base-uri 'self'; frame-ancestors 'self'\">\n",

  "vite.pwa.example.ts":
`import { VitePWA } from "vite-plugin-pwa";

export const pwa = VitePWA({
  registerType: "autoUpdate",
  manifest: "/public/manifest.webmanifest",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    navigateFallbackDenylist: [/^\\/api\\//],
  },
});
`,

  "config/vite.split-chunks.example.ts":
`import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2018",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-popover"],
        },
      },
    },
  },
});
`,

  "supabase/policies.example.sql":
`-- Enable RLS for tables you expose to the client
alter table public.orders enable row level security;

-- Example: a user can only see their own orders (assuming auth.users.id = orders.user_id)
create policy "Users can view own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

-- Never use service_role key on the client. Use anon key here and perform privileged ops via Edge Functions.

-- Storage example: only allow reading public bucket, signed URLs for private
`,

  "env/.env.example":
`# Required VITE_ variables for client exposure
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SHOPIFY_STOREFRONT_URL=
VITE_SHOPIFY_STOREFRONT_TOKEN=
VITE_STRIPE_PUBLISHABLE_KEY=
`,

  "tailwind.suggested-snippet.ts":
`export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" }
    },
    extend: {
      borderRadius: { xl: "1rem", "2xl": "1.5rem" }
    }
  }
};
`,
};

// Write all files
Object.entries(files).forEach(([rel, contents]) => writeFile(rel, contents));

console.log("\\nDone. Review SKIP/WROTE lines above.");
console.log("Next steps:");
console.log("  - Compare src/main.example.tsx to your src/main.tsx and align providers/ErrorBoundary.");
console.log("  - Ensure tailwind content globs are correct.");
console.log("  - Replace fetch() with request() helper.");
console.log("  - Add index.head.example.html meta into your index.html <head>.");
console.log("  - Fill env/.env.example and rename to your env file (.env.local, etc.).");
