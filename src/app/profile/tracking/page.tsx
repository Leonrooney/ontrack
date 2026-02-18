'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import { useWeightTrackingData, useExerciseTrackingData } from '@/hooks/weight';
import { useExercises } from '@/hooks/exercises';
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import { MUSCLE_OPTIONS, bodyPartFromMuscleValue, exerciseNamesMatch } from '@/lib/exercises';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

type TabValue = 'weight' | 'exercise';

type SelectedExercise = {
  key: string;
  label: string;
  exerciseId?: string;
  customId?: string;
  mediaUrl?: string | null;
};

export default function TrackingPage() {
  const theme = useTheme();
  const [tab, setTab] = useState<TabValue>('weight');
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [exerciseMetric, setExerciseMetric] = useState<'maxWeight' | 'maxReps'>('maxWeight');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [pickerTab, setPickerTab] = useState<'catalog' | 'custom'>('catalog');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');

  const { data: weightData, isLoading: weightLoading } = useWeightTrackingData(365);
  const { data: exercisesData } = useExercises(exerciseQuery);

  const selectedBodyPart = bodyPartFromMuscleValue(muscleFilter);
  const filteredCatalog = useMemo(() => {
    if (!exercisesData?.catalog) return [];
    if (!selectedBodyPart) return exercisesData.catalog;
    return exercisesData.catalog.filter((ex) => ex.bodyPart === selectedBodyPart);
  }, [exercisesData?.catalog, selectedBodyPart]);
  // Hide custom exercises that match a catalog exercise by normalized name (e.g. "Bench Press (Barbell)" custom
  // matches "Barbell Bench Press" catalog) so they appear only once under Catalog; API aggregates both.
  const customList = useMemo(() => {
    const catalog = exercisesData?.catalog ?? [];
    return (exercisesData?.custom ?? []).filter(
      (customEx) => !catalog.some((catEx) => exerciseNamesMatch(catEx.name, customEx.name))
    );
  }, [exercisesData?.catalog, exercisesData?.custom]);

  const {
    data: exerciseData,
    isLoading: exerciseLoading,
  } = useExerciseTrackingData(
    selectedExercise
      ? {
          exerciseId: selectedExercise.exerciseId,
          customId: selectedExercise.customId,
          metric: exerciseMetric,
          limit: 500,
        }
      : null
  );

  const weightChartData = useMemo(() => {
    if (!weightData?.data?.length) return [];
    return weightData.data.map((d) => ({
      date: d.date,
      label: format(new Date(d.date), 'MMM d'),
      value: d.weightKg,
    }));
  }, [weightData]);

  const exerciseChartData = useMemo(() => {
    if (!exerciseData?.data?.length) return [];
    const key = exerciseMetric === 'maxWeight' ? 'maxWeight' : 'maxReps';
    return exerciseData.data
      .map((d) => ({
        date: d.date,
        label: d.label ?? format(new Date(d.date), 'MMM d'),
        value: key === 'maxWeight' ? d.maxWeight : d.maxReps,
      }))
      .filter((d) => d.value != null) as Array<{ date: string; label: string; value: number }>;
  }, [exerciseData, exerciseMetric]);

  const strokeColor = theme.palette.primary.main;

  const handleSelectExercise = (ex: {
    id: string;
    name: string;
    mediaUrl?: string | null;
    bodyPart?: string | null;
    equipment?: string | null;
  }, isCustom: boolean) => {
    setSelectedExercise({
      key: isCustom ? `u-${ex.id}` : `c-${ex.id}`,
      label: isCustom ? `${ex.name} (custom)` : ex.name,
      exerciseId: isCustom ? undefined : ex.id,
      customId: isCustom ? ex.id : undefined,
      mediaUrl: ex.mediaUrl ?? null,
    });
    setPickerOpen(false);
  };

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Box sx={{ mb: 2 }}>
          <Link
            href="/profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'inherit',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <ArrowBackIcon fontSize="small" /> Back to Profile
          </Link>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View your weight over time or your progress on a specific exercise.
        </Typography>

        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Tabs
            value={tab}
            onChange={(_, v: TabValue) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Weight" value="weight" />
            <Tab label="Exercise" value="exercise" />
          </Tabs>

          {tab === 'weight' && (
            <Box>
              {weightLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : weightChartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No weight data yet. Log your weight from the Profile page to see your progress here.
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weightChartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke={theme.palette.text.secondary}
                        label={{
                          value: 'Weight (kg)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 11 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border:
                            theme.palette.mode === 'dark'
                              ? '1px solid rgba(255,255,255,0.1)'
                              : `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => [`${value} kg`, 'Weight']}
                        labelFormatter={(label) => label}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Weight"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          )}

          {tab === 'exercise' && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={
                    selectedExercise ? (
                      <ExerciseThumb
                        name={selectedExercise.label}
                        mediaUrl={selectedExercise.mediaUrl ?? undefined}
                        size={28}
                      />
                    ) : (
                      <FitnessCenterIcon />
                    )
                  }
                  onClick={() => setPickerOpen(true)}
                  sx={{ textTransform: 'none', minHeight: 44 }}
                >
                  {selectedExercise ? selectedExercise.label : 'Select exercise'}
                </Button>
                <FormControl sx={{ minWidth: 160 }} disabled={!selectedExercise}>
                  <InputLabel id="tracking-metric-label">Metric</InputLabel>
                  <Select
                    labelId="tracking-metric-label"
                    label="Metric"
                    value={exerciseMetric}
                    onChange={(e) =>
                      setExerciseMetric(e.target.value as 'maxWeight' | 'maxReps')
                    }
                  >
                    <MenuItem value="maxWeight">Max weight (kg)</MenuItem>
                    <MenuItem value="maxReps">Max reps</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {!selectedExercise ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Click &quot;Select exercise&quot; to choose an exercise and see your progression over time.
                </Typography>
              ) : exerciseLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : exerciseChartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No data yet for this exercise. Complete workouts with this exercise to see your progress.
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={exerciseChartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke={theme.palette.text.secondary}
                        label={{
                          value: exerciseMetric === 'maxWeight' ? 'Weight (kg)' : 'Reps',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 11 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border:
                            theme.palette.mode === 'dark'
                              ? '1px solid rgba(255,255,255,0.1)'
                              : `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => [
                          String(value),
                          exerciseMetric === 'maxWeight' ? 'Max weight' : 'Max reps',
                        ]}
                        labelFormatter={(label) => label}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name={exerciseMetric === 'maxWeight' ? 'Max weight' : 'Max reps'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          )}
        </Paper>
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
            Select exercise to track
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
            value={pickerTab}
            onChange={(_, v: 'catalog' | 'custom') => setPickerTab(v)}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label={`Catalog (${exercisesData?.catalog?.length ?? 0})`}
              value="catalog"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              label={`My Custom (${customList.length})`}
              value="custom"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
          {pickerTab === 'catalog' && (
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
                  <InputLabel id="tracking-muscle-label">Muscle group</InputLabel>
                  <Select
                    labelId="tracking-muscle-label"
                    label="Muscle group"
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
                      onClick={() => handleSelectExercise(ex, false)}
                    >
                      <ExerciseThumb
                        name={ex.name}
                        mediaUrl={ex.mediaUrl ?? undefined}
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
                  {filteredCatalog.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary" variant="body2">
                        No exercises found. Try adjusting your search or muscle filter.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}
          {pickerTab === 'custom' && (
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Stack spacing={1.5}>
                {customList.map((ex) => (
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
                    onClick={() => handleSelectExercise(ex, true)}
                  >
                    <ExerciseThumb
                      name={ex.name}
                      mediaUrl={ex.mediaUrl ?? undefined}
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
                {customList.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" variant="body2">
                      No custom exercises yet. Create them from the workout page.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
