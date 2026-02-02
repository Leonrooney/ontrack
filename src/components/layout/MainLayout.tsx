'use client';

import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { TopAppBar } from './TopAppBar';
import { SideNav } from './SideNav';
import { BottomNavigation } from './BottomNavigation';
import { PageTransition } from '@/components/ui/PageTransition';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Only show TopAppBar and SideNav on mobile */}
        {isMobile && <TopAppBar onMenuClick={handleDrawerToggle} />}
        {isMobile && <SideNav open={mobileOpen} onClose={handleDrawerToggle} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            pb: { xs: 8, sm: 8, md: 10 }, // Add bottom padding for bottom nav on all screens
            transition: 'padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <PageTransition>{children}</PageTransition>
        </Box>
        {/* Show BottomNavigation on all screen sizes */}
        <BottomNavigation />
      </Box>
    </Box>
  );
}
