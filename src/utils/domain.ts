// Centralized domain config
// Use this for OAuth redirectTo and any absolute URL needs
export const CANONICAL_DOMAIN = "https://4d4f38fe-7641-4582-bf97-1945b0dbb2a3.lovableproject.com";

// Optional helper to get absolute URL on canonical domain
export const canonicalUrl = (path: string) => {
  if (!path.startsWith("/")) path = "/" + path;
  return `${CANONICAL_DOMAIN}${path}`;
};
