'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useProfile, useUpdateProfile } from '@/hooks/profile';
import { useState, useEffect } from 'react';

export function ProfilePageClient() {
  const { data: profile, isLoading, error } = useProfile();
  const updateMutation = useUpdateProfile();

  const [name, setName] = useState('');
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>('metric');
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system');

  // Initialize form values when profile data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUnitPreference(profile.unitPreference);
      setThemePreference(profile.themePreference);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    updateMutation.mutate({
      name: trimmedName || undefined,
      unitPreference,
      themePreference,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile
          </Typography>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile
          </Typography>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
            <Alert severity="error">Failed to load profile. Please try again.</Alert>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                helperText="This is how your name will appear in the app"
              />

              <FormControl fullWidth>
                <InputLabel id="unit-preference-label">Unit Preference</InputLabel>
                <Select
                  labelId="unit-preference-label"
                  label="Unit Preference"
                  value={unitPreference}
                  onChange={(e) => setUnitPreference(e.target.value as 'metric' | 'imperial')}
                >
                  <MenuItem value="metric">Metric (kg, km)</MenuItem>
                  <MenuItem value="imperial">Imperial (lb, mi)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="theme-preference-label">Theme Preference</InputLabel>
                <Select
                  labelId="theme-preference-label"
                  label="Theme Preference"
                  value={themePreference}
                  onChange={(e) => setThemePreference(e.target.value as 'system' | 'light' | 'dark')}
                >
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Snackbar for success/error messages */}
        <Snackbar
          open={updateMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={updateMutation.closeSnackbar}
        >
          <Alert
            onClose={updateMutation.closeSnackbar}
            severity={updateMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {updateMutation.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}

