'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { isCapacitor, isIOS } from '@/lib/platform';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Hook to get safe area insets
 * Returns CSS env() values on iOS, 0 on other platforms
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get computed values from CSS
    const computeInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
      });
    };

    // Set CSS variables for safe area
    document.documentElement.style.setProperty(
      '--sat',
      'env(safe-area-inset-top, 0px)'
    );
    document.documentElement.style.setProperty(
      '--sab',
      'env(safe-area-inset-bottom, 0px)'
    );
    document.documentElement.style.setProperty(
      '--sal',
      'env(safe-area-inset-left, 0px)'
    );
    document.documentElement.style.setProperty(
      '--sar',
      'env(safe-area-inset-right, 0px)'
    );

    // Compute after a tick to ensure values are applied
    requestAnimationFrame(computeInsets);

    // Recompute on resize
    window.addEventListener('resize', computeInsets);

    return () => {
      window.removeEventListener('resize', computeInsets);
    };
  }, []);

  return insets;
}

interface SafeAreaProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that sets up safe area CSS variables and viewport height fix
 */
export function SafeAreaProvider({ children }: SafeAreaProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix for mobile viewport height (accounts for browser chrome)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setViewportHeight = () => {
      // Calculate actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Also set a full height variable
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    // Set initial value
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    const handleOrientationChange = () => {
      // Delay for orientation change to complete
      setTimeout(setViewportHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add platform-specific classes
    const html = document.documentElement;
    
    if (isCapacitor()) {
      html.classList.add('capacitor');
    }
    
    if (isIOS()) {
      html.classList.add('ios');
    }

    // Detect PWA standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      html.classList.add('pwa');
    }
  }, []);

  // Update status bar based on theme
  useEffect(() => {
    if (!mounted) return;

    const setupStatusBar = async () => {
      if (!isCapacitor()) return;
      
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const isDark = resolvedTheme === 'dark';
        
        // Set status bar style based on theme
        await StatusBar.setStyle({ 
          style: isDark ? Style.Dark : Style.Light 
        });
        
        // Set background color based on theme
        await StatusBar.setBackgroundColor({ 
          color: isDark ? '#09090B' : '#FAFAFA'
        });
      } catch (error) {
        // Status bar plugin may not be available
      }
    };

    setupStatusBar();
  }, [resolvedTheme, mounted]);

  return <>{children}</>;
}

interface SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * View component that applies safe area padding
 */
export function SafeAreaView({ 
  children, 
  className = '',
  edges = ['top', 'bottom', 'left', 'right'],
}: SafeAreaViewProps) {
  const paddingStyles: React.CSSProperties = {};
  
  if (edges.includes('top')) {
    paddingStyles.paddingTop = 'env(safe-area-inset-top, 0px)';
  }
  if (edges.includes('bottom')) {
    paddingStyles.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  }
  if (edges.includes('left')) {
    paddingStyles.paddingLeft = 'env(safe-area-inset-left, 0px)';
  }
  if (edges.includes('right')) {
    paddingStyles.paddingRight = 'env(safe-area-inset-right, 0px)';
  }

  return (
    <div className={className} style={paddingStyles}>
      {children}
    </div>
  );
}
