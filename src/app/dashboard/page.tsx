'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Box,
  Grid,
  CardContent,
  Skeleton,
  Alert,
  Chip,
  Button,
  Divider,
  Stack,
  Tabs,
  Tab,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useEffect, useRef, useState } from 'react';
import { FitnessCenter, ChevronLeft, ChevronRight, FormatQuote } from '@mui/icons-material';
import {
  useRecentWorkout,
  useWeeklyWorkoutStats,
  useMonthlyWorkoutStats,
  useMuscleGroupStats,
} from '@/hooks/workouts';
import { useExerciseMediaMap } from '@/hooks/exercises';
import { formatDateLong } from '@/lib/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import Link from 'next/link';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { startOfMonth, subMonths } from 'date-fns';

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: recentWorkout, isLoading: isLoadingRecent } =
    useRecentWorkout();
  const mediaUrlByName = useExerciseMediaMap();
  const [frequencyView, setFrequencyView] = useState<'week' | 'month'>('week');
  const [monthOffset, setMonthOffset] = useState(0);
  const [muscleGroupRange, setMuscleGroupRange] = useState(30);
  const { data: weeklyData, isLoading: isLoadingWeekly } =
    useWeeklyWorkoutStats(10);
  const { data: monthlyData, isLoading: isLoadingMonthly } =
    useMonthlyWorkoutStats(monthOffset);
  const { data: muscleGroupData, isLoading: isLoadingMuscleGroups } =
    useMuscleGroupStats(muscleGroupRange);

  // Quote widget (proxied via /api/quote from Quotable API)
  const [quote, setQuote] = useState<{ content: string; author: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(false);
    fetch('/api/quote')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Quote fetch failed'))))
      .then((data: { content: string; author: string }) => {
        if (!cancelled && data?.content && data?.author) {
          setQuote({ content: data.content, author: data.author });
        }
      })
      .catch(() => { if (!cancelled) setQuoteError(true); })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setMonthOffset((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const resetToCurrent = () => {
    setMonthOffset(0);
  };

  // Get month label
  const getMonthLabel = () => {
    if (!monthlyData) return 'This Month';
    if (monthOffset === 0) return 'This Month';
    if (monthOffset === -1) return 'Last Month';
    return monthlyData.month;
  };

  // Prepare calendar grid for month view (7 columns; pad only so last row is full — no empty bottom row)
  const getCalendarGrid = () => {
    if (!monthlyData) return [];
    const calendar = monthlyData.calendar;
    const firstDay = new Date(calendar[0].date);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0

    const grid: Array<{
      day: number;
      date: string;
      hasWorkout: boolean;
      isCurrentMonth: boolean;
      workoutTitle?: string;
      workoutId?: string;
    } | null> = [];

    // Empty cells for days before month starts
    for (let i = 0; i < adjustedStart; i++) {
      grid.push(null);
    }
    // All days of the month
    calendar.forEach((day) => grid.push(day));
    // Pad only to complete the last row so every row has 7 cells (no stretched or empty full row)
    while (grid.length % 7 !== 0) grid.push(null);

    return grid;
  };

  return (
    <MainLayout>
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          pb: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: { xs: 2, sm: 3 },
          }}
        >
          Dashboard
        </Typography>

        {/* Quote widget */}
        <AnimatedCard
          hoverScale={1.005}
          sx={{
            mb: { xs: 2, sm: 3 },
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <FormatQuote sx={{ fontSize: 18 }} />
              Quote
            </Typography>
            {quoteLoading ? (
              <Box sx={{ py: 1 }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="40%" sx={{ mt: 0.5 }} />
              </Box>
            ) : quoteError || !quote ? (
              <Typography variant="body2" color="text.secondary">
                No quote today — check back later.
              </Typography>
            ) : (
              <>
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                  &ldquo;{quote.content}&rdquo;
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  — {quote.author}
                </Typography>
              </>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Recent Workout & Workout Frequency Widgets */}
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{ mt: { xs: 0, sm: 1 } }}
        >
          {/* Recent Workout Widget */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              minHeight: 0,
              // Add padding to account for scale animation (1% scale = ~0.5% padding needed)
              p: '0.5%',
            }}
          >
            <AnimatedCard
              hoverScale={1.01}
              sx={{
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Recent Workout
                </Typography>
                {isLoadingRecent ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                ) : !recentWorkout ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <FitnessCenter
                      sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                    >
                      No workouts yet
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Start tracking your workouts to see them here
                    </Typography>
                    <AnimatedButton
                      variant="contained"
                      component={Link}
                      href="/workouts/new"
                      size="small"
                    >
                      Log Your First Workout
                    </AnimatedButton>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {recentWorkout.title || 'Workout'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateLong(recentWorkout.date)}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${recentWorkout.exerciseCount} exercises`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box
                      sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}
                    >
                      <Chip
                        label={`${recentWorkout.totalSets} sets`}
                        size="small"
                      />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1.5}>
                      {recentWorkout.items?.slice(0, 3).map((it: any) => {
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
                                size={24}
                              />
                              <Typography variant="body2" fontWeight="medium">
                                {exerciseName}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 4 }}
                            >
                              {it.sets.length} set
                              {it.sets.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        );
                      })}
                      {(recentWorkout.items?.length ?? 0) > 3 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          +{(recentWorkout.items?.length ?? 0) - 3} more exercise
                          {(recentWorkout.items?.length ?? 0) - 3 !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Stack>
                    <AnimatedButton
                      component={Link}
                      href="/workouts"
                      size="small"
                      sx={{ mt: 2 }}
                      fullWidth
                      variant="outlined"
                    >
                      View All Workouts
                    </AnimatedButton>
                  </Box>
                )}
              </CardContent>
            </AnimatedCard>
          </Grid>

          {/* Workout Frequency Widget */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              minHeight: 0,
              // Add padding to account for scale animation
              p: '0.5%',
            }}
          >
            <AnimatedCard
              hoverScale={1.01}
              sx={{
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Workout Frequency</Typography>
                  <Tabs
                    value={frequencyView}
                    onChange={(_, newValue) => {
                      setFrequencyView(newValue);
                      resetToCurrent();
                    }}
                    sx={{ minHeight: 'auto' }}
                  >
                    <Tab
                      label="Week"
                      value="week"
                      sx={{
                        minHeight: 'auto',
                        py: 0.5,
                        px: 1,
                        fontSize: '0.875rem',
                      }}
                    />
                    <Tab
                      label="Month"
                      value="month"
                      sx={{
                        minHeight: 'auto',
                        py: 0.5,
                        px: 1,
                        fontSize: '0.875rem',
                      }}
                    />
                  </Tabs>
                </Box>

                {frequencyView === 'week' ? (
                  <>
                    {isLoadingWeekly ? (
                      <Box sx={{ py: 2 }}>
                        <Skeleton variant="rectangular" height={250} />
                      </Box>
                    ) : !weeklyData?.stats || weeklyData.stats.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No workout data available
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Workouts per week (past {weeklyData.stats.length}{' '}
                          weeks)
                        </Typography>
                        <Box sx={{ width: '100%', height: 250, mt: 1 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={weeklyData.stats}
                              margin={{
                                top: 8,
                                right: 8,
                                left: 0,
                                bottom: 48,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255, 255, 255, 0.1)"
                              />
                              <XAxis
                                dataKey="weekLabel"
                                stroke={
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.7)'
                                    : 'rgba(0, 0, 0, 0.6)'
                                }
                                fontSize={11}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                tickMargin={12}
                                tick={{ fill: theme.palette.text.secondary }}
                              />
                              <YAxis
                                allowDecimals={false}
                                stroke={
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.7)'
                                    : 'rgba(0, 0, 0, 0.6)'
                                }
                                width={24}
                                tick={{ fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor:
                                    theme.palette.background.paper,
                                  border:
                                    theme.palette.mode === 'dark'
                                      ? '1px solid rgba(255, 255, 255, 0.1)'
                                      : `1px solid ${theme.palette.divider}`,
                                  borderRadius: '8px',
                                  color: theme.palette.text.primary,
                                }}
                                formatter={(value: number) => [
                                  `${value} workout${value !== 1 ? 's' : ''}`,
                                  '',
                                ]}
                                labelFormatter={(label) => label}
                              />
                              <Bar
                                dataKey="count"
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    {isLoadingMonthly ? (
                      <Box sx={{ py: 2 }}>
                        <Skeleton variant="rectangular" height={300} />
                      </Box>
                    ) : !monthlyData?.calendar ||
                      monthlyData.calendar.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No workout data available
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleMonthChange('prev')}
                          >
                            <ChevronLeft />
                          </IconButton>
                          <Typography variant="body2" fontWeight="medium">
                            {getMonthLabel()}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleMonthChange('next')}
                            disabled={monthOffset >= 0}
                          >
                            <ChevronRight />
                          </IconButton>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          {/* Calendar header */}
                          <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
                            {[
                              'Mon',
                              'Tue',
                              'Wed',
                              'Thu',
                              'Fri',
                              'Sat',
                              'Sun',
                            ].map((day) => (
                              <Grid
                                item
                                xs
                                key={day}
                                sx={{ textAlign: 'center' }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  }}
                                >
                                  {day}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                          {/* Calendar grid: full rows only (4–6 rows), equal cell size */}
                          <Box>
                            {(() => {
                              const gridData = getCalendarGrid();
                              const rowCount = Math.ceil(gridData.length / 7);
                              return Array.from({
                                length: rowCount,
                              }).map((_, weekIndex) => {
                                const weekDays = gridData.slice(
                                  weekIndex * 7,
                                  (weekIndex + 1) * 7
                                );
                                return (
                                  <Box key={weekIndex}>
                                    <Grid container spacing={0}>
                                      {weekDays.map((day, dayIndex) => (
                                      <Grid
                                        item
                                        xs
                                        key={dayIndex}
                                        sx={{
                                          borderBottom:
                                            weekIndex < rowCount - 1
                                              ? `1px solid ${theme.palette.divider}`
                                              : 'none',
                                          borderRight:
                                            dayIndex < 6
                                              ? `1px solid ${theme.palette.divider}`
                                              : 'none',
                                          height: { xs: 52, sm: 58 },
                                          minHeight: 0,
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          justifyContent: 'flex-start',
                                          p: 1,
                                          boxSizing: 'border-box',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {day ? (
                                          <Box
                                            component={
                                              day.hasWorkout && day.workoutId
                                                ? Link
                                                : 'div'
                                            }
                                            href={
                                              day.hasWorkout && day.workoutId
                                                ? `/workouts/${day.workoutId}/edit`
                                                : undefined
                                            }
                                            sx={{
                                              width: '100%',
                                              minWidth: 0,
                                              height: '100%',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: 0.5,
                                              overflow: 'hidden',
                                              textDecoration: 'none',
                                              color: 'inherit',
                                              cursor:
                                                day.hasWorkout && day.workoutId
                                                  ? 'pointer'
                                                  : 'default',
                                              '&:hover': {
                                                backgroundColor:
                                                  day.hasWorkout && day.workoutId
                                                    ? 'action.hover'
                                                    : 'transparent',
                                              },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                bgcolor: day.hasWorkout
                                                  ? theme.palette.mode ===
                                                    'dark'
                                                    ? 'rgba(144, 202, 249, 0.4)'
                                                    : 'rgba(33, 150, 243, 0.25)'
                                                  : 'transparent',
                                                color: 'text.primary',
                                                fontWeight: 500,
                                                fontSize: {
                                                  xs: '0.75rem',
                                                  sm: '0.875rem',
                                                },
                                              }}
                                            >
                                              {day.day}
                                            </Box>
                                          </Box>
                                        ) : (
                                          <Box />
                                        )}
                                      </Grid>
                                        ))}
                                    </Grid>
                                  </Box>
                                );
                              });
                            })()}
                          </Box>
                        </Box>
                        {monthOffset !== 0 && (
                          <Button
                            size="small"
                            onClick={resetToCurrent}
                            variant="outlined"
                            sx={{
                              mt: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                            }}
                          >
                            Back to Current Month
                          </Button>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>

        {/* Muscle Group Distribution Widget */}
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{ mt: { xs: 2, sm: 1 } }}
        >
          <Grid
            item
            xs={12}
            sx={{
              minHeight: 0,
              // Add padding to account for scale animation
              p: '0.5%',
            }}
          >
            <AnimatedCard
              hoverScale={1.01}
              sx={{
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    Muscle Group Distribution
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={muscleGroupRange}
                      onChange={(e) =>
                        setMuscleGroupRange(Number(e.target.value))
                      }
                      sx={{
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <MenuItem value={7}>Last 7 days</MenuItem>
                      <MenuItem value={14}>Last 14 days</MenuItem>
                      <MenuItem value={30}>Last 30 days</MenuItem>
                      <MenuItem value={60}>Last 60 days</MenuItem>
                      <MenuItem value={90}>Last 90 days</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {isLoadingMuscleGroups ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="rectangular" height={400} />
                  </Box>
                ) : !muscleGroupData?.current ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No workout data available
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ width: '100%', height: 400, mt: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          data={[
                            {
                              muscle: 'Back',
                              Current: muscleGroupData.current.Back,
                              Previous: muscleGroupData.previous.Back,
                            },
                            {
                              muscle: 'Chest',
                              Current: muscleGroupData.current.Chest,
                              Previous: muscleGroupData.previous.Chest,
                            },
                            {
                              muscle: 'Core',
                              Current: muscleGroupData.current.Core,
                              Previous: muscleGroupData.previous.Core,
                            },
                            {
                              muscle: 'Shoulders',
                              Current: muscleGroupData.current.Shoulders,
                              Previous: muscleGroupData.previous.Shoulders,
                            },
                            {
                              muscle: 'Arms',
                              Current: muscleGroupData.current.Arms,
                              Previous: muscleGroupData.previous.Arms,
                            },
                            {
                              muscle: 'Legs',
                              Current: muscleGroupData.current.Legs,
                              Previous: muscleGroupData.previous.Legs,
                            },
                          ]}
                        >
                          <PolarGrid
                            stroke={
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.1)'
                            }
                          />
                          <PolarAngleAxis
                            dataKey="muscle"
                            tick={{
                              fill:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.7)'
                                  : 'rgba(0, 0, 0, 0.7)',
                              fontSize: 12,
                            }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{
                              fill:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.5)'
                                  : 'rgba(0, 0, 0, 0.5)',
                              fontSize: 10,
                            }}
                          />
                          <Radar
                            name="Current"
                            dataKey="Current"
                            stroke={theme.palette.primary.main}
                            fill={theme.palette.primary.main}
                            fillOpacity={0.6}
                          />
                          <Radar
                            name="Previous"
                            dataKey="Previous"
                            stroke={
                              theme.palette.mode === 'dark'
                                ? '#b3b3b3'
                                : 'rgba(0, 0, 0, 0.3)'
                            }
                            fill={
                              theme.palette.mode === 'dark'
                                ? '#b3b3b3'
                                : 'rgba(0, 0, 0, 0.3)'
                            }
                            fillOpacity={0.3}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border:
                                theme.palette.mode === 'dark'
                                  ? '1px solid rgba(255, 255, 255, 0.1)'
                                  : `1px solid ${theme.palette.divider}`,
                              borderRadius: '8px',
                              color: theme.palette.text.primary,
                            }}
                            formatter={(value: number) => [
                              `${value.toFixed(1)}%`,
                              '',
                            ]}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
