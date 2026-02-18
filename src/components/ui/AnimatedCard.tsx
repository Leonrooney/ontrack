'use client';

import { Card, CardProps, useTheme } from '@mui/material';
import { useRef, useEffect, ElementType } from 'react';
import { cardHover } from '@/lib/animations';
import Link from 'next/link';

interface AnimatedCardProps extends Omit<CardProps, 'component'> {
  animateOnMount?: boolean;
  hoverScale?: number;
  component?: ElementType;
  href?: string;
}

export function AnimatedCard({
  children,
  animateOnMount = true,
  hoverScale = 1.02,
  component,
  href,
  sx,
  ...props
}: AnimatedCardProps) {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (animateOnMount && cardRef.current) {
      // Initial fade in
      const card = cardRef.current;
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';

      setTimeout(() => {
        card.style.transition =
          'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 10);
    }
  }, [animateOnMount]);

  const handleMouseEnter = () => {
    if (cardRef.current && !isHoveringRef.current) {
      isHoveringRef.current = true;
      cardHover(cardRef.current, true, { scale: hoverScale, isDark });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current && isHoveringRef.current) {
      isHoveringRef.current = false;
      cardHover(cardRef.current, false, { isDark });
    }
  };

  if (href) {
    // When using href, component is already extracted, so just use props
    return (
      <Card
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        component={Link}
        href={href}
        {...(props as any)}
        sx={[
          {
            transition:
              'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center',
            willChange: 'transform',
            position: 'relative',
            overflow: 'hidden',
            margin: 'auto',
          },
          {
            '&:hover': {
              cursor: 'pointer',
            },
            textDecoration: 'none',
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
      </Card>
    );
  }

  return (
    <Card
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(component ? { component } : {})}
      {...props}
      sx={[
        {
          transition:
            'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center',
          willChange: 'transform',
          position: 'relative',
          overflow: 'hidden',
          margin: 'auto',
        },
        {
          '&:hover': {
            cursor: 'pointer',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Card>
  );
}
