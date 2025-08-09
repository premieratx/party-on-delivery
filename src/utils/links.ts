// Centralized URL helpers for canonical domain usage
// IMPORTANT: All shareable links should use the canonical domain, not window.location.origin

export const CANONICAL_DOMAIN = 'https://order.partyondelivery.com';

export const buildAppUrl = (appSlug: string) => `${CANONICAL_DOMAIN}/app/${appSlug}`;
export const buildShortUrl = (shortPath: string) => `${CANONICAL_DOMAIN}/${shortPath}`;
export const buildJoinUrl = (shareToken: string) => `${CANONICAL_DOMAIN}/join/${shareToken}`;
export const buildRootQueryUrl = (query: string) => `${CANONICAL_DOMAIN}/?${query.replace(/^\?/, '')}`;
