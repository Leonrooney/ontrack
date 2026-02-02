'use client';

import { Box, BoxProps } from '@mui/material';
import { useEffect, useRef } from 'react';
import { fadeIn } from '@/lib/animations';

interface PageTransitionProps extends BoxProps {
  children: React.ReactNode;
}

export function PageTransition({
  children,
  sx,
  ...props
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      fadeIn(containerRef.current, {
        duration: 400,
        delay: 0,
        opacity: [0, 1],
      });
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        opacity: 0,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
