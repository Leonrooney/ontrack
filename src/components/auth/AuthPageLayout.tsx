'use client';

import { Box, Container, Paper } from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';

const containerSx = {
  width: '100%',
  maxWidth: '100%',
  overflowX: 'hidden',
  px: { xs: 1, sm: 2 },
} as const;

const boxSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
} as const;

const paperSx = {
  p: { xs: 2, sm: 4 },
  width: '100%',
  maxWidth: 400,
} as const;

interface AuthPageLayoutProps {
  children: React.ReactNode;
  /** Max width of the inner Paper (default 400) */
  maxWidth?: number;
}

/**
 * Shared layout for auth pages (login, signup, forgot-password, reset-password).
 * Wraps content in MainLayout, centered Container, and Paper for consistent presentation.
 */
export function AuthPageLayout({ children, maxWidth = 400 }: AuthPageLayoutProps) {
  return (
    <MainLayout>
      <Container maxWidth="sm" sx={containerSx}>
        <Box sx={boxSx}>
          <Paper elevation={3} sx={{ ...paperSx, maxWidth }}>
            {children}
          </Paper>
        </Box>
      </Container>
    </MainLayout>
  );
}
