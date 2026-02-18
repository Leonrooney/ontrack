'use client';

import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  IconButton,
  useTheme,
} from '@mui/material';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useStaggerFadeIn } from '@/hooks/useAnimation';
import { useWorkoutHistory, useDeleteWorkout } from '@/hooks/workouts';
import { useExercises } from '@/hooks/exercises';
import { formatDateLong } from '@/lib/format';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ExploreIcon from '@mui/icons-material/Explore';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { Tooltip } from '@mui/material';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';

export default function WorkoutsPage() {
  const theme = useTheme();
  const { data, isLoading, error } = useWorkoutHistory();
  const { data: exercisesData } = useExercises('', 'all');
  const deleteMutation = useDeleteWorkout();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  // Map exercise name -> mediaUrl so we can show correct thumbnails even when workout API omits it
  const mediaUrlByName = useMemo(() => {
    const map = new Map<string, string>();
    if (exercisesData?.catalog) {
      for (const ex of exercisesData.catalog) {
        if (ex.name && ex.mediaUrl) map.set(ex.name, ex.mediaUrl);
      }
    }
    if (exercisesData?.custom) {
      for (const ex of exercisesData.custom) {
        if (ex.name && ex.mediaUrl) map.set(ex.name, ex.mediaUrl);
      }
    }
    return map;
  }, [exercisesData]);

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

  const routinesRef = useStaggerFadeIn({ stagger: 100, delay: 100 });
  const workoutsRef = useStaggerFadeIn({ stagger: 50, delay: 200 });

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Page Title */}
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Workout
        </Typography>

        {/* Begin Workout Button */}
        <AnimatedButton
          variant="contained"
          component={Link}
          href="/workouts/new"
          startIcon={<AddIcon />}
          fullWidth
          sx={{
            mb: 3,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Begin Workout
        </AnimatedButton>

        {/* Routines Section */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Routines
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 4 }} ref={routinesRef}>
          <Box sx={{ flex: 1, p: '0.5%' }}>
            <AnimatedCard
              href="/workouts/routines/new"
              hoverScale={1.01}
              sx={{
                width: '100%',
                textDecoration: 'none',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <CardActionArea sx={{ p: 2, height: '100%' }}>
                <Stack alignItems="center" spacing={1}>
                  <NoteAddIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="body1" align="center" fontWeight={500}>
                    New Routine
                  </Typography>
                </Stack>
              </CardActionArea>
            </AnimatedCard>
          </Box>
          <Box sx={{ flex: 1, p: '0.5%' }}>
            <AnimatedCard
              href="/workouts/routines/explore"
              hoverScale={1.01}
              sx={{
                width: '100%',
                textDecoration: 'none',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <CardActionArea sx={{ p: 2, height: '100%' }}>
                <Stack alignItems="center" spacing={1}>
                  <ExploreIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="body1" align="center" fontWeight={500}>
                    Explore Routines
                  </Typography>
                </Stack>
              </CardActionArea>
            </AnimatedCard>
          </Box>
        </Stack>

        {/* Explore Exercises Section */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Exercises
        </Typography>
        <Box sx={{ mb: 4, p: '0.5%' }}>
          <AnimatedCard
            href="/exercises"
            hoverScale={1.01}
            sx={{
              width: '100%',
              textDecoration: 'none',
              borderRadius: 2,
            }}
          >
            <CardActionArea sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FitnessCenterIcon
                  sx={{ fontSize: 40, color: 'text.secondary' }}
                />
                <Typography variant="body1" fontWeight={500}>
                  Explore Exercises
                </Typography>
              </Stack>
            </CardActionArea>
          </AnimatedCard>
        </Box>

        {/* Past Workouts Section */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Past Workouts
        </Typography>

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
            <Typography color="text.secondary">
              No workouts yet. Start your first one!
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} ref={workoutsRef}>
            {data!.items.map((w: any) => (
              <Box key={w.id} sx={{ p: '0.5%' }}>
                <AnimatedCard
                  hoverScale={1.01}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    overflow: 'hidden',
                    borderRadius: 2,
                    width: '100%',
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6">
                        {w.title ?? 'Workout'}
                      </Typography>
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
                      const exerciseName =
                        it.exercise?.name ?? it.custom?.name ?? 'Exercise';
                      const exerciseMediaUrl =
                        it.exercise?.mediaUrl ??
                        it.custom?.mediaUrl ??
                        mediaUrlByName.get(exerciseName) ??
                        undefined;
                      return (
                        <Box key={it.id}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <ExerciseThumb
                              name={exerciseName}
                              mediaUrl={exerciseMediaUrl}
                              size={32}
                            />
                            <Typography variant="subtitle1">
                              {exerciseName}
                            </Typography>
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
                                  {s.setNumber}) {s.weightKg ?? 'BW'}kg x{' '}
                                  {s.reps}
                                </Typography>
                                {s.isPersonalBest && (
                                  <Tooltip title="Personal best" arrow>
                                    <EmojiEventsIcon
                                      sx={{
                                        fontSize: 16,
                                        color: '#ffd700',
                                        filter:
                                          'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
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
                </AnimatedCard>
              </Box>
            ))}
          </Stack>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Workout</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this workout? This action cannot
              be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDeleteCancel}
              disabled={deleteMutation.isPending}
            >
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
