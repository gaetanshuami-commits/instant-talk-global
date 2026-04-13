import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.instanttalk.app',
  appName: 'Instant Talk',
  webDir: 'public',
  server: {
    url: 'https://instant-talk.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000
    }
  }
};

export default config;
