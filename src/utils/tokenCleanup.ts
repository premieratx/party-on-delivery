// TOKEN CLEANUP UTILITY - Build: 2025_08_19_STABLE
// Safely removes lovable tokens that might interfere with the app

export const cleanupTokens = (): void => {
  try {
    // Clean up URL parameters
    const url = new URL(window.location.href);
    let urlChanged = false;

    // Remove lovable token parameters
    if (url.searchParams.has('__lovable_token')) {
      url.searchParams.delete('__lovable_token');
      urlChanged = true;
    }

    // Remove other problematic parameters
    const problematicParams = ['token', 'auth_token', 'session_token'];
    problematicParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        urlChanged = true;
      }
    });

    // Update URL if changes were made
    if (urlChanged) {
      window.history.replaceState({}, document.title, url.toString());
      console.log('🧹 Cleaned up problematic URL parameters');
    }

    // Clean up localStorage entries that might interfere
    const problematicKeys = [
      '__lovable_token',
      'token',
      'auth_token',
      'session_token'
    ];

    problematicKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Removed problematic localStorage key: ${key}`);
      }
    });

  } catch (error) {
    console.warn('Token cleanup failed:', error);
  }
};

// Auto-cleanup on import
cleanupTokens();