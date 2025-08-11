# Security Hardening Checklist (Pre-Deployment)

Critical fixes applied now:
- Admin login Edge Function hardened: removed raw SQL/create-function attempts; uses only verify_admin_password RPC and returns minimal admin data.
- Customer Google login: idempotent post-login processing to prevent duplicate DB linking or redirects.
- Restored fast Search access UI on delivery app hero (and ensured in-app search adds to cart).

Next actions to complete before production:
1) Supabase Auth & Providers
- Verify Authentication > URL Configuration (Site URL + Redirect URLs) match deployed domains
- Google provider: authorized domains, client ID/secret configured

2) RLS and Data Access
- Review all tables with public SELECT; restrict where possible (custom_affiliate_sites, automation_* etc.)
- Ensure policies never use TRUE for write operations unless required for service role only
- Use SECURITY DEFINER helper functions for role checks; avoid recursive policies

3) Edge Functions
- CORS strictly set; validate inputs with zod-like patterns; return 4xx for bad inputs
- Avoid service_role for read-only paths; never construct SQL; only use .from/.rpc
- Add structured logging; monitor logs in Supabase dashboard

4) Secrets and Keys
- Rotate service role key if previously used outside server; confirm it’s only in Edge Functions
- Confirm Stripe/Shopify keys stored as Supabase secrets only

5) Client Security
- Audit any innerHTML usage; if present, sanitize with DOMPurify
- Use same-site cookies/default storage for non-sensitive state; avoid writing secrets to localStorage

6) Operational
- Enable email confirmation only if required; otherwise disable for faster onboarding
- Set up monitoring/alerts for function errors and RLS violations

7) Performance/Abuse
- Consider lightweight rate limiting at the function level (IP + email) for auth endpoints

When you’re ready, I can apply RLS tightening migrations and add any missing sanitization.
