"use client";

import { useEffect, useRef, useCallback } from 'react';

interface UseEdgeSwipeOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  edgeWidth?: number; // How close to edge to start (default 20px)
  threshold?: number; // Minimum swipe distance (default 50px)
  enabled?: boolean;
  mode?: 'edge' | 'anywhere';
}

export function useEdgeSwipe({
  onSwipeRight,
  onSwipeLeft,
  edgeWidth = 20,
  threshold = 50,
  enabled = true,
  mode = 'edge',
}: UseEdgeSwipeOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);
  const startFromLeftEdge = useRef(false);
  const startFromRightEdge = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    const target = e.target as HTMLElement | null;
    if (target) {
      // Ignore gestures starting in inputs/textareas/contenteditable
      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (target as any).isContentEditable) return;
      // Ignore gestures starting in elements explicitly marked as ignore
      if (target.closest('[data-gesture-ignore="true"]')) return;
      // Ignore horizontal scrollers (so we don't break carousels / pill rows)
      const scroller = target.closest('[data-horizontal-scroll="true"]');
      if (scroller) return;
    }
    
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;

    startFromLeftEdge.current = touch.clientX <= edgeWidth;
    startFromRightEdge.current = touch.clientX >= screenWidth - edgeWidth;

    if (mode === 'edge') {
      isEdgeSwipe.current = startFromLeftEdge.current || startFromRightEdge.current;
    } else {
      isEdgeSwipe.current = true;
    }
  }, [edgeWidth, enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !isEdgeSwipe.current || touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    
    // Only trigger if clearly horizontal (avoid stealing vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) >= threshold) {
      if (deltaX > 0) {
        // Edge mode: require starting at left edge; Anywhere mode: allow anywhere
        if (mode === 'anywhere' || startFromLeftEdge.current) onSwipeRight?.();
      } else if (deltaX < 0) {
        if (mode === 'anywhere' || startFromRightEdge.current) onSwipeLeft?.();
      }
    }

    // Reset
    touchStartX.current = null;
    touchStartY.current = null;
    isEdgeSwipe.current = false;
    startFromLeftEdge.current = false;
    startFromRightEdge.current = false;
  }, [edgeWidth, threshold, enabled, onSwipeRight, onSwipeLeft]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
