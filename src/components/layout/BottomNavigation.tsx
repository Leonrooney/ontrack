'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Fab,
  Tooltip,
  Badge,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useWorkoutPersistence } from '@/hooks/useWorkoutPersistence';

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasSavedWorkout } = useWorkoutPersistence();
  const isOnWorkoutPage = pathname === '/workouts/new';

  // Determine the current tab based on pathname
  const getCurrentValue = () => {
    if (pathname?.startsWith('/workouts') || pathname === '/workouts') {
      return 1; // Workout tab
    }
    if (pathname?.startsWith('/profile') || pathname === '/profile') {
      return 2; // Profile tab
    }
    // Default to Home (dashboard)
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        router.push('/dashboard');
        break;
      case 1:
        router.push('/workouts');
        break;
      case 2:
        router.push('/profile');
        break;
    }
  };

  // Show on all devices now

  return (
    <>
      {/* Floating Action Button for In-Progress Workout */}
      {hasSavedWorkout && !isOnWorkoutPage && (
        <Tooltip title="Return to workout in progress" arrow placement="left">
          <Fab
            color="primary"
            aria-label="Return to workout"
            onClick={() => router.push('/workouts/new')}
            size="medium"
            sx={{
              position: 'fixed',
              bottom: { xs: 72, sm: 72, md: 72 },
              right: { xs: 16, sm: 24, md: 24 },
              zIndex: 1001,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 6,
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: '0 0 0 0 rgba(29, 185, 84, 0.7)',
                },
                '50%': {
                  boxShadow: '0 0 0 8px rgba(29, 185, 84, 0)',
                },
              },
            }}
          >
            <PlayArrowIcon />
          </Fab>
        </Tooltip>
      )}

      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.95)'
              : 'rgba(255, 255, 255, 0.9)',
          borderTop: (theme) =>
            theme.palette.mode === 'dark'
              ? `1px solid rgba(255, 255, 255, 0.1)`
              : `1px solid ${theme.palette.divider}`,
        }}
        elevation={3}
      >
        <MuiBottomNavigation
          value={getCurrentValue()}
          onChange={handleChange}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<HomeIcon />}
            sx={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: 'primary.main',
                transform: 'scale(1.1)',
              },
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
          <BottomNavigationAction
            label="Workout"
            icon={<FitnessCenterIcon />}
            sx={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: 'primary.main',
                transform: 'scale(1.1)',
              },
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<PersonIcon />}
            sx={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: 'primary.main',
                transform: 'scale(1.1)',
              },
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
        </MuiBottomNavigation>
      </Paper>
    </>
  );
}
