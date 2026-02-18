'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRoutines, useDeleteRoutine, type Routine } from '@/hooks/routines';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

export default function ExploreRoutinesPage() {
  const router = useRouter();
  const { data: routines, isLoading } = useRoutines();
  const deleteRoutine = useDeleteRoutine();
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const handleStartWorkout = (routine: Routine) => {
    router.push(`/workouts/new?routine=${routine.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoutine.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error handling via mutation
    }
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          My Routines
        </Typography>

        {isLoading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={120} />
            ))}
          </Stack>
        ) : !routines || routines.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <FitnessCenterIcon
              sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No routines yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a routine to quickly start workouts with your favourite exercises
              pre-filled. You&apos;ll only need to enter reps and weight.
            </Typography>
            <Button
              variant="contained"
              component="a"
              href="/workouts/routines/new"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Create Routine
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {routines.map((routine) => (
              <Paper
                key={routine.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {routine.name}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {routine.items.slice(0, 5).map((item, i) => (
                      <Chip
                        key={i}
                        label={`${item.name} × ${item.setCount} sets`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                    {routine.items.length > 5 && (
                      <Chip
                        label={`+${routine.items.length - 5} more`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    )}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleStartWorkout(routine)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Start Workout
                  </Button>
                  <IconButton
                    aria-label="Delete routine"
                    color="error"
                    onClick={() => setDeleteTarget(routine)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        <Dialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete routine?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleteRoutine.isPending}
              sx={{ textTransform: 'none' }}
            >
              {deleteRoutine.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
