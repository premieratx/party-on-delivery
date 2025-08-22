// Centralized URL helpers for canonical domain usage
// IMPORTANT: All shareable links should use the canonical domain, not window.location.origin

export const CANONICAL_DOMAIN = 'https://4d4f38fe-7641-4582-bf97-1945b0dbb2a3.lovableproject.com';

export const buildAppUrl = (appSlug: string) => `${CANONICAL_DOMAIN}/app/${appSlug}`;
export const buildShortUrl = (shortPath: string) => `${CANONICAL_DOMAIN}/${shortPath}`;
export const buildJoinUrl = (shareToken: string) => `${CANONICAL_DOMAIN}/join/${shareToken}`;
export const buildRootQueryUrl = (query: string) => `${CANONICAL_DOMAIN}/?${query.replace(/^\?/, '')}`;

// New helpers for affiliate short links
export const buildAffiliateUrl = (affiliateCode: string) => `${CANONICAL_DOMAIN}/${affiliateCode}`;
export const buildAppAffiliateUrl = (appShortPath: string, affiliateCode: string) => `${CANONICAL_DOMAIN}/${appShortPath}/${affiliateCode}`;

// Cover page URL helper
export const buildCoverPageUrl = (slug: string) => `${CANONICAL_DOMAIN}/cover/${slug}`;
