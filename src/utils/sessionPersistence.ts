// Admin session persistence utilities to prevent reload issues

export class AdminSessionManager {
  private static readonly ADMIN_SESSION_KEY = 'admin_session_persistent';
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  static setAdminSession(email: string) {
    const sessionData = {
      email,
      verified: true,
      timestamp: Date.now(),
      expires: Date.now() + this.SESSION_DURATION
    };
    
    localStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem('admin_verified', 'true');
    sessionStorage.setItem('admin_email', email);
    
    console.log('🔐 Admin session persisted:', email);
  }

  static getAdminSession() {
    try {
      const sessionStr = localStorage.getItem(this.ADMIN_SESSION_KEY);
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);
      if (Date.now() > session.expires) {
        this.clearAdminSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error retrieving admin session:', error);
      return null;
    }
  }

  static isAdminSessionValid(): boolean {
    const session = this.getAdminSession();
    const sessionStorageValid = sessionStorage.getItem('admin_verified') === 'true';
    
    return !!(session && session.verified && sessionStorageValid);
  }

  static clearAdminSession() {
    localStorage.removeItem(this.ADMIN_SESSION_KEY);
    sessionStorage.removeItem('admin_verified');
    sessionStorage.removeItem('admin_email');
    console.log('🗑️ Admin session cleared');
  }

  static refreshSession() {
    const session = this.getAdminSession();
    if (session) {
      this.setAdminSession(session.email);
    }
  }
}

// Auto-refresh session every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (AdminSessionManager.isAdminSessionValid()) {
      AdminSessionManager.refreshSession();
    }
  }, 60 * 60 * 1000); // 1 hour
}