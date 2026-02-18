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
  Chip,
  CircularProgress,
} from '@mui/material';
import { useCreateWorkout, useWorkoutHistory } from '@/hooks/workouts';
import { useRoutine, useRoutines } from '@/hooks/routines';
import { useExercises, useCreateCustomExercise } from '@/hooks/exercises';
import { useUserPreferences } from '@/hooks/preferences';
import { ExerciseCard, SetRow } from '@/components/workouts/ExerciseCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useWorkoutPersistence } from '@/hooks/useWorkoutPersistence';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import {
  formatDateShort,
  formatDateLong,
  formatElapsedTime,
} from '@/lib/format';
import { MUSCLE_OPTIONS, bodyPartFromMuscleValue, exerciseNamesMatch } from '@/lib/exercises';

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

function NewWorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineId = searchParams.get('routine');
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
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false);

  const { data: exData } = useExercises(exerciseQuery);
  const { data: historyData } = useWorkoutHistory(20);
  const { data: routine } = useRoutine(routineId);
  const { data: routinesList } = useRoutines();
  const { data: preferences } = useUserPreferences(); // Fetch user preferences for rest timer
  const createCustomExercise = useCreateCustomExercise();
  const addingSetRef = useRef<Record<number, boolean>>({});
  const workoutFinishedRef = useRef(false); // Prevents auto-save from re-writing after Finish
  const { getSavedWorkout, saveWorkout, clearSavedWorkout } =
    useWorkoutPersistence();

  const routineAppliedRef = useRef(false);

  // Restore saved workout state on mount (only once)
  useEffect(() => {
    const saved = getSavedWorkout();
    if (saved) {
      setTitle(saved.title);
      setNotes(saved.notes);
      setItems(saved.items);
      setWorkoutStartTime(new Date(saved.workoutStartTime));
      const savedTime = new Date(saved.workoutStartTime);
      const now = new Date();
      const diffSeconds = Math.floor(
        (now.getTime() - savedTime.getTime()) / 1000
      );
      setElapsedSeconds(saved.elapsedSeconds + diffSeconds);
      return;
    }
    // If no saved workout but routine ID in URL, apply routine when loaded
    if (routineId && routine && !routineAppliedRef.current) {
      routineAppliedRef.current = true;
      setTitle(routine.name);
      setRoutinePickerOpen(false);
      setItems(
        routine.items.map((item) => ({
          exerciseId: item.exerciseId ?? undefined,
          customId: item.customId ?? undefined,
          name: item.name,
          sets: Array.from({ length: item.setCount }, (_, i) => ({
            setNumber: i + 1,
            reps: 8,
            weightKg: undefined,
            rpe: undefined,
            notes: undefined,
          })),
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, routine]);

  // Save workout state whenever it changes (debounced)
  useEffect(() => {
    // Never save again after user has finished the workout (stops resume FAB reappearing)
    if (workoutFinishedRef.current) return;
    // Don't save if workout is empty
    if (items.length === 0 && !title && !notes) return;

    const timeoutId = setTimeout(() => {
      saveWorkout({
        title,
        notes,
        items: items.map((it) => ({
          exerciseId: it.exerciseId,
          customId: it.customId,
          name: it.name,
          bodyPart: it.bodyPart,
          equipment: it.equipment,
          sets: it.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps:
              typeof s.reps === 'string'
                ? s.reps === ''
                  ? 1
                  : Number(s.reps) || 1
                : s.reps,
            rpe: s.rpe,
            notes: s.notes,
          })),
        })),
        workoutStartTime: workoutStartTime.toISOString(),
        elapsedSeconds,
      });
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timeoutId);
  }, [title, notes, items, workoutStartTime, elapsedSeconds, saveWorkout]);

  // Workout timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedBodyPart = bodyPartFromMuscleValue(muscleFilter);

  const filteredCatalog = useMemo(() => {
    if (!exData?.catalog) return [];
    if (!selectedBodyPart) return exData.catalog;
    return exData.catalog.filter((ex) => ex.bodyPart === selectedBodyPart);
  }, [exData?.catalog, selectedBodyPart]);

  // Hide custom exercises that match a catalog exercise by normalized name (e.g. "Bench Press (Barbell)" = "Barbell Bench Press").
  const filteredCustomList = useMemo(() => {
    const catalog = exData?.catalog ?? [];
    return (exData?.custom ?? []).filter(
      (customEx) => !catalog.some((catEx) => exerciseNamesMatch(catEx.name, customEx.name))
    );
  }, [exData?.catalog, exData?.custom]);

  /**
   * Find the last performance for an exercise from workout history
   * Returns a formatted string like "Last: 100 kg x 5 @ 8 on Nov 2" or "Last: no previous data logged"
   */
  const getLastPerformance = (
    exerciseId?: string,
    customId?: string
  ): string => {
    if (!historyData?.items || historyData.items.length === 0) {
      return 'Last: no previous data logged';
    }

    // Search through workout history (most recent first)
    for (const workout of historyData.items) {
      if (!workout.items) continue;

      // Find the exercise in this workout
      const item = workout.items.find(
        (it: any) =>
          (exerciseId && it.exerciseId === exerciseId) ||
          (customId && it.customId === customId)
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

  const addExercise = (
    ex: { id: string; name: string; bodyPart?: string; equipment?: string },
    isCustom = false
  ) => {
    const lastPerf = getLastPerformance(
      isCustom ? undefined : ex.id,
      isCustom ? ex.id : undefined
    );
    const lastSet = findLastSetForExercise(
      isCustom ? undefined : ex.id,
      isCustom ? ex.id : undefined
    );

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
  const findLastSetForExercise = (
    exerciseId?: string,
    customId?: string
  ): SetRow | null => {
    if (!historyData?.items) return null;

    for (const workout of historyData.items) {
      if (!workout.items) continue;
      const item = workout.items.find(
        (it: any) =>
          (exerciseId && it.exerciseId === exerciseId) ||
          (customId && it.customId === customId)
      );
      if (item && item.sets && item.sets.length > 0) {
        const lastSet = item.sets[item.sets.length - 1];
        return {
          setNumber: 1, // Will be recalculated
          weightKg: lastSet.weightKg ? Number(lastSet.weightKg) : undefined,
          reps: lastSet.reps,
          notes: lastSet.notes || undefined,
          previousWeight: lastSet.weightKg
            ? Number(lastSet.weightKg)
            : undefined,
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

  const applyRoutine = (r: { name: string; items: { exerciseId?: string | null; customId?: string | null; name: string; setCount: number }[] }) => {
    setTitle(r.name);
    setItems(
      r.items.map((item) => ({
        exerciseId: item.exerciseId ?? undefined,
        customId: item.customId ?? undefined,
        name: item.name,
        sets: Array.from({ length: item.setCount }, (_, i) => ({
          setNumber: i + 1,
          reps: 8,
          weightKg: undefined,
          rpe: undefined,
          notes: undefined,
        })),
      }))
    );
    setRoutinePickerOpen(false);
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

  const onChangeSet = (
    itemIndex: number,
    setIndex: number,
    field: keyof SetRow,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentSet = copy[itemIndex].sets[setIndex];

      // Handle reps specially - allow empty string during editing, but store as number
      if (field === 'reps') {
        const numValue =
          value === ''
            ? 1
            : typeof value === 'number'
              ? value
              : Number(value) || 1;
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
    workoutFinishedRef.current = true; // Stop auto-save from re-writing to localStorage
    await createWorkout.mutateAsync({
      title: title || undefined,
      notes: notes || undefined,
      items: items.map((it) => ({
        exerciseId: it.exerciseId,
        customId: it.customId,
        sets: it.sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps:
            typeof s.reps === 'string'
              ? s.reps === ''
                ? 1
                : Number(s.reps) || 1
              : s.reps,
          notes: s.notes,
        })),
      })),
    });
    // Clear saved workout when finished
    clearSavedWorkout();
    setSuccessOpen(true);
    setTimeout(() => {
      router.push('/workouts');
    }, 1500);
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    // Clear saved workout when cancelled
    clearSavedWorkout();
    router.push('/workouts');
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
          <IconButton size="small" aria-label="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Workout Info */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Workout Name"
              variant="standard"
              sx={{
                flex: 1,
                '& .MuiInput-underline:before': {
                  borderBottom: 'none',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottom: 'none',
                },
                '& .MuiInput-underline:after': {
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                },
                '& .MuiInputBase-input': {
                  fontSize: '2rem',
                  fontWeight: 600,
                  py: 0.5,
                },
              }}
              InputProps={{
                disableUnderline: false,
              }}
            />
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

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setPickerOpen(true)}
            sx={{ flex: 1, minWidth: 140, textTransform: 'none', fontWeight: 600 }}
          >
            Add Exercises
          </Button>
          {routinesList && routinesList.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => setRoutinePickerOpen(true)}
              sx={{ flex: 1, minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Use Routine
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            sx={{ flex: 1, minWidth: 140, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel Workout
          </Button>
        </Stack>

        {/* Exercise Cards */}
        {items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <AddIcon
              sx={{
                fontSize: 48,
                color: 'text.secondary',
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No exercises added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {routinesList && routinesList.length > 0
                ? 'Use a routine to pre-fill exercises, or add them manually.'
                : 'Click "Add Exercises" to start building your workout'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
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
                lastPerformance={getLastPerformance(
                  item.exerciseId,
                  item.customId
                )}
                defaultRestSeconds={preferences?.defaultRestSeconds}
                onRemoveExercise={() => removeItem(itemIndex)}
                onChangeSet={(setIndex, field, value) =>
                  onChangeSet(itemIndex, setIndex, field, value)
                }
                onRemoveSet={(setIndex) => removeSet(itemIndex, setIndex)}
                onAddSet={() => addSet(itemIndex)}
                onToggleSetComplete={(setIndex) =>
                  handleToggleSetComplete(itemIndex, setIndex)
                }
              />
            ))}
          </Stack>
        )}

        {/* Routine Picker Dialog */}
        <Dialog
          open={routinePickerOpen}
          onClose={() => setRoutinePickerOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { m: 2 } }}
        >
          <DialogTitle>Choose a routine</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Pre-fill your workout with exercises from a saved routine. You&apos;ll just need to enter reps and weight.
            </DialogContentText>
            <Stack spacing={1}>
              {routinesList?.map((r) => (
                <Paper
                  key={r.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                  onClick={() => applyRoutine(r)}
                >
                  <Typography fontWeight={600}>{r.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {r.items.length} exercise{r.items.length !== 1 ? 's' : ''} ·{' '}
                    {r.items.reduce((sum, i) => sum + i.setCount, 0)} sets total
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Finish bar: in-flow so it sits below all exercises and scrolls with content */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleFinish}
            disabled={!canSave || createWorkout.isPending}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            {createWorkout.isPending ? 'Saving...' : 'Finish workout'}
          </Button>
        </Box>

        {/* Exercise Picker Dialog */}
        <Dialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxWidth: { xs: 'calc(100% - 16px)', sm: '700px' },
              maxHeight: { xs: 'calc(100% - 32px)', sm: '80vh' },
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Add Exercise
            </Typography>
          </DialogTitle>
          <DialogContent
            sx={{
              px: { xs: 2, sm: 3 },
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TextField
              autoFocus
              fullWidth
              placeholder="Search exercises..."
              value={exerciseQuery}
              onChange={(e) => setExerciseQuery(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                mb: 2,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Tab
                label={`Catalog (${exData?.catalog?.length ?? 0})`}
                value="catalog"
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
              <Tab
                label={`My Custom (${filteredCustomList.length})`}
                value="custom"
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
            </Tabs>
            {tab === 'catalog' && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    mb: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: { xs: '100%', sm: 200 },
                      width: { xs: '100%', sm: 'auto' },
                    }}
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
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <Stack spacing={1.5}>
                    {filteredCatalog.map((ex) => (
                      <Paper
                        key={ex.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 0,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() => addExercise(ex, false)}
                      >
                        <ExerciseThumb
                          name={ex.name}
                          mediaUrl={ex.mediaUrl}
                          size={48}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              mb: 0.5,
                            }}
                          >
                            {ex.name}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {ex.bodyPart && (
                              <Chip
                                label={ex.bodyPart}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {ex.equipment && (
                              <Chip
                                label={ex.equipment}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Stack>
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
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary" variant="body2">
                          No exercises found. Try adjusting your search or
                          filter.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}
            {tab === 'custom' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateCustomOpen(true)}
                  fullWidth
                  sx={{
                    mb: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    py: 1.5,
                  }}
                >
                  Create Custom Exercise
                </Button>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <Stack spacing={1.5}>
                    {filteredCustomList.map((ex) => (
                      <Paper
                        key={ex.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 0,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() => addExercise(ex, true)}
                      >
                        <ExerciseThumb
                          name={ex.name}
                          mediaUrl={ex.mediaUrl}
                          size={48}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              mb: 0.5,
                            }}
                          >
                            {ex.name}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {ex.bodyPart && (
                              <Chip
                                label={ex.bodyPart}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {ex.equipment && (
                              <Chip
                                label={ex.equipment}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Paper>
                    ))}
                    {filteredCustomList.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary" variant="body2">
                          You haven't created any custom exercises yet.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
            <Button
              onClick={() => setPickerOpen(false)}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Close
            </Button>
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
        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        >
          <DialogTitle>Cancel Workout</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this workout? All progress will be
              lost.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Working Out
            </Button>
            <Button
              onClick={handleCancelConfirm}
              color="error"
              variant="contained"
            >
              Cancel Workout
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={successOpen}
          autoHideDuration={2000}
          onClose={() => setSuccessOpen(false)}
        >
          <Alert
            onClose={() => setSuccessOpen(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Workout saved successfully.
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    }>
      <NewWorkoutPageContent />
    </Suspense>
  );
}
