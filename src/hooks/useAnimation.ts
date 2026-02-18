'use client';

import { useEffect, useRef } from 'react';
import { staggerFadeIn, FadeInOptions } from '@/lib/animations';

/**
 * Hook for stagger fade-in animation for lists
 */
export function useStaggerFadeIn(
  options: FadeInOptions & { stagger?: number } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const children = Array.from(ref.current.children) as HTMLElement[];
      if (children.length > 0) {
        staggerFadeIn(children, options);
      }
    }
  }, [options.delay, options.duration, options.stagger]);

  return ref;
}
