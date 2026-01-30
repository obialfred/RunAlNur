'use client';

import { useState, useEffect } from 'react';
import { isCapacitor } from '../platform';

interface KeyboardInfo {
  isVisible: boolean;
  height: number;
}

export function useKeyboard(): KeyboardInfo {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    if (!isCapacitor()) return;

    let cleanup: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        const showHandler = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardInfo({
            isVisible: true,
            height: info.keyboardHeight,
          });
        });

        const hideHandler = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardInfo({
            isVisible: false,
            height: 0,
          });
        });

        cleanup = () => {
          showHandler.remove();
          hideHandler.remove();
        };
      } catch (error) {
        console.error('Failed to set up keyboard listeners:', error);
      }
    };

    setupListeners();

    return () => {
      cleanup?.();
    };
  }, []);

  return keyboardInfo;
}
