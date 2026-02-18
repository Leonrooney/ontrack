'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { useWorkout, useUpdateWorkout } from '@/hooks/workouts';
import { WorkoutEditor } from '@/components/workouts/WorkoutEditor';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;
  const { data: workout, isLoading, error } = useWorkout(workoutId);
  const updateMutation = useUpdateWorkout();

  useEffect(() => {
    if (updateMutation.isSuccess) {
      // Navigate back to workouts list after a short delay
      setTimeout(() => {
        router.push('/workouts');
      }, 1500);
    }
  }, [updateMutation.isSuccess, router]);

  const handleSave = async (data: {
    date?: string;
    title?: string;
    notes?: string;
    items: Array<{
      exerciseId?: string;
      customId?: string;
      sets: Array<{
        setNumber: number;
        weightKg?: number;
        reps: number;
        rpe?: number;
        notes?: string;
      }>;
    }>;
  }) => {
    await updateMutation.mutateAsync({
      id: workoutId,
      payload: {
        date: workout?.date ? new Date(workout.date).toISOString() : undefined,
        ...data,
      },
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !workout) {
    return (
      <MainLayout>
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Alert severity="error">
            {error ? 'Failed to load workout' : 'Workout not found'}
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Edit Workout
        </Typography>

        <WorkoutEditor
          mode="edit"
          initialWorkout={{ ...workout, items: workout.items ?? [] }}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />

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
