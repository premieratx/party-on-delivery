# Lovable Patch Pack — Party On Delivery (2025-08-13)
This pack creates drop-in components to fix a broken home page and improve reliability, security, performance, and UX.

## Quick start
1) Wrap your app with providers + error boundary (see src/main.example.tsx)
2) Fix Tailwind scan globs
3) Replace fetch() with request() from src/utils/http.ts
4) Use src/config.ts for env (VITE_*)
5) Add CSP + preconnect tags from index.head.example.html
