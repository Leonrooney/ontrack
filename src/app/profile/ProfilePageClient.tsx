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
import { PasswordField } from '@/components/ui/PasswordField';
import { useProfile, useUpdateProfile } from '@/hooks/profile';
import { useUserPreferences, useUpdatePreferences } from '@/hooks/preferences';
import { useTheme } from '@mui/material/styles';
import { useWorkoutHistory } from '@/hooks/workouts';
import { useWeightLogs, useLogWeight } from '@/hooks/weight';
import { exportWorkoutsToCSV } from '@/lib/workout-csv';
import { validatePassword } from '@/lib/validators';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LogoutIcon from '@mui/icons-material/Logout';
import { format } from 'date-fns';

export function ProfilePageClient() {
  const theme = useTheme();
  const { data: profile, isLoading, error } = useProfile();
  const updateMutation = useUpdateProfile();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const { data: workoutData, isLoading: workoutsLoading } =
    useWorkoutHistory(1000); // Get all workouts for export
  const { data: weightData } = useWeightLogs(10);
  const logWeightMutation = useLogWeight();
  const queryClient = useQueryClient();
  const [weightSnackbar, setWeightSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [weightInput, setWeightInput] = useState('');
  const [weightNote, setWeightNote] = useState('');

  const [name, setName] = useState('');
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>(
    'metric'
  );
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

  // Change password
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Initialize form values when profile data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUnitPreference(profile.unitPreference);
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
    });
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate({ defaultRestSeconds });
    updateMutation.mutate({ unitPreference });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    const err = validatePassword(newPassword);
    if (err) {
      setChangePasswordError(`New password: ${err}`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }
    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChangePasswordError(data.error || 'Failed to change password');
        return;
      }
      setChangePasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePasswordOpen(false);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) return;
    logWeightMutation.mutate(
      { weightKg: kg, note: weightNote.trim() || undefined },
      {
        onSuccess: () => {
          setWeightInput('');
          setWeightNote('');
          setWeightSnackbar({
            open: true,
            message: 'Weight logged successfully',
            severity: 'success',
          });
        },
        onError: (err: Error) => {
          setWeightSnackbar({
            open: true,
            message: err.message || 'Failed to log weight',
            severity: 'error',
          });
        },
      }
    );
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
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: { xs: 2, sm: 3 },
            }}
          >
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
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: { xs: 2, sm: 3 },
            }}
          >
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
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: { xs: 2, sm: 3 },
          }}
        >
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

        {/* Weight check-in Section */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Weight check-in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Log your current weight to track progress over time. View history and
            graphs in Tracking.
          </Typography>
          <form onSubmit={handleLogWeight}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <TextField
                  type="number"
                  label="Weight (kg)"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  inputProps={{ min: 20, max: 500, step: 0.1 }}
                  required
                  sx={{ width: 140 }}
                />
                <TextField
                  label="Note (optional)"
                  value={weightNote}
                  onChange={(e) => setWeightNote(e.target.value)}
                  placeholder="e.g. Morning, post-workout"
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={logWeightMutation.isPending || !weightInput.trim()}
                >
                  {logWeightMutation.isPending ? 'Logging...' : 'Log weight'}
                </Button>
              </Box>
              {weightData?.entries?.length ? (
                <Typography variant="body2" color="text.secondary">
                  Last logged: {Number(weightData.entries[0].weightKg)} kg
                  {weightData.entries[0].loggedAt
                    ? ` on ${format(new Date(weightData.entries[0].loggedAt), 'MMM d, yyyy')}`
                    : ''}
                </Typography>
              ) : null}
            </Box>
          </form>
        </Paper>

        {/* Tracking Section */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View graphs of your weight over time or your progress on a specific
            exercise (max weight or max reps).
          </Typography>
          <Button
            component={Link}
            href="/profile/tracking"
            variant="outlined"
            startIcon={<TrendingUpIcon />}
          >
            View tracking
          </Button>
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
                  disabled={
                    updatePreferencesMutation.isPending || updateMutation.isPending
                  }
                >
                  {updatePreferencesMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : 'Save Preferences'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Account: Log out + Change password (last widget) */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Log out
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setChangePasswordOpen(true);
                  setChangePasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                sx={{ display: changePasswordOpen ? 'none' : 'inline-flex' }}
              >
                Change password
              </Button>
            </Box>
            {changePasswordOpen && (
              <form onSubmit={handleChangePassword}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  {changePasswordError && (
                    <Alert severity="error" onClose={() => setChangePasswordError('')}>
                      {changePasswordError}
                    </Alert>
                  )}
                  <PasswordField
                    fullWidth
                    label="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <PasswordField
                    fullWidth
                    label="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    helperText="At least 8 characters, with uppercase, lowercase, and a number"
                  />
                  <PasswordField
                    fullWidth
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={changePasswordLoading}
                    >
                      {changePasswordLoading ? 'Updating...' : 'Update password'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setChangePasswordOpen(false);
                        setChangePasswordError('');
                      }}
                      disabled={changePasswordLoading}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </form>
            )}
          </Box>
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

        {/* Snackbar for weight log */}
        <Snackbar
          open={weightSnackbar.open}
          autoHideDuration={5000}
          onClose={() => setWeightSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert
            onClose={() => setWeightSnackbar((s) => ({ ...s, open: false }))}
            severity={weightSnackbar.severity}
            sx={{ width: '100%' }}
          >
            {weightSnackbar.message}
          </Alert>
        </Snackbar>

        <Snackbar
          open={changePasswordSuccess}
          autoHideDuration={5000}
          onClose={() => setChangePasswordSuccess(false)}
        >
          <Alert severity="success" onClose={() => setChangePasswordSuccess(false)} sx={{ width: '100%' }}>
            Password updated successfully.
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
