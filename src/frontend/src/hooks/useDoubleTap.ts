import { useRef, useCallback } from 'react';

export function useDoubleTap(onDoubleTap: () => void, delay = 300) {
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay) {
      // Double tap detected
      tapCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onDoubleTap();
    } else {
      // First tap
      tapCountRef.current = 1;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, delay);
    }

    lastTapRef.current = now;
  }, [onDoubleTap, delay]);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      // Handle mouse double-click
      const handleDoubleClick = (e: MouseEvent) => {
        e.preventDefault();
        onDoubleTap();
      };

      // Handle touch double-tap
      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        handleTap();
      };

      node.addEventListener('dblclick', handleDoubleClick);
      node.addEventListener('touchend', handleTouchEnd);

      return () => {
        node.removeEventListener('dblclick', handleDoubleClick);
        node.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [handleTap, onDoubleTap]
  );

  return ref;
}
