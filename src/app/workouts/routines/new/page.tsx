'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useExercises, useCreateCustomExercise } from '@/hooks/exercises';
import { useCreateRoutine } from '@/hooks/routines';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import {
  MUSCLE_OPTIONS,
  bodyPartFromMuscleValue,
  exerciseNamesMatch,
} from '@/lib/exercises';

type RoutineItemRow = {
  exerciseId?: string;
  customId?: string;
  name: string;
  bodyPart?: string;
  equipment?: string;
  setCount: number;
};

export default function NewRoutinePage() {
  const router = useRouter();
  const createRoutine = useCreateRoutine();
  const [name, setName] = useState('');
  const [items, setItems] = useState<RoutineItemRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [customName, setCustomName] = useState('');
  const [customBodyPart, setCustomBodyPart] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [defaultSetCount, setDefaultSetCount] = useState(3);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const { data: exData } = useExercises(exerciseQuery);
  const createCustomExercise = useCreateCustomExercise();

  const selectedBodyPart = bodyPartFromMuscleValue(muscleFilter);
  const filteredCatalog = useMemo(() => {
    if (!exData?.catalog) return [];
    if (!selectedBodyPart) return exData.catalog;
    return exData.catalog.filter((ex) => ex.bodyPart === selectedBodyPart);
  }, [exData?.catalog, selectedBodyPart]);
  const filteredCustomList = useMemo(() => {
    const catalog = exData?.catalog ?? [];
    return (exData?.custom ?? []).filter(
      (customEx) =>
        !catalog.some((catEx) =>
          exerciseNamesMatch(catEx.name, customEx.name)
        )
    );
  }, [exData?.catalog, exData?.custom]);

  const addExercise = (
    ex: { id: string; name: string; bodyPart?: string; equipment?: string },
    isCustom: boolean
  ) => {
    if (isCustom) {
      setItems((prev) => [
        ...prev,
        { customId: ex.id, name: ex.name, setCount: defaultSetCount },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          exerciseId: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          setCount: defaultSetCount,
        },
      ]);
    }
    setPickerOpen(false);
  };

  const updateSetCount = (idx: number, setCount: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], setCount: Math.max(1, Math.min(20, setCount)) };
      return copy;
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    try {
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
          bodyPart: created.bodyPart ?? undefined,
          equipment: created.equipment ?? undefined,
        },
        true
      );
    } catch {
      setSnackbar({ open: true, message: 'Failed to create exercise', severity: 'error' });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSnackbar({ open: true, message: 'Enter a routine name', severity: 'error' });
      return;
    }
    if (items.length === 0) {
      setSnackbar({ open: true, message: 'Add at least one exercise', severity: 'error' });
      return;
    }
    try {
      await createRoutine.mutateAsync({
        name: name.trim(),
        items: items.map((it) => ({
          ...(it.exerciseId ? { exerciseId: it.exerciseId } : { customId: it.customId! }),
          setCount: it.setCount,
        })),
      });
      setSnackbar({ open: true, message: 'Routine saved.', severity: 'success' });
      router.push('/workouts');
    } catch {
      setSnackbar({ open: true, message: 'Failed to save routine', severity: 'error' });
    }
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          New Routine
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Routine Name"
            placeholder="e.g. Push Day, Upper Body"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            variant="outlined"
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPickerOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Exercise
            </Button>
            <Typography variant="body2" color="text.secondary">
              Default sets per exercise:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={defaultSetCount}
              onChange={(e) =>
                setDefaultSetCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
              }
              inputProps={{ min: 1, max: 20 }}
              sx={{ width: 72 }}
            />
          </Stack>

          {items.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No exercises yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add exercises to define your routine. When you start a workout with this
                routine, exercises will be pre-filled and you just enter reps and weight.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setPickerOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Add Exercise
              </Button>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {items.map((item, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <ExerciseThumb name={item.name} size={40} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {item.bodyPart && (
                        <Chip label={item.bodyPart} size="small" variant="outlined" />
                      )}
                      {item.equipment && (
                        <Chip label={item.equipment} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </Box>
                  <TextField
                    label="Sets"
                    type="number"
                    size="small"
                    value={item.setCount}
                    onChange={(e) =>
                      updateSetCount(idx, Number(e.target.value) || 1)
                    }
                    inputProps={{ min: 1, max: 20 }}
                    sx={{ width: 80 }}
                  />
                  <IconButton
                    aria-label="Remove"
                    onClick={() => removeItem(idx)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={
                !name.trim() || items.length === 0 || createRoutine.isPending
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {createRoutine.isPending ? 'Saving...' : 'Save Routine'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/workouts')}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>

        {/* Exercise Picker Dialog */}
        <Dialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="Search exercises..."
              value={exerciseQuery}
              onChange={(e) => setExerciseQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label={`Catalog (${exData?.catalog?.length ?? 0})`} value="catalog" />
              <Tab label={`Custom (${filteredCustomList.length})`} value="custom" />
            </Tabs>
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {tab === 'catalog' && (
                <Stack spacing={1.5}>
                  <FormControl size="small" sx={{ minWidth: 160, mb: 1 }}>
                    <InputLabel>Muscle</InputLabel>
                    <Select
                      label="Muscle"
                      value={muscleFilter}
                      onChange={(e) => setMuscleFilter(e.target.value)}
                    >
                      {MUSCLE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      }}
                      onClick={() => addExercise(ex, false)}
                    >
                      <ExerciseThumb name={ex.name} mediaUrl={ex.mediaUrl} size={48} />
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={500}>{ex.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          {ex.bodyPart && <Chip label={ex.bodyPart} size="small" />}
                          {ex.equipment && <Chip label={ex.equipment} size="small" />}
                        </Stack>
                      </Box>
                      {ex.instructions && (
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
              {tab === 'custom' && (
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateCustomOpen(true)}
                    fullWidth
                    sx={{ mb: 1, textTransform: 'none' }}
                  >
                    Create Custom Exercise
                  </Button>
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
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      }}
                      onClick={() => addExercise(ex, true)}
                    >
                      <ExerciseThumb name={ex.name} mediaUrl={ex.mediaUrl} size={48} />
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={500}>{ex.name}</Typography>
                        {ex.bodyPart && <Chip label={ex.bodyPart} size="small" sx={{ mt: 0.5 }} />}
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        {/* Create Custom Exercise Dialog */}
        <Dialog
          open={createCustomOpen}
          onClose={() => setCreateCustomOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{ sx: { m: 2 } }}
        >
          <DialogTitle>Create Custom Exercise</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2}>
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
                placeholder="e.g., Barbell, Dumbbell"
              />
              <TextField
                label="Image URL (optional)"
                value={customMediaUrl}
                onChange={(e) => setCustomMediaUrl(e.target.value)}
                fullWidth
                placeholder="https://..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCustomOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCustom}
              disabled={!customName.trim() || createCustomExercise.isPending}
              sx={{ textTransform: 'none' }}
            >
              {createCustomExercise.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
