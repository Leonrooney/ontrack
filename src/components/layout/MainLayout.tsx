'use client';

import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { TopAppBar } from './TopAppBar';
import { SideNav } from './SideNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopAppBar onMenuClick={handleDrawerToggle} />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <SideNav open={mobileOpen} onClose={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            width: { md: `calc(100% - 250px)` },
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

