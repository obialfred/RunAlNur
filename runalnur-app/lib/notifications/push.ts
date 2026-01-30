/**
 * Push Notification Service
 * 
 * Handles push notification registration and management
 * for both Capacitor (iOS) and Web Push API
 */

'use client';

import { isCapacitor, isTauri } from '../platform';

// Notification types
export type NotificationType = 
  | 'task_due'
  | 'task_overdue'
  | 'project_update'
  | 'mention'
  | 'ai_briefing'
  | 'sync_complete'
  | 'general';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

// Device token for push notifications
let deviceToken: string | null = null;

/**
 * Initialize push notifications
 * Call this on app startup
 */
export async function initializePushNotifications(): Promise<void> {
  if (isCapacitor()) {
    await initializeCapacitorPush();
  } else if (isTauri()) {
    // Tauri uses native OS notifications, no push registration needed
    await initializeTauriNotifications();
  } else {
    await initializeWebPush();
  }
}

/**
 * Initialize Capacitor push notifications (iOS)
 */
async function initializeCapacitorPush(): Promise<void> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Register with APNs
      await PushNotifications.register();
    }
    
    // Listen for registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      deviceToken = token.value;
      
      // Save token to backend
      await saveDeviceToken(token.value, 'ios');
    });
    
    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });
    
    // Listen for push received while app is open
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      handleNotificationReceived(notification);
    });
    
    // Listen for push action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed:', action);
      handleNotificationTapped(action.notification);
    });
    
  } catch (error) {
    console.error('Failed to initialize Capacitor push:', error);
  }
}

/**
 * Initialize Tauri native notifications
 */
async function initializeTauriNotifications(): Promise<void> {
  try {
    const { isPermissionGranted, requestPermission } = 
      await import('@tauri-apps/plugin-notification');
    
    let hasPermission = await isPermissionGranted();
    
    if (!hasPermission) {
      const permission = await requestPermission();
      hasPermission = permission === 'granted';
    }
    
    if (hasPermission) {
      console.log('Tauri notifications initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Tauri notifications:', error);
  }
}

/**
 * Initialize Web Push API
 */
async function initializeWebPush(): Promise<void> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Web Push not supported');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push (requires VAPID key from backend)
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (vapidKey) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        
        // Save subscription to backend
        await saveWebPushSubscription(subscription);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Web Push:', error);
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Save device token to backend
 */
async function saveDeviceToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  try {
    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    });
  } catch (error) {
    console.error('Failed to save device token:', error);
  }
}

/**
 * Save web push subscription to backend
 */
async function saveWebPushSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        subscription: subscription.toJSON(),
        platform: 'web',
      }),
    });
  } catch (error) {
    console.error('Failed to save web push subscription:', error);
  }
}

/**
 * Handle notification received while app is open
 */
function handleNotificationReceived(notification: {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}): void {
  // Emit event for UI to handle
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('push-notification', {
      detail: notification,
    }));
  }
}

/**
 * Handle notification tapped
 */
function handleNotificationTapped(notification: {
  data?: Record<string, unknown>;
}): void {
  const actionUrl = notification.data?.actionUrl as string | undefined;
  
  if (actionUrl && typeof window !== 'undefined') {
    // Navigate to the action URL
    window.location.href = actionUrl;
  }
}

/**
 * Show a local notification
 */
export async function showLocalNotification(
  payload: PushNotificationPayload
): Promise<void> {
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: payload.title,
            body: payload.body,
            extra: payload.data,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  } else if (isTauri()) {
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification');
      await sendNotification({
        title: payload.title,
        body: payload.body,
      });
    } catch (error) {
      console.error('Failed to show Tauri notification:', error);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      data: payload.data,
    });
  }
}

/**
 * Get the current device token (iOS only)
 */
export function getDeviceToken(): string | null {
  return deviceToken;
}

/**
 * Check if push notifications are enabled
 */
export async function arePushNotificationsEnabled(): Promise<boolean> {
  if (isCapacitor()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === 'granted';
    } catch {
      return false;
    }
  } else if ('Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}
