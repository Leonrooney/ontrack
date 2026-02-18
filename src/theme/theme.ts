'use client';

import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1DB954', // Spotify green
      light: '#1ed760',
      dark: '#1aa34a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1ed760', // Lighter Spotify green
      light: '#4dff88',
      dark: '#1aa34a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FAFBFC', // Very light, clean gray-blue
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.65)',
    },
    success: {
      main: '#1DB954',
      light: '#1ed760',
      dark: '#1aa34a',
    },
    info: {
      main: '#1ed760',
      light: '#4dff88',
      dark: '#1aa34a',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    divider: 'rgba(0, 0, 0, 0.06)', // Softer divider
    action: {
      active: 'rgba(29, 185, 84, 0.54)',
      hover: 'rgba(29, 185, 84, 0.04)', // Subtle green hover
      selected: 'rgba(29, 185, 84, 0.08)', // Light green selection
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.04)',
    '0 2px 4px rgba(0, 0, 0, 0.06)',
    '0 4px 8px rgba(0, 0, 0, 0.08)',
    '0 6px 12px rgba(0, 0, 0, 0.1)',
    '0 8px 16px rgba(0, 0, 0, 0.12)',
    '0 12px 24px rgba(0, 0, 0, 0.14)',
    '0 16px 32px rgba(0, 0, 0, 0.16)',
    '0 20px 40px rgba(0, 0, 0, 0.18)',
    '0 24px 48px rgba(0, 0, 0, 0.2)',
    '0 28px 56px rgba(0, 0, 0, 0.22)',
    '0 32px 64px rgba(0, 0, 0, 0.24)',
    '0 36px 72px rgba(0, 0, 0, 0.26)',
    '0 40px 80px rgba(0, 0, 0, 0.28)',
    '0 44px 88px rgba(0, 0, 0, 0.3)',
    '0 48px 96px rgba(0, 0, 0, 0.32)',
    '0 52px 104px rgba(0, 0, 0, 0.34)',
    '0 56px 112px rgba(0, 0, 0, 0.36)',
    '0 60px 120px rgba(0, 0, 0, 0.38)',
    '0 64px 128px rgba(0, 0, 0, 0.4)',
    '0 68px 136px rgba(0, 0, 0, 0.42)',
    '0 72px 144px rgba(0, 0, 0, 0.44)',
    '0 76px 152px rgba(0, 0, 0, 0.46)',
    '0 80px 160px rgba(0, 0, 0, 0.48)',
    '0 84px 168px rgba(0, 0, 0, 0.5)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          // Single subtle shadow instead of border + shadow to avoid double outline in light mode
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: 'none',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          fontSize: '0.875rem',
          minHeight: 36,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(29, 185, 84, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(29, 185, 84, 0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(29, 185, 84, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: 'rgba(0, 0, 0, 0.87)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'border-color 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(29, 185, 84, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1DB954',
            borderWidth: '1.5px',
          },
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Spotify green
      light: '#1ed760',
      dark: '#1aa34a',
      contrastText: '#000000',
    },
    secondary: {
      main: '#1ed760', // Lighter Spotify green accent
      light: '#4dff88',
      dark: '#1aa34a',
    },
    background: {
      default: '#121212', // Spotify black
      paper: '#181818', // Dark gray for cards (Spotify style)
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#b3b3b3', // Light gray text (Spotify style)
    },
    success: {
      main: '#1DB954',
      light: '#1ed760',
      dark: '#1aa34a',
    },
    info: {
      main: '#1ed760',
      light: '#4dff88',
      dark: '#1aa34a',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.3)',
    '0 4px 8px rgba(0, 0, 0, 0.35)',
    '0 8px 16px rgba(0, 0, 0, 0.4)',
    '0 12px 24px rgba(0, 0, 0, 0.45)',
    '0 16px 32px rgba(0, 0, 0, 0.5)',
    '0 20px 40px rgba(0, 0, 0, 0.55)',
    '0 24px 48px rgba(0, 0, 0, 0.6)',
    '0 28px 56px rgba(0, 0, 0, 0.65)',
    '0 32px 64px rgba(0, 0, 0, 0.7)',
    '0 36px 72px rgba(0, 0, 0, 0.75)',
    '0 40px 80px rgba(0, 0, 0, 0.8)',
    '0 44px 88px rgba(0, 0, 0, 0.85)',
    '0 48px 96px rgba(0, 0, 0, 0.9)',
    '0 52px 104px rgba(0, 0, 0, 0.95)',
    '0 56px 112px rgba(0, 0, 0, 1)',
    '0 60px 120px rgba(0, 0, 0, 1)',
    '0 64px 128px rgba(0, 0, 0, 1)',
    '0 68px 136px rgba(0, 0, 0, 1)',
    '0 72px 144px rgba(0, 0, 0, 1)',
    '0 76px 152px rgba(0, 0, 0, 1)',
    '0 80px 160px rgba(0, 0, 0, 1)',
    '0 84px 168px rgba(0, 0, 0, 1)',
    '0 88px 176px rgba(0, 0, 0, 1)',
    '0 92px 184px rgba(0, 0, 0, 1)',
  ],
  components: {
    // Same structural overrides as light theme – only colors differ between modes
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          fontSize: '0.875rem',
          minHeight: 36,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(29, 185, 84, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(29, 185, 84, 0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(29, 185, 84, 0.08)',
          },
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});
