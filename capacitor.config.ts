import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d4f38fe76414582bf971945b0dbb2a3',
  appName: 'party-on-delivery',
  webDir: 'dist',
  server: {
    url: 'https://4d4f38fe-7641-4582-bf97-1945b0dbb2a3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;