'use client';

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
import { Brightness4, Brightness7 } from '@mui/icons-material';
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

export function TopAppBar() {
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
    <AppBar
      position="sticky"
      sx={{
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(18, 18, 18, 0.8)'
            : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: (theme) =>
          theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 255, 255, 0.1)`
            : `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 0, mr: { xs: 1, sm: 4 } }}
        >
          OnTrack
        </Typography>
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 2 },
              flexGrow: 1,
              flexWrap: 'wrap',
              overflowX: 'auto',
            }}
          >
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
