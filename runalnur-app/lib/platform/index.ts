/**
 * Platform detection and native feature access
 * 
 * Provides unified API for:
 * - Web (PWA)
 * - Mac (Tauri)
 * - iOS (Capacitor)
 */

// Check if running in Tauri
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

// Check if running in Capacitor
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Capacitor' in window;
}

// Check if running as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Check if running in native app (Tauri or Capacitor)
export function isNative(): boolean {
  return isTauri() || isCapacitor();
}

// Check if running on mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Check if running on iOS
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Check if running on macOS
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Get platform type
export type Platform = 'web' | 'pwa' | 'tauri' | 'capacitor';

export function getPlatform(): Platform {
  if (isTauri()) return 'tauri';
  if (isCapacitor()) return 'capacitor';
  if (isPWA()) return 'pwa';
  return 'web';
}

// Platform capabilities
export interface PlatformCapabilities {
  notifications: boolean;
  pushNotifications: boolean;
  haptics: boolean;
  nativeMenus: boolean;
  fileSystem: boolean;
  offlineStorage: boolean;
}

export function getCapabilities(): PlatformCapabilities {
  const platform = getPlatform();
  
  return {
    notifications: true, // All platforms support some form of notifications
    pushNotifications: platform === 'capacitor', // Only Capacitor supports push
    haptics: platform === 'capacitor', // Only Capacitor supports haptics
    nativeMenus: platform === 'tauri', // Only Tauri has native menus
    fileSystem: platform === 'tauri', // Full file system access only in Tauri
    offlineStorage: true, // IndexedDB works everywhere
  };
}

// Native notifications
export async function showNotification(
  title: string,
  body?: string,
  options?: { icon?: string }
): Promise<void> {
  if (isTauri()) {
    try {
      const { sendNotification, isPermissionGranted, requestPermission } = 
        await import('@tauri-apps/plugin-notification');
      
      let hasPermission = await isPermissionGranted();
      if (!hasPermission) {
        const permission = await requestPermission();
        hasPermission = permission === 'granted';
      }
      
      if (hasPermission) {
        await sendNotification({ title, body: body || '' });
      }
    } catch (error) {
      console.error('Tauri notification error:', error);
      // Fallback to web notification
      showWebNotification(title, body, options);
    }
  } else if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: body || '',
            id: Date.now(),
          },
        ],
      });
    } catch (error) {
      console.error('Capacitor notification error:', error);
      showWebNotification(title, body, options);
    }
  } else {
    showWebNotification(title, body, options);
  }
}

async function showWebNotification(
  title: string,
  body?: string,
  options?: { icon?: string }
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: options?.icon });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body, icon: options?.icon });
    }
  }
}

// Haptic feedback (iOS only via Capacitor)
export async function hapticFeedback(
  type: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<void> {
  if (!isCapacitor()) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[type] });
  } catch (error) {
    // Silently fail if haptics not available
  }
}

// Open external URL
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } catch {
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
}
