'use client';

import { useCallback } from 'react';
import { isCapacitor } from '../platform';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const trigger = useCallback(async (type: HapticType = 'medium'): Promise<void> => {
    if (!isCapacitor()) return;
    
    try {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch (error) {
      // Silently fail - haptics not critical
    }
  }, []);

  const impactLight = useCallback(() => trigger('light'), [trigger]);
  const impactMedium = useCallback(() => trigger('medium'), [trigger]);
  const impactHeavy = useCallback(() => trigger('heavy'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);

  return {
    trigger,
    impactLight,
    impactMedium,
    impactHeavy,
    selection,
    success,
    warning,
    error,
  };
}
