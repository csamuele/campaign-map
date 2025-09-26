import { useRef, useCallback } from 'react';

type OverlayHandle = { update: () => void };

export function useOverlayRegistry() {
  const overlaysRef = useRef<Set<OverlayHandle>>(new Set());

  // Factory that returns a callback-ref for a single overlay instance.
  // The returned function will register the node when mounted and unregister on unmount.
  const makeRef = useCallback(() => {
    let current: OverlayHandle | null = null;
    return (node: OverlayHandle | null) => {
      if (current && current !== node) {
        overlaysRef.current.delete(current);
      }
      if (node) {
        overlaysRef.current.add(node);
        current = node;
      } else {
        current = null;
      }
    };
  }, []);

  const updateAll = useCallback(() => {
    for (const o of overlaysRef.current) {
      try {
        o.update();
      } catch (err) {
        // ignore overlay errors to avoid breaking the update loop
        // overlays might be partially mounted/invalid during quick lifecycle changes
        console.warn('overlay update failed', err);
      }
    }
  }, []);

  return { makeRef, updateAll } as const;
}
