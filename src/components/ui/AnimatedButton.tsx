'use client';

import { Button, ButtonProps } from '@mui/material';
import { useRef } from 'react';

// Dynamic import for animejs
let anime: any = null;
let animePromise: Promise<any> | null = null;

function getAnime() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (anime) {
    return Promise.resolve(anime);
  }

  if (!animePromise) {
    animePromise = import('animejs')
      .then((module: any) => {
        // animejs v4 exports 'animate' as a named export
        anime =
          module && typeof module.animate === 'function'
            ? module.animate
            : null;
        return anime;
      })
      .catch(() => {
        anime = null;
        return null;
      });
  }

  return animePromise;
}

interface AnimatedButtonProps extends ButtonProps {
  ripple?: boolean;
}

export function AnimatedButton({
  children,
  ripple = true,
  onClick,
  sx,
  ...props
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current) {
      // Create ripple effect
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '1';

      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      // Use CSS animation as fallback
      ripple.style.transition =
        'width 600ms cubic-bezier(0.4, 0, 0.2, 1), height 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        ripple.style.width = '200px';
        ripple.style.height = '200px';
        ripple.style.opacity = '0';
      }, 10);

      setTimeout(() => {
        ripple.remove();
      }, 600);

      // Enhance with animejs if available
      getAnime().then((animeLib) => {
        if (animeLib && typeof animeLib === 'function') {
          try {
            animeLib({
              targets: ripple,
              width: 200,
              height: 200,
              opacity: [0.5, 0],
              duration: 600,
              easing: 'easeOutCubic',
              complete: () => {
                if (ripple.parentNode) {
                  ripple.remove();
                }
              },
            });
          } catch (e) {
            // Silently fail - CSS animation already working
            console.debug('animejs ripple failed:', e);
          }
        }
      });
    }

    // Scale animation
    if (buttonRef.current) {
      const btn = buttonRef.current;
      btn.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)';
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
      }, 200);

      // Enhance with animejs if available
      getAnime().then((animeLib) => {
        if (animeLib && typeof animeLib === 'function') {
          try {
            animeLib({
              targets: btn,
              scale: [1, 0.95, 1],
              duration: 200,
              easing: 'easeOutCubic',
            });
          } catch (e) {
            // Silently fail - CSS animation already working
            console.debug('animejs scale failed:', e);
          }
        }
      });
    }

    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      sx={[
        {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'visible', // Allow ripple to show
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          // Ensure button doesn't overflow container
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-2px',
            zIndex: -1,
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Button>
  );
}
