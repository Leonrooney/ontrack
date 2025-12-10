'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
} from '@mui/material';
import { useCreateWorkout, useWorkoutHistory } from '@/hooks/workouts';
import { useExercises, useCreateCustomExercise } from '@/hooks/exercises';
import { useUserPreferences } from '@/hooks/preferences';
import { ExerciseCard, SetRow } from '@/components/workouts/ExerciseCard';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useRef, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { formatDateShort, formatDateLong } from '@/lib/format';

type ItemRow = {
  exerciseId?: string;
  customId?: string;
  name: string;
  bodyPart?: string;
  equipment?: string;
  sets: SetRow[];
};

// SetRow type - reps can be number or empty string during editing
type SetRowLocal = Omit<SetRow, 'reps'> & {
  reps: number | string;
};

/**
 * New Workout Page - Strong/Hevy-style workout logging interface
 *
 * Future extensions:
 *
 * 1. Rest Timer per Exercise:
 *    - Add state: `const [restTimers, setRestTimers] = useState<Record<number, number>>({});`
 *    - When a set is completed (onChangeSet), start a timer for that exercise index
 *    - Pass `restTimerSeconds` and `onRestTimerComplete` props to ExerciseCard
 *    - Use setInterval in ExerciseCard to countdown and update UI
 *    - Store rest duration preference in user profile (unitPreference already exists)
 *
 * 2. "Use Last Workout as Template" Button:
 *    - Add button next to "Add Exercise" in header
 *    - On click: `const lastWorkout = historyData?.items?.[0];`
 *    - If lastWorkout exists, map its items to current items state:
 *      `setItems(lastWorkout.items.map(it => ({ exerciseId/customId, name, sets: it.sets })))`
 *    - This pre-populates the workout with the exact exercises and sets from the last session
 *    - User can then modify weights/reps as needed (Strong/Hevy behavior)
 */
export default function NewWorkoutPage() {
  const router = useRouter();
  const createWorkout = useCreateWorkout();
  const [successOpen, setSuccessOpen] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const [customName, setCustomName] = useState('');
  const [customBodyPart, setCustomBodyPart] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [openInstr, setOpenInstr] = useState(false);
  const [instrTitle, setInstrTitle] = useState<string>('');
  const [instrBody, setInstrBody] = useState<string>('');
  const [workoutStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: exData } = useExercises(exerciseQuery);
  const { data: historyData } = useWorkoutHistory(20); // Fetch last 20 workouts for last performance lookup
  const { data: preferences } = useUserPreferences(); // Fetch user preferences for rest timer
  const createCustomExercise = useCreateCustomExercise();
  const addingSetRef = useRef<Record<number, boolean>>({});

  // Workout timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format elapsed time as M:SS
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const MUSCLE_OPTIONS = [
    { value: 'all', label: 'All muscles' },
    { value: 'abdominals', label: 'Abdominals', bodyPart: 'Core' },
    { value: 'obliques', label: 'Obliques', bodyPart: 'Core' },
    { value: 'lower_back', label: 'Lower Back', bodyPart: 'Back' },
    { value: 'lats', label: 'Lats', bodyPart: 'Back' },
    { value: 'middle_back', label: 'Middle Back', bodyPart: 'Back' },
    { value: 'upper_back', label: 'Upper Back', bodyPart: 'Back' },
    { value: 'quadriceps', label: 'Quadriceps', bodyPart: 'Legs' },
    { value: 'hamstrings', label: 'Hamstrings', bodyPart: 'Legs' },
    { value: 'glutes', label: 'Glutes', bodyPart: 'Legs' },
    { value: 'calves', label: 'Calves', bodyPart: 'Legs' },
    { value: 'chest', label: 'Chest', bodyPart: 'Chest' },
    { value: 'shoulders', label: 'Shoulders', bodyPart: 'Shoulders' },
    { value: 'biceps', label: 'Biceps', bodyPart: 'Arms' },
    { value: 'triceps', label: 'Triceps', bodyPart: 'Arms' },
    { value: 'forearms', label: 'Forearms', bodyPart: 'Arms' },
  ];

  function bodyPartFromMuscleValue(val: string): string | null {
    if (val === 'all') return null;
    const found = MUSCLE_OPTIONS.find((o) => o.value === val);
    return found?.bodyPart ?? null;
  }

  const selectedBodyPart = bodyPartFromMuscleValue(muscleFilter);

  const filteredCatalog = useMemo(() => {
    if (!exData?.catalog) return [];
    if (!selectedBodyPart) return exData.catalog;
    return exData.catalog.filter((ex) => ex.bodyPart === selectedBodyPart);
  }, [exData?.catalog, selectedBodyPart]);

  /**
   * Find the last performance for an exercise from workout history
   * Returns a formatted string like "Last: 100 kg x 5 @ 8 on Nov 2" or "Last: no previous data logged"
   */
  const getLastPerformance = (exerciseId?: string, customId?: string): string => {
    if (!historyData?.items || historyData.items.length === 0) {
      return 'Last: no previous data logged';
    }

    // Search through workout history (most recent first)
    for (const workout of historyData.items) {
      if (!workout.items) continue;

      // Find the exercise in this workout
      const item = workout.items.find(
        (it: any) =>
          (exerciseId && it.exerciseId === exerciseId) || (customId && it.customId === customId)
      );

      if (item && item.sets && item.sets.length > 0) {
        // Find the "best" set (highest weight x reps, or just the last set)
        const bestSet = item.sets.reduce((best: any, current: any) => {
          const bestValue = (best.weightKg || 0) * best.reps;
          const currentValue = (current.weightKg || 0) * current.reps;
          return currentValue > bestValue ? current : best;
        }, item.sets[0]);

        const parts: string[] = [];
        if (bestSet.weightKg != null) {
          parts.push(`${bestSet.weightKg} kg`);
        }
        parts.push(`x ${bestSet.reps}`);

        const dateStr = formatDateShort(workout.date);
        return `Last: ${parts.join(' ')} on ${dateStr}`;
      }
    }

    return 'Last: no previous data logged';
  };

  const addExercise = (ex: { id: string; name: string; bodyPart?: string; equipment?: string }, isCustom = false) => {
    const lastPerf = getLastPerformance(isCustom ? undefined : ex.id, isCustom ? ex.id : undefined);
    const lastSet = findLastSetForExercise(isCustom ? undefined : ex.id, isCustom ? ex.id : undefined);

    if (isCustom) {
      setItems((prev) => [
        ...prev,
        {
          customId: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          sets: [lastSet || { setNumber: 1, reps: 8 }],
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          exerciseId: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          sets: [lastSet || { setNumber: 1, reps: 8 }],
        },
      ]);
    }
    setPickerOpen(false);
  };

  /**
   * Find the last set values for an exercise to use as defaults when adding a new set
   */
  const findLastSetForExercise = (exerciseId?: string, customId?: string): SetRow | null => {
    if (!historyData?.items) return null;

    for (const workout of historyData.items) {
      if (!workout.items) continue;
      const item = workout.items.find(
        (it: any) =>
          (exerciseId && it.exerciseId === exerciseId) || (customId && it.customId === customId)
      );
      if (item && item.sets && item.sets.length > 0) {
        const lastSet = item.sets[item.sets.length - 1];
        return {
          setNumber: 1, // Will be recalculated
          weightKg: lastSet.weightKg ? Number(lastSet.weightKg) : undefined,
          reps: lastSet.reps,
          notes: lastSet.notes || undefined,
          previousWeight: lastSet.weightKg ? Number(lastSet.weightKg) : undefined,
          previousReps: lastSet.reps,
        };
      }
    }
    return null;
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    const created = await createCustomExercise.mutateAsync({
      name: customName.trim(),
      bodyPart: customBodyPart.trim() || undefined,
      equipment: customEquipment.trim() || undefined,
      mediaUrl: customMediaUrl.trim() || undefined,
    });
    setCustomName('');
    setCustomBodyPart('');
    setCustomEquipment('');
    setCustomMediaUrl('');
    setCreateCustomOpen(false);
    addExercise(
      {
        id: created.id,
        name: created.name,
        bodyPart: created.bodyPart || undefined,
        equipment: created.equipment || undefined,
      },
      true
    );
  };

  const addSet = (itemIndex: number) => {
    // Prevent double-clicks
    if (addingSetRef.current[itemIndex]) {
      return;
    }
    addingSetRef.current[itemIndex] = true;

    setItems((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      if (!item) {
        addingSetRef.current[itemIndex] = false;
        return prev; // Guard against invalid index
      }
      const lastSet = item.sets[item.sets.length - 1];
      const nextSetNum = (lastSet?.setNumber ?? 0) + 1;
      // Copy last set values or use defaults
      copy[itemIndex] = {
        ...item,
        sets: [
          ...item.sets,
          {
            setNumber: nextSetNum,
            weightKg: lastSet?.weightKg,
            reps: lastSet?.reps ?? 8,
            notes: lastSet?.notes,
          },
        ],
      };
      // Reset flag after state update
      setTimeout(() => {
        addingSetRef.current[itemIndex] = false;
      }, 100);
      return copy;
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeSet = (itemIndex: number, setIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[itemIndex].sets = copy[itemIndex].sets
        .filter((_, j) => j !== setIndex)
        .map((row, idx) => ({ ...row, setNumber: idx + 1 }));
      return copy;
    });
  };

  const onChangeSet = (itemIndex: number, setIndex: number, field: keyof SetRow, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentSet = copy[itemIndex].sets[setIndex];
      
      // Handle reps specially - allow empty string during editing, but store as number
      if (field === 'reps') {
        const numValue = value === '' ? 1 : (typeof value === 'number' ? value : Number(value) || 1);
        copy[itemIndex].sets[setIndex] = {
          ...currentSet,
          reps: numValue,
        } as SetRow;
      } else if (field === 'setNumber') {
        copy[itemIndex].sets[setIndex] = {
          ...currentSet,
          [field]: Number(value),
        } as SetRow;
      } else {
        copy[itemIndex].sets[setIndex] = {
          ...currentSet,
          [field]: value === '' ? undefined : Number(value),
        } as SetRow;
      }
      return copy;
    });
  };

  // Handle set completion toggle
  const handleToggleSetComplete = (itemIndex: number, setIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      if (item && item.sets[setIndex]) {
        const currentCompleted = item.sets[setIndex].completed;
        // Create a new array for sets to ensure React detects the change
        const newSets = [...item.sets];
        newSets[setIndex] = {
          ...item.sets[setIndex],
          completed: !currentCompleted,
        };
        copy[itemIndex] = {
          ...item,
          sets: newSets,
        };
      }
      return copy;
    });
  };

  const canSave = items.length > 0 && !createWorkout.isPending;

  const handleFinish = async () => {
    await createWorkout.mutateAsync({
      title: title || undefined,
      notes: notes || undefined,
      items: items.map((it) => ({
        exerciseId: it.exerciseId,
        customId: it.customId,
        sets: it.sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: typeof s.reps === 'string' ? (s.reps === '' ? 1 : Number(s.reps) || 1) : s.reps,
          notes: s.notes,
        })),
      })),
    });
    setSuccessOpen(true);
    setTimeout(() => {
      router.push('/workouts');
    }, 1500);
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    router.push('/workouts');
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Header with Finish button */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <IconButton size="small" aria-label="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            color="success"
            onClick={handleFinish}
            disabled={!canSave || createWorkout.isPending}
            sx={{ minWidth: '100px' }}
          >
            {createWorkout.isPending ? 'Saving...' : 'Finish'}
          </Button>
        </Stack>

        {/* Workout Info */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">{title || 'New Workout'}</Typography>
            <IconButton size="small" aria-label="Workout options">
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDateLong(workoutStartTime)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatElapsedTime(elapsedSeconds)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Action Buttons at Bottom */}
        <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setPickerOpen(true)}
            sx={{ flex: 1 }}
          >
            Add Exercises
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            sx={{ flex: 1 }}
          >
            Cancel Workout
          </Button>
        </Stack>

        {/* Exercise Cards */}
        {items.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No exercises added yet. Click "Add Exercise" to get started.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={0}>
            {items.map((item, itemIndex) => (
              <ExerciseCard
                key={itemIndex}
                exercise={{
                  exerciseId: item.exerciseId,
                  customId: item.customId,
                  name: item.name,
                  bodyPart: item.bodyPart,
                  equipment: item.equipment,
                }}
                sets={item.sets}
                lastPerformance={getLastPerformance(item.exerciseId, item.customId)}
                defaultRestSeconds={preferences?.defaultRestSeconds}
                onRemoveExercise={() => removeItem(itemIndex)}
                onChangeSet={(setIndex, field, value) => onChangeSet(itemIndex, setIndex, field, value)}
                onRemoveSet={(setIndex) => removeSet(itemIndex, setIndex)}
                onAddSet={() => addSet(itemIndex)}
                onToggleSetComplete={(setIndex) => handleToggleSetComplete(itemIndex, setIndex)}
              />
            ))}
          </Stack>
        )}

        {/* Exercise Picker Dialog */}
        <Dialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxWidth: { xs: 'calc(100% - 16px)', sm: '600px' },
            },
          }}
        >
          <DialogTitle>Select Exercise</DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="Search exercises..."
              value={exerciseQuery}
              onChange={(e) => setExerciseQuery(e.target.value)}
              sx={{ my: 1 }}
            />
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
              <Tab label={`Catalog (${exData?.catalog?.length ?? 0})`} value="catalog" />
              <Tab label={`My Custom (${exData?.custom?.length ?? 0})`} value="custom" />
            </Tabs>
            {tab === 'catalog' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <FormControl
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 200 }, width: { xs: '100%', sm: 'auto' } }}
                  >
                    <InputLabel id="muscle-filter-label">Muscle</InputLabel>
                    <Select
                      labelId="muscle-filter-label"
                      label="Muscle"
                      value={muscleFilter}
                      onChange={(e) => setMuscleFilter(e.target.value)}
                    >
                      {MUSCLE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Stack spacing={1} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {filteredCatalog.map((ex) => (
                    <Paper
                      key={ex.id}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                      }}
                      onClick={() => addExercise(ex, false)}
                    >
                      <ExerciseThumb name={ex.name} mediaUrl={ex.mediaUrl} size={40} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {ex.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                          {[ex.bodyPart, ex.equipment].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>
                      {ex.instructions ? (
                        <IconButton
                          aria-label="Instructions"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInstrTitle(ex.name);
                            setInstrBody(ex.instructions!);
                            setOpenInstr(true);
                          }}
                          sx={{ flexShrink: 0 }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Paper>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      No catalog exercises found. Try seeding or changing your search.
                    </Typography>
                  )}
                </Stack>
              </>
            )}
            {tab === 'custom' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateCustomOpen(true)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Create Custom Exercise
                </Button>
                <Stack spacing={1} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {(exData?.custom ?? []).map((ex) => (
                    <Paper
                      key={ex.id}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                      }}
                      onClick={() => addExercise(ex, true)}
                    >
                      <ExerciseThumb name={ex.name} mediaUrl={ex.mediaUrl} size={40} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {ex.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                          {[ex.bodyPart, ex.equipment].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                  {(exData?.custom?.length ?? 0) === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      You haven't created any custom exercises yet.
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPickerOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Custom Exercise Dialog */}
        <Dialog
          open={createCustomOpen}
          onClose={() => setCreateCustomOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxWidth: { xs: 'calc(100% - 16px)', sm: '400px' },
            },
          }}
        >
          <DialogTitle>Create Custom Exercise</DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                autoFocus
                label="Exercise Name *"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Body Part (optional)"
                value={customBodyPart}
                onChange={(e) => setCustomBodyPart(e.target.value)}
                fullWidth
                placeholder="e.g., Chest, Back, Legs"
              />
              <TextField
                label="Equipment (optional)"
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                fullWidth
                placeholder="e.g., Barbell, Dumbbell, Bodyweight"
              />
              <TextField
                label="Image/GIF URL (optional)"
                value={customMediaUrl}
                onChange={(e) => setCustomMediaUrl(e.target.value)}
                fullWidth
                placeholder="https://i.imgur.com/....gif"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCustomOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateCustom}
              disabled={!customName.trim() || createCustomExercise.isPending}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Instructions Dialog */}
        <Dialog
          open={openInstr}
          onClose={() => setOpenInstr(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxWidth: { xs: 'calc(100% - 16px)', sm: '600px' },
            },
          }}
        >
          <DialogTitle>{instrTitle}</DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" whiteSpace="pre-line">
              {instrBody || 'No instructions available.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInstr(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Workout Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Workout</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this workout? All progress will be lost.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Keep Working Out</Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Cancel Workout
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={successOpen} autoHideDuration={2000} onClose={() => setSuccessOpen(false)}>
          <Alert onClose={() => setSuccessOpen(false)} severity="success" sx={{ width: '100%' }}>
            Workout saved successfully!
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
