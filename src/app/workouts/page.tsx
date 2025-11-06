'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Box, Paper, Typography, Stack, Divider, Button } from '@mui/material';
import { useWorkoutHistory } from '@/hooks/workouts';
import { formatDateLong } from '@/lib/format';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import { ExerciseThumb } from '@/components/ExerciseThumb';

export default function WorkoutsHistoryPage() {
  const { data, isLoading, error } = useWorkoutHistory();

  return (
    <MainLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Workout History</Typography>
          <Button variant="contained" component={Link} href="/workouts/new" startIcon={<AddIcon />}>
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
              <Paper key={w.id} sx={{ p: 2 }}>
                <Typography variant="h6">{w.title ?? 'Workout'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateLong(w.date)}
                </Typography>
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
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                          {it.sets
                            .map(
                              (s: any) =>
                                `${s.setNumber}) ${s.weightKg ?? 'BW'}kg x ${s.reps}${s.rpe ? ` (RPE ${s.rpe})` : ''}`,
                            )
                            .join('  •  ')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </MainLayout>
  );
}

