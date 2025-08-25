# 🚨 CRITICAL: Admin Security Documentation

## The Bug That Broke Everything

### What Happened
The admin interface stopped working because cached sessions were skipping the `verify-admin-google` edge function call. This function does TWO critical things:

1. **Verification**: Checks if the user is an admin
2. **Context Setting**: Calls `set_admin_context()` which is REQUIRED for RLS policies

When cached sessions skipped this call, they got verification but missed context setting, causing all database operations to fail with "permission denied" errors.

### Root Cause
- `AdminSessionManager` was designed to "optimize" by avoiding "unnecessary" API calls
- The cached session logic bypassed `verify-admin-google` completely
- RLS policies depend on `is_admin_user_enhanced()` which requires admin context
- No admin context = RLS policies fail = broken admin functionality

## Prevention Measures Implemented

### 1. Mandatory Context Setting
- **NEVER** skip the `verify-admin-google` call, even for cached sessions
- Added explicit security logging with `🔐 SECURITY:` prefix
- Made context setting failures immediately clear cached sessions

### 2. Health Monitoring System
- `AdminHealthMonitor` class tests admin functionality every 5 minutes
- Automatic alerts if admin context is missing
- Force refresh capability to fix issues

### 3. Enhanced Error Handling
- Better error messages that distinguish between verification and context issues
- Automatic session clearing on context failures
- Toast notifications for security errors

### 4. Security-First Logging
- All admin auth operations now have detailed security logging
- Clear indicators when cached sessions are used
- Explicit warnings about RLS context requirements

## Critical Files - DO NOT MODIFY WITHOUT UNDERSTANDING

### `src/components/admin/RequireAdmin.tsx`
**CRITICAL FUNCTIONS:**
- Always calls `verify-admin-google` for cached sessions (lines 100-138)
- Sets admin context required for RLS policies
- **NEVER** remove the context setting logic

### `supabase/functions/verify-admin-google/index.ts`
**CRITICAL FUNCTIONS:**
- Verifies admin status (lines 38-50)
- Sets admin context via `set_admin_context` RPC (lines 54-65)
- **BOTH** functions are required - removing either breaks admin

### `src/utils/adminHealthCheck.ts`
**PREVENTION SYSTEM:**
- Monitors admin functionality automatically
- Detects when RLS context is missing
- Provides emergency context refresh

## How Admin Authentication Works

```
1. User clicks "Sign in with Google"
2. Google OAuth redirects back with auth code
3. Supabase exchanges code for session
4. RequireAdmin component detects session
5. Calls verify-admin-google edge function
6. Edge function:
   a) Checks admin_users table
   b) Calls set_admin_context RPC  ← CRITICAL FOR RLS
7. RLS policies now allow admin operations
8. Session is cached for future use
9. Cached sessions STILL call verify-admin-google for context
```

## Emergency Procedures

### If Admin Functionality Breaks Again:

1. **Check Console Logs**
   - Look for `🚨 SECURITY:` messages
   - Check if context setting failed

2. **Run Health Check**
   ```javascript
   import { adminHealthMonitor } from '@/utils/adminHealthCheck';
   const status = await adminHealthMonitor.checkAdminHealth();
   console.log(status);
   ```

3. **Force Context Refresh**
   ```javascript
   const fixed = await adminHealthMonitor.forceAdminContextRefresh('admin@email.com');
   ```

4. **Clear All Admin Sessions**
   ```javascript
   import { AdminSessionManager } from '@/utils/sessionPersistence';
   AdminSessionManager.clearAdminSession();
   ```

## Rules to Prevent Future Issues

### ✅ DO:
- Always call `verify-admin-google` for ALL admin sessions
- Check admin health before critical operations
- Use security logging prefixes
- Clear sessions on any context failures

### ❌ NEVER:
- Skip `verify-admin-google` calls for "optimization"
- Remove context setting from the edge function  
- Assume cached sessions have proper RLS context
- Modify RLS policies without understanding context requirements

## Database Dependencies

### RLS Policies That Require Admin Context:
- `delivery_app_variations` - "Admins can manage delivery apps"
- `storage.objects` - "Admin users can upload app assets"

### Functions That Set Context:
- `set_admin_context(admin_email)` - Sets context for RLS
- `is_admin_user_enhanced()` - Checks context in RLS policies

**Breaking any of these breaks admin functionality!**

## Testing Admin Functionality

Before deploying changes to admin code:

1. Log out of admin dashboard
2. Log back in with Google OAuth
3. Try creating a delivery app
4. Try uploading a logo
5. Check console for security warnings

If any step fails, the bug is back!