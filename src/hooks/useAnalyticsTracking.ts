// COMPLETELY DISABLED TO PREVENT POSTHOG RATE LIMITING ERRORS
// DO NOT RESTORE - This was causing continuous PostHog rate limiting errors

console.log('🚫 Analytics tracking DISABLED to prevent PostHog rate limiting');

export const useAnalyticsTracking = () => {
  // All analytics functions disabled
  return null;
};