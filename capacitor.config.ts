import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.civisense.ai',
  appName: 'CiviSense AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
