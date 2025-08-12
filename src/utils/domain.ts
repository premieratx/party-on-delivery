// Centralized domain config
// Use this for OAuth redirectTo and any absolute URL needs
export const CANONICAL_DOMAIN = "https://order.partyondelivery.com";

// Optional helper to get absolute URL on canonical domain
export const canonicalUrl = (path: string) => {
  if (!path.startsWith("/")) path = "/" + path;
  return `${CANONICAL_DOMAIN}${path}`;
};
