'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { useWorkoutHistory, useDeleteWorkout } from '@/hooks/workouts';
import { formatDateLong } from '@/lib/format';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Tooltip } from '@mui/material';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { useState } from 'react';

export default function WorkoutsHistoryPage() {
  const { data, isLoading, error } = useWorkoutHistory();
  const deleteMutation = useDeleteWorkout();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  const handleDeleteClick = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (workoutToDelete) {
      await deleteMutation.mutateAsync(workoutToDelete);
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setWorkoutToDelete(null);
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={{ xs: 1, sm: 0 }} sx={{ mb: 2 }}>
          <Typography variant="h4">Workout History</Typography>
          <Button variant="contained" component={Link} href="/workouts/new" startIcon={<AddIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Log Workout
          </Button>
        </Stack>

        {isLoading ? (
          <Paper sx={{ p: 2 }}>
            <Typography>Loading...</Typography>
          </Paper>
        ) : error ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="error">Failed to load workouts</Typography>
          </Paper>
        ) : (data?.items ?? []).length === 0 ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">No workouts yet. Log your first one!</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {data!.items.map((w: any) => (
              <Paper key={w.id} sx={{ p: { xs: 1.5, sm: 2 }, overflow: 'hidden' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6">{w.title ?? 'Workout'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateLong(w.date)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      component={Link}
                      href={`/workouts/${w.id}/edit`}
                      size="small"
                      aria-label="Edit workout"
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Delete workout"
                      onClick={() => handleDeleteClick(w.id)}
                      disabled={deleteMutation.isPending}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1}>
                  {w.items.map((it: any) => {
                    const exerciseName = it.exercise?.name ?? it.custom?.name ?? 'Exercise';
                    const exerciseMediaUrl = it.exercise?.mediaUrl ?? it.custom?.mediaUrl ?? undefined;
                    return (
                      <Box key={it.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ExerciseThumb name={exerciseName} mediaUrl={exerciseMediaUrl} size={32} />
                          <Typography variant="subtitle1">{exerciseName}</Typography>
                        </Stack>
                        <Box sx={{ ml: { xs: 4.5, sm: 5 } }}>
                          {it.sets.map((s: any, setIdx: number) => (
                            <Box
                              key={setIdx}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mr: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                }}
                              >
                                {s.setNumber}) {s.weightKg ?? 'BW'}kg x {s.reps}
                                {s.rpe ? ` (RPE ${s.rpe})` : ''}
                              </Typography>
                              {s.isPersonalBest && (
                                <Tooltip title="Personal best" arrow>
                                  <EmojiEventsIcon
                                    sx={{
                                      fontSize: 16,
                                      color: '#ffd700',
                                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Workout</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this workout? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for delete success/error */}
        <Snackbar
          open={deleteMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={deleteMutation.closeSnackbar}
        >
          <Alert
            onClose={deleteMutation.closeSnackbar}
            severity={deleteMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {deleteMutation.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}

