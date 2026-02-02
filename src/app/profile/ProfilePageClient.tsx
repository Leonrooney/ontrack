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
  Divider,
} from '@mui/material';
import { useProfile, useUpdateProfile } from '@/hooks/profile';
import { useUserPreferences, useUpdatePreferences } from '@/hooks/preferences';
import { useWorkoutHistory } from '@/hooks/workouts';
import { exportWorkoutsToCSV } from '@/lib/workout-csv';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export function ProfilePageClient() {
  const { data: profile, isLoading, error } = useProfile();
  const updateMutation = useUpdateProfile();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const { data: workoutData, isLoading: workoutsLoading } =
    useWorkoutHistory(1000); // Get all workouts for export
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>(
    'metric'
  );
  const [themePreference, setThemePreference] = useState<
    'system' | 'light' | 'dark'
  >('system');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(90);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values when profile data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUnitPreference(profile.unitPreference);
      setThemePreference(profile.themePreference);
    }
  }, [profile]);

  // Initialize preferences when they load
  useEffect(() => {
    if (preferences) {
      setDefaultRestSeconds(preferences.defaultRestSeconds);
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    updateMutation.mutate({
      name: trimmedName || undefined,
      unitPreference,
      themePreference,
    });
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate({
      defaultRestSeconds,
    });
  };

  const handleExportWorkouts = () => {
    if (!workoutData?.items || workoutData.items.length === 0) {
      setImportMessage({
        open: true,
        message: 'No workouts to export',
        severity: 'error',
      });
      return;
    }

    try {
      const csv = exportWorkoutsToCSV(workoutData.items);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `workout_data_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportMessage({
        open: true,
        message: `Exported ${workoutData.items.length} workout(s) successfully`,
        severity: 'success',
      });
    } catch (error: any) {
      setImportMessage({
        open: true,
        message: `Export failed: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleImportWorkouts = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const text = await file.text();
      console.log(
        'Importing CSV file:',
        file.name,
        'Size:',
        file.size,
        'bytes'
      );

      const response = await fetch('/api/workouts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ csvText: text }),
      });

      const data = await response.json();
      console.log('Import response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import workouts');
      }

      const errorMsg =
        data.errors && data.errors.length > 0
          ? `. ${data.errors.length} error(s): ${data.errors.slice(0, 2).join('; ')}${data.errors.length > 2 ? '...' : ''}`
          : '';

      const message = `Successfully imported ${data.imported || 0} of ${data.total || 0} workout(s)${errorMsg}`;
      console.log('Import success:', message);

      setImportMessage({
        open: true,
        message,
        severity:
          (data.imported || 0) === (data.total || 0) ? 'success' : 'warning',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Invalidate and refetch workout queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      setImportLoading(false);
    } catch (error: any) {
      console.error('Import error:', error);
      setImportMessage({
        open: true,
        message: `Import failed: ${error.message || 'Unknown error'}`,
        severity: 'error',
      });
      setImportLoading(false);
    }
  };

  if (isLoading || prefsLoading) {
    return (
      <MainLayout>
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile
          </Typography>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              mt: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
            }}
          >
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
            <Alert severity="error">
              Failed to load profile. Please try again.
            </Alert>
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
                <InputLabel id="unit-preference-label">
                  Unit Preference
                </InputLabel>
                <Select
                  labelId="unit-preference-label"
                  label="Unit Preference"
                  value={unitPreference}
                  onChange={(e) =>
                    setUnitPreference(e.target.value as 'metric' | 'imperial')
                  }
                >
                  <MenuItem value="metric">Metric (kg, km)</MenuItem>
                  <MenuItem value="imperial">Imperial (lb, mi)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="theme-preference-label">
                  Theme Preference
                </InputLabel>
                <Select
                  labelId="theme-preference-label"
                  label="Theme Preference"
                  value={themePreference}
                  onChange={(e) =>
                    setThemePreference(
                      e.target.value as 'system' | 'light' | 'dark'
                    )
                  }
                >
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2,
                }}
              >
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

        {/* Data Import/Export Section */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Workout Data
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Export or import your workout data in CSV format for use with
              other fitness apps.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportWorkouts}
                disabled={
                  workoutsLoading ||
                  !workoutData?.items ||
                  workoutData.items.length === 0
                }
              >
                Export Workouts
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
              >
                {importLoading ? 'Importing...' : 'Import Workouts'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImportWorkouts}
              />
            </Box>
          </Box>
        </Paper>

        {/* Preferences Section */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preferences
          </Typography>
          <form onSubmit={handlePreferencesSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Rest Time (seconds)"
                value={defaultRestSeconds}
                onChange={(e) => setDefaultRestSeconds(Number(e.target.value))}
                inputProps={{ min: 10, max: 600, step: 5 }}
                helperText="Rest time between sets (10-600 seconds)"
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending
                    ? 'Saving...'
                    : 'Save Preferences'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Snackbar for profile success/error messages */}
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

        {/* Snackbar for preferences success/error messages */}
        <Snackbar
          open={updatePreferencesMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={updatePreferencesMutation.closeSnackbar}
        >
          <Alert
            onClose={updatePreferencesMutation.closeSnackbar}
            severity={updatePreferencesMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {updatePreferencesMutation.snackbar.message}
          </Alert>
        </Snackbar>

        {/* Snackbar for import/export messages */}
        <Snackbar
          open={importMessage.open}
          autoHideDuration={6000}
          onClose={() => setImportMessage({ ...importMessage, open: false })}
        >
          <Alert
            onClose={() => setImportMessage({ ...importMessage, open: false })}
            severity={importMessage.severity}
            sx={{ width: '100%' }}
          >
            {importMessage.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
