'use client';

import { useState, useEffect } from 'react';
import { isCapacitor } from '../platform';

interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export function useNetwork(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    if (isCapacitor()) {
      // Use Capacitor Network plugin
      let cleanup: (() => void) | undefined;

      const setupListener = async () => {
        try {
          const { Network } = await import('@capacitor/network');

          // Get initial status
          const initialStatus = await Network.getStatus();
          setStatus({
            isConnected: initialStatus.connected,
            connectionType: initialStatus.connectionType as NetworkStatus['connectionType'],
          });

          // Listen for changes
          const handler = await Network.addListener('networkStatusChange', (networkStatus) => {
            setStatus({
              isConnected: networkStatus.connected,
              connectionType: networkStatus.connectionType as NetworkStatus['connectionType'],
            });
          });

          cleanup = () => {
            handler.remove();
          };
        } catch (error) {
          console.error('Failed to set up network listener:', error);
        }
      };

      setupListener();

      return () => {
        cleanup?.();
      };
    } else {
      // Use browser APIs
      const handleOnline = () => {
        setStatus((prev) => ({ ...prev, isConnected: true }));
      };

      const handleOffline = () => {
        setStatus((prev) => ({ ...prev, isConnected: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return status;
}
