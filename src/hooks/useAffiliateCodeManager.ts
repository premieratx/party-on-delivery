import { useState, useEffect, useCallback } from 'react';

interface AffiliateCodeState {
  code: string | null;
  source: 'url' | 'group_order' | 'custom_site' | 'manual' | null;
  autoApplied: boolean;
}

/**
 * Manages affiliate codes with proper isolation and prevents unwanted auto-application
 * Only auto-applies codes when:
 * 1. User arrives via affiliate link (/a/:code)
 * 2. User joins group order with affiliate code
 * 3. User visits custom affiliate site
 */
export function useAffiliateCodeManager() {
  const [affiliateState, setAffiliateState] = useState<AffiliateCodeState>({
    code: null,
    source: null,
    autoApplied: false
  });

  // Clear any stored affiliate codes on new session start
  const clearStoredAffiliateCodes = useCallback(() => {
    localStorage.removeItem('affiliate_code');
    localStorage.removeItem('affiliateCode');
    localStorage.removeItem('affiliateReferral');
    
    // Only preserve if it's from a valid source in current session
    const sessionSource = sessionStorage.getItem('affiliate_source');
    if (!sessionSource) {
      setAffiliateState({
        code: null,
        source: null,
        autoApplied: false
      });
    }
  }, []);

  // Apply affiliate code from specific source
  const applyAffiliateCode = useCallback((code: string, source: AffiliateCodeState['source']) => {
    console.log(`🏷️ Applying affiliate code: ${code} from ${source}`);
    
    setAffiliateState({
      code,
      source,
      autoApplied: source !== 'manual'
    });

    // Store in session storage to persist during the session only
    sessionStorage.setItem('affiliate_code', code);
    sessionStorage.setItem('affiliate_source', source || '');
    
    // Only store in localStorage for specific sources
    if (source === 'custom_site' || source === 'url') {
      localStorage.setItem('affiliate_code', code);
    }
  }, []);

  // Manual code application (user entered)
  const setManualAffiliateCode = useCallback((code: string) => {
    applyAffiliateCode(code, 'manual');
  }, [applyAffiliateCode]);

  // Clear affiliate code
  const clearAffiliateCode = useCallback(() => {
    setAffiliateState({
      code: null,
      source: null,
      autoApplied: false
    });
    
    localStorage.removeItem('affiliate_code');
    localStorage.removeItem('affiliateCode');
    localStorage.removeItem('affiliateReferral');
    sessionStorage.removeItem('affiliate_code');
    sessionStorage.removeItem('affiliate_source');
  }, []);

  // Check for affiliate code from URL parameter
  const checkUrlForAffiliateCode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('affiliate') || urlParams.get('ref');
    
    // Also check if we're on an affiliate landing page
    const pathMatch = window.location.pathname.match(/^\/a\/([^\/]+)/);
    const codeFromPath = pathMatch?.[1];
    
    const code = codeFromUrl || codeFromPath;
    
    if (code && code !== affiliateState.code) {
      applyAffiliateCode(code, 'url');
      return code;
    }
    
    return null;
  }, [affiliateState.code, applyAffiliateCode]);

  // Check for group order affiliate code
  const checkGroupOrderAffiliateCode = useCallback((groupOrderData: any) => {
    if (groupOrderData?.affiliateCode && groupOrderData.affiliateCode !== affiliateState.code) {
      applyAffiliateCode(groupOrderData.affiliateCode, 'group_order');
      return groupOrderData.affiliateCode;
    }
    return null;
  }, [affiliateState.code, applyAffiliateCode]);

  // Check for custom site affiliate code
  const checkCustomSiteAffiliateCode = useCallback((siteData: any) => {
    if (siteData?.affiliate_code && siteData.affiliate_code !== affiliateState.code) {
      applyAffiliateCode(siteData.affiliate_code, 'custom_site');
      return siteData.affiliate_code;
    }
    return null;
  }, [affiliateState.code, applyAffiliateCode]);

  // Should auto-apply in checkout
  const shouldAutoApplyInCheckout = useCallback(() => {
    return affiliateState.autoApplied && 
           affiliateState.source && 
           ['url', 'group_order', 'custom_site'].includes(affiliateState.source);
  }, [affiliateState]);

  // Initialize from session storage on mount
  useEffect(() => {
    const sessionCode = sessionStorage.getItem('affiliate_code');
    const sessionSource = sessionStorage.getItem('affiliate_source') as AffiliateCodeState['source'];
    
    if (sessionCode && sessionSource) {
      setAffiliateState({
        code: sessionCode,
        source: sessionSource,
        autoApplied: sessionSource !== 'manual'
      });
    } else {
      // Clean start - clear any orphaned codes
      clearStoredAffiliateCodes();
    }

    // Check URL for affiliate code
    checkUrlForAffiliateCode();
  }, []);

  // Cleanup on unmount or page change
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only preserve affiliate codes from valid sources
      if (!affiliateState.source || affiliateState.source === 'manual') {
        clearStoredAffiliateCodes();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [affiliateState.source, clearStoredAffiliateCodes]);

  return {
    affiliateCode: affiliateState.code,
    affiliateSource: affiliateState.source,
    isAutoApplied: affiliateState.autoApplied,
    applyAffiliateCode,
    setManualAffiliateCode,
    clearAffiliateCode,
    checkUrlForAffiliateCode,
    checkGroupOrderAffiliateCode,
    checkCustomSiteAffiliateCode,
    shouldAutoApplyInCheckout,
    clearStoredAffiliateCodes
  };
}