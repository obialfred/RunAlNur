/**
 * Capacitor Configuration
 * @type {import('@capacitor/cli').CapacitorConfig}
 */

// Production URL - update this when deployed
const PRODUCTION_URL = process.env.CAPACITOR_PRODUCTION_URL || 'https://runalnur.vercel.app';

const config = {
  appId: 'com.runalnur.app',
  appName: 'RunAlNur',
  webDir: 'out',
  backgroundColor: '#0a0a0a',
  
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'RunAlNur',
    allowsLinkPreview: true,
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0ea5e9',
      sound: 'default',
    },
  },
  
  server: {
    // For production builds, load from the hosted web app
    // Comment out for local development with static files
    url: process.env.NODE_ENV === 'production' ? PRODUCTION_URL : undefined,
    allowNavigation: [
      '*.supabase.co',
      'supabase.co',
      '*.vercel.app',
      'localhost:3000',
    ],
  },
};

module.exports = config;
