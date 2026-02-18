/**
 * Animation utilities using CSS transitions for smooth UI interactions
 * All animations use CSS for maximum compatibility and performance
 */

export interface FadeInOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  opacity?: [number, number];
}

/**
 * Fade in animation for elements
 */
export function fadeIn(
  targets: string | HTMLElement | HTMLElement[] | NodeList | null,
  options: FadeInOptions = {}
): void {
  const {
    duration = 600,
    delay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    opacity = [0, 1],
  } = options;

  if (typeof window === 'undefined' || !targets) {
    return;
  }

  const elements =
    typeof targets === 'string'
      ? Array.from(document.querySelectorAll(targets))
      : Array.isArray(targets)
        ? targets
        : targets instanceof NodeList
          ? Array.from(targets)
          : [targets];

  elements.forEach((el: any) => {
    if (el && el.style) {
      el.style.opacity = String(opacity[0]);
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
      setTimeout(() => {
        if (el && el.style) {
          el.style.opacity = String(opacity[1]);
          el.style.transform = 'translateY(0)';
        }
      }, delay);
    }
  });
}

/**
 * Stagger fade in for multiple elements
 */
export function staggerFadeIn(
  targets: string | HTMLElement | HTMLElement[] | NodeList | null,
  options: FadeInOptions & { stagger?: number } = {}
): void {
  const {
    duration = 600,
    delay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    opacity = [0, 1],
    stagger = 100,
  } = options;

  if (typeof window === 'undefined' || !targets) {
    return;
  }

  const elements =
    typeof targets === 'string'
      ? Array.from(document.querySelectorAll(targets))
      : Array.isArray(targets)
        ? targets
        : targets instanceof NodeList
          ? Array.from(targets)
          : [targets];

  elements.forEach((el: any, index: number) => {
    if (el && el.style) {
      el.style.opacity = String(opacity[0]);
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
      setTimeout(
        () => {
          if (el && el.style) {
            el.style.opacity = String(opacity[1]);
            el.style.transform = 'translateY(0)';
          }
        },
        delay + index * stagger
      );
    }
  });
}

/**
 * Card hover animation
 * @param isDark - Pass true for dark mode (lighter hover shadow). Use MUI theme.palette.mode === 'dark'.
 */
export function cardHover(
  card: HTMLElement,
  isHovering: boolean,
  options: { scale?: number; shadow?: boolean; isDark?: boolean } = {}
): void {
  const { scale = 1.02, shadow = true, isDark = false } = options;

  if (typeof window === 'undefined' || !card) {
    return;
  }

  // Ensure transition is set
  if (!card.style.transition.includes('transform')) {
    card.style.transition =
      'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  // Use CSS transitions for smooth hover effects
  if (isHovering) {
    card.style.transform = `scale(${scale})`;
    card.style.zIndex = '10'; // Bring to front on hover
    if (shadow) {
      // Light mode: softer shadow (0.12). Dark mode: stronger shadow (0.25) for visibility.
      const shadowColor = isDark
        ? 'rgba(0, 0, 0, 0.25)'
        : 'rgba(0, 0, 0, 0.12)';
      card.style.boxShadow = `0 8px 24px ${shadowColor}`;
    }
  } else {
    card.style.transform = 'scale(1)';
    card.style.zIndex = 'auto';
    card.style.boxShadow = '';
  }
}
