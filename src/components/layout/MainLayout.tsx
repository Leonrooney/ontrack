'use client';

import { usePathname } from 'next/navigation';
import { Box, IconButton, Button } from '@mui/material';
import Link from 'next/link';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme as useThemeContext } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import { BottomNavigation } from './BottomNavigation';
import { PageTransition } from '@/components/ui/PageTransition';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { resolvedMode, toggleTheme } = useThemeContext();
  const { status } = useSession();
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname?.startsWith('/welcome/');
  const showBottomNav = !isAuthPage;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: (theme) => theme.palette.background.default,
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 20% 50%, rgba(29, 185, 84, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 215, 96, 0.03) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(29, 185, 84, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 215, 96, 0.015) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      {/* Top bar: Log in (when unauthenticated) + theme toggle */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {status === 'unauthenticated' && !isAuthPage && (
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Log in
            </Button>
          )}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            aria-label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            sx={{ color: 'text.primary' }}
          >
            {resolvedMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            pb: showBottomNav ? { xs: 8, sm: 8, md: 10 } : 2,
            transition: 'padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <PageTransition>{children}</PageTransition>
        </Box>
        {showBottomNav && <BottomNavigation />}
      </Box>
    </Box>
  );
}
