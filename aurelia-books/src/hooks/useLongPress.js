// src/hooks/useLongPress.js
import { useRef, useCallback } from 'react';

export function triggerHaptic() {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
    } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(35);
    }
  } catch {
    // Ignore vibrations not allowed or unsupported
  }
}

/**
 * Custom hook for robust long-press detection (~500ms threshold).
 * Automatically cancels if the pointer moves > moveTolerance (default 8px)
 * so it never impedes horizontal or vertical scrolling.
 */
export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  moveTolerance = 8,
  disabled = false,
}) {
  const timerRef = useRef(null);
  const startCoordsRef = useRef({ x: 0, y: 0 });
  const didLongPressRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (disabled || e.button > 0) return; // Only primary button / touch
    didLongPressRef.current = false;
    startCoordsRef.current = { x: e.clientX, y: e.clientY };

    clearTimer();
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      triggerHaptic();
      if (onLongPress) onLongPress(e);
    }, threshold);
  }, [disabled, onLongPress, threshold, clearTimer]);

  const handlePointerMove = useCallback((e) => {
    if (!timerRef.current) return;
    const dx = e.clientX - startCoordsRef.current.x;
    const dy = e.clientY - startCoordsRef.current.y;
    if (Math.hypot(dx, dy) > moveTolerance) {
      clearTimer();
    }
  }, [moveTolerance, clearTimer]);

  const handlePointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handlePointerCancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleClick = useCallback((e) => {
    if (didLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didLongPressRef.current = false;
      return;
    }
    if (onClick) onClick(e);
  }, [onClick]);

  const handleContextMenu = useCallback((e) => {
    // Prevent native Android / WebView context menu
    e.preventDefault();
    if (!didLongPressRef.current && onLongPress) {
      onLongPress(e);
    }
  }, [onLongPress]);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}
