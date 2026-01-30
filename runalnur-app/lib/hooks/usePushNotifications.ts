'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  initializePushNotifications, 
  arePushNotificationsEnabled,
  showLocalNotification,
  type PushNotificationPayload,
} from '../notifications/push';
import { isCapacitor, isTauri } from '../platform';

interface UsePushNotificationsReturn {
  isEnabled: boolean;
  isSupported: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<boolean>;
  showNotification: (payload: PushNotificationPayload) => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const isSupported = typeof window !== 'undefined' && (
    isCapacitor() || 
    isTauri() || 
    'Notification' in window
  );

  useEffect(() => {
    const checkStatus = async () => {
      if (!isSupported) {
        setIsLoading(false);
        return;
      }
      
      try {
        const enabled = await arePushNotificationsEnabled();
        setIsEnabled(enabled);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check notification status'));
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await initializePushNotifications();
      const enabled = await arePushNotificationsEnabled();
      setIsEnabled(enabled);
      return enabled;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request permission');
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const showNotification = useCallback(async (payload: PushNotificationPayload): Promise<void> => {
    if (!isEnabled) {
      console.warn('Notifications not enabled');
      return;
    }
    
    try {
      await showLocalNotification(payload);
    } catch (err) {
      console.error('Failed to show notification:', err);
    }
  }, [isEnabled]);

  return {
    isEnabled,
    isSupported,
    isLoading,
    error,
    requestPermission,
    showNotification,
  };
}
