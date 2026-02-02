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
 * Scale in animation
 */
export function scaleIn(
  targets: string | HTMLElement | NodeList | null,
  options: { duration?: number; delay?: number; scale?: [number, number] } = {}
): void {
  const { duration = 400, delay = 0, scale = [0.9, 1] } = options;

  if (typeof window === 'undefined' || !targets) {
    return;
  }

  const elements =
    typeof targets === 'string'
      ? Array.from(document.querySelectorAll(targets))
      : targets instanceof NodeList
        ? Array.from(targets)
        : [targets];

  elements.forEach((el: any) => {
    if (el && el.style) {
      el.style.opacity = '0';
      el.style.transform = `scale(${scale[0]})`;
      el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      setTimeout(() => {
        if (el && el.style) {
          el.style.opacity = '1';
          el.style.transform = `scale(${scale[1]})`;
        }
      }, delay);
    }
  });
}

/**
 * Number counter animation
 */
export function countUp(
  target: HTMLElement,
  from: number,
  to: number,
  options: {
    duration?: number;
    delay?: number;
    format?: (value: number) => string;
  } = {}
): void {
  const {
    duration = 1000,
    delay = 0,
    format = (val) => Math.round(val).toString(),
  } = options;

  if (typeof window === 'undefined' || !target) {
    return;
  }

  // Use requestAnimationFrame for smooth counting
  let startTime: number | null = null;
  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min((elapsed - delay) / duration, 1);

    if (progress >= 0) {
      const current = from + (to - from) * progress;
      if (target) {
        target.textContent = format(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    } else {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

/**
 * Card hover animation
 */
export function cardHover(
  card: HTMLElement,
  isHovering: boolean,
  options: { scale?: number; shadow?: boolean } = {}
): void {
  const { scale = 1.02, shadow = true } = options;

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
      const shadowColor =
        window.getComputedStyle(card).color === 'rgb(0, 0, 0)' ||
        document.documentElement.classList.contains('dark')
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(0, 0, 0, 0.15)';
      card.style.boxShadow = `0 8px 24px ${shadowColor}`;
    }
  } else {
    card.style.transform = 'scale(1)';
    card.style.zIndex = 'auto';
    card.style.boxShadow = '';
  }
}
