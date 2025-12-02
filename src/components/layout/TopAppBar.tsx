'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Box,
  Link as MuiLink,
} from '@mui/material';
import { Brightness4, Brightness7, Menu as MenuIcon } from '@mui/icons-material';
import { useTheme as useThemeContext } from '@/contexts/ThemeContext';
import Link from 'next/link';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/activity', label: 'Activity' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/goals', label: 'Goals' },
  { href: '/forecast', label: 'Forecast' },
  { href: '/profile', label: 'Profile' },
  { href: '/faq', label: 'FAQ' },
];

interface TopAppBarProps {
  onMenuClick?: () => void;
}

export function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { resolvedMode, mode, setMode } = useThemeContext();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const toggleTheme = () => {
    if (mode === 'system') {
      setMode(resolvedMode === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: { xs: 1, sm: 4 } }}>
          OnTrack
        </Typography>
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexGrow: 1, flexWrap: 'wrap', overflowX: 'auto' }}>
            {navLinks.map((link) => (
              <MuiLink
                key={link.href}
                component={Link}
                href={link.href}
                color="inherit"
                underline="none"
                sx={{
                  '&:hover': { opacity: 0.8 },
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </MuiLink>
            ))}
          </Box>
        )}
        <IconButton color="inherit" onClick={toggleTheme}>
          {resolvedMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

