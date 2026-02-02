'use client';

import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { useExercises, useCreateCustomExercise } from '@/hooks/exercises';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { MUSCLE_OPTIONS, bodyPartFromMuscleValue } from '@/lib/exercises';

type SetRow = {
  setNumber: number;
  weightKg?: number;
  reps: number;
  rpe?: number;
  notes?: string;
};
type ItemRow = {
  exerciseId?: string;
  customId?: string;
  name: string;
  sets: SetRow[];
};

interface WorkoutEditorProps {
  mode: 'create' | 'edit';
  initialWorkout?: {
    id: string;
    title?: string | null;
    notes?: string | null;
    date: string;
    items: Array<{
      id: string;
      exerciseId?: string | null;
      customId?: string | null;
      exercise?: { id: string; name: string; mediaUrl?: string | null } | null;
      custom?: { id: string; name: string; mediaUrl?: string | null } | null;
      sets: Array<{
        id: string;
        setNumber: number;
        weightKg?: number | null;
        reps: number;
        rpe?: number | null;
        notes?: string | null;
      }>;
    }>;
  };
  onSave: (data: {
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
  }) => Promise<void>;
  isSaving?: boolean;
}

export function WorkoutEditor({
  mode,
  initialWorkout,
  onSave,
  isSaving = false,
}: WorkoutEditorProps) {
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customName, setCustomName] = useState('');
  const [customBodyPart, setCustomBodyPart] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [openInstr, setOpenInstr] = useState(false);
  const [instrTitle, setInstrTitle] = useState<string>('');
  const [instrBody, setInstrBody] = useState<string>('');
  const { data: exData } = useExercises(exerciseQuery);
  const createCustomExercise = useCreateCustomExercise();

  // Initialize from initialWorkout if editing
  useEffect(() => {
    if (mode === 'edit' && initialWorkout) {
      setTitle(initialWorkout.title || '');
      setNotes(initialWorkout.notes || '');
      setItems(
        initialWorkout.items.map((it) => ({
          exerciseId: it.exerciseId || undefined,
          customId: it.customId || undefined,
          name: it.exercise?.name || it.custom?.name || 'Exercise',
          sets: it.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg ? Number(s.weightKg) : undefined,
            reps: s.reps,
            rpe: s.rpe ? Number(s.rpe) : undefined,
            notes: s.notes || undefined,
          })),
        }))
      );
    }
  }, [mode, initialWorkout]);

  const selectedBodyPart = bodyPartFromMuscleValue(muscleFilter);

  const filteredCatalog = useMemo(() => {
    if (!exData?.catalog) return [];
    if (!selectedBodyPart) return exData.catalog;
    return exData.catalog.filter((ex) => ex.bodyPart === selectedBodyPart);
  }, [exData?.catalog, selectedBodyPart]);

  const addExercise = (ex: { id: string; name: string }, isCustom = false) => {
    if (isCustom) {
      setItems((prev) => [
        ...prev,
        { customId: ex.id, name: ex.name, sets: [{ setNumber: 1, reps: 8 }] },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        { exerciseId: ex.id, name: ex.name, sets: [{ setNumber: 1, reps: 8 }] },
      ]);
    }
    setPickerOpen(false);
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
    addExercise({ id: created.id, name: created.name }, true);
  };

  const addSet = (idx: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const nextSetNum = (copy[idx].sets.at(-1)?.setNumber ?? 0) + 1;
      copy[idx].sets.push({ setNumber: nextSetNum, reps: 8 });
      return copy;
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeSet = (i: number, s: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i].sets = copy[i].sets
        .filter((_, j) => j !== s)
        .map((row, idx) => ({ ...row, setNumber: idx + 1 }));
      return copy;
    });
  };

  const setCell = (i: number, s: number, field: keyof SetRow, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i].sets[s] = {
        ...copy[i].sets[s],
        [field]:
          value === ''
            ? undefined
            : field === 'reps' || field === 'setNumber'
              ? Number(value)
              : Number(value),
      };
      return copy;
    });
  };

  const canSave = items.length > 0 && !isSaving;

  const handleSave = async () => {
    await onSave({
      title: title || undefined,
      notes: notes || undefined,
      items: items.map((it) => ({
        exerciseId: it.exerciseId,
        customId: it.customId,
        sets: it.sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          notes: s.notes,
        })),
      })),
    });
  };

  return (
    <Box>
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: 'hidden' }}>
        <Stack spacing={2}>
          <TextField
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setPickerOpen(true)}
          >
            Add Exercise
          </Button>
        </Stack>
      </Paper>

      {items.map((it, i) => (
        <Paper
          key={i}
          sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: 'hidden' }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Typography
              variant="h6"
              sx={{
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
                wordBreak: 'break-word',
              }}
            >
              {it.name}
            </Typography>
            <IconButton
              onClick={() => removeItem(i)}
              aria-label="Remove exercise"
              sx={{ flex: { xs: '0 0 auto', sm: '0 1 auto' } }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            {it.sets.map((s, idx) => (
              <Stack
                key={idx}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems="center"
              >
                <Chip label={`Set ${s.setNumber}`} />
                <TextField
                  type="number"
                  label="Weight (kg)"
                  inputProps={{ step: 0.5, min: 0 }}
                  value={s.weightKg ?? ''}
                  onChange={(e) => setCell(i, idx, 'weightKg', e.target.value)}
                />
                <TextField
                  type="number"
                  label="Reps"
                  inputProps={{ step: 1, min: 1 }}
                  value={s.reps}
                  onChange={(e) => setCell(i, idx, 'reps', e.target.value)}
                />
                <TextField
                  type="number"
                  label="RPE"
                  inputProps={{ step: 0.5, min: 1, max: 10 }}
                  value={s.rpe ?? ''}
                  onChange={(e) => setCell(i, idx, 'rpe', e.target.value)}
                />
                <TextField
                  label="Notes"
                  value={s.notes ?? ''}
                  onChange={(e) => setCell(i, idx, 'notes', e.target.value)}
                  sx={{
                    flex: { xs: '1 1 100%', sm: 1 },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                />
                <IconButton
                  onClick={() => removeSet(i, idx)}
                  aria-label="Remove set"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button variant="outlined" onClick={() => addSet(i)}>
              Add Set
            </Button>
          </Stack>
        </Paper>
      ))}

      <Stack direction="row" spacing={2}>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          {isSaving
            ? 'Saving...'
            : mode === 'edit'
              ? 'Update Workout'
              : 'Save Workout'}
        </Button>
      </Stack>

      {/* Exercise picker */}
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
            <Tab
              label={`Catalog (${exData?.catalog?.length ?? 0})`}
              value="catalog"
            />
            <Tab
              label={`My Custom (${exData?.custom?.length ?? 0})`}
              value="custom"
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
                    <ExerciseThumb
                      name={ex.name}
                      mediaUrl={ex.mediaUrl}
                      size={40}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {ex.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {[ex.bodyPart, ex.equipment]
                          .filter(Boolean)
                          .join(' • ')}
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
                    No catalog exercises found. Try seeding or changing your
                    search.
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
                    <ExerciseThumb
                      name={ex.name}
                      mediaUrl={ex.mediaUrl}
                      size={40}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {ex.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {[ex.bodyPart, ex.equipment]
                          .filter(Boolean)
                          .join(' • ')}
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

      {/* Create custom exercise dialog */}
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

      {/* Instructions dialog */}
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
    </Box>
  );
}
