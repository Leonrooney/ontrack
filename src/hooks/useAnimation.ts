'use client';

import { useEffect, useRef } from 'react';
import {
  fadeIn,
  staggerFadeIn,
  scaleIn,
  FadeInOptions,
} from '@/lib/animations';

/**
 * Hook for fade-in animation on mount
 */
export function useFadeIn(options: FadeInOptions = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      fadeIn(ref.current, options);
    }
  }, [options.delay, options.duration]);

  return ref;
}

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

/**
 * Hook for scale-in animation
 */
export function useScaleIn(
  options: { duration?: number; delay?: number } = {}
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      scaleIn(ref.current, options);
    }
  }, [options.delay, options.duration]);

  return ref;
}
