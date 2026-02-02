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
} from '@mui/material';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useEffect, useRef, useState } from 'react';
import { FitnessCenter, ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  useRecentWorkout,
  useDailyWorkoutStats,
  useMonthlyWorkoutStats,
  useMuscleGroupStats,
} from '@/hooks/workouts';
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
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';

export default function DashboardPage() {
  const theme = useTheme();
  const { data: recentWorkout, isLoading: isLoadingRecent } =
    useRecentWorkout();
  const [frequencyView, setFrequencyView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [muscleGroupRange, setMuscleGroupRange] = useState(30);
  const { data: dailyData, isLoading: isLoadingDaily } =
    useDailyWorkoutStats(weekOffset);
  const { data: monthlyData, isLoading: isLoadingMonthly } =
    useMonthlyWorkoutStats(monthOffset);
  const { data: muscleGroupData, isLoading: isLoadingMuscleGroups } =
    useMuscleGroupStats(muscleGroupRange);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setWeekOffset((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setMonthOffset((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const resetToCurrent = () => {
    setWeekOffset(0);
    setMonthOffset(0);
  };

  // Get week label
  const getWeekLabel = () => {
    if (!dailyData) return 'This Week';
    const weekStart = new Date(dailyData.weekStart);
    const weekEnd = new Date(dailyData.weekEnd);
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  };

  // Get month label
  const getMonthLabel = () => {
    if (!monthlyData) return 'This Month';
    if (monthOffset === 0) return 'This Month';
    if (monthOffset === -1) return 'Last Month';
    return monthlyData.month;
  };

  // Prepare calendar grid for month view
  const getCalendarGrid = () => {
    if (!monthlyData) return [];
    const calendar = monthlyData.calendar;
    const firstDay = new Date(calendar[0].date);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0

    // Add empty cells for days before month starts
    const grid: Array<{
      day: number;
      date: string;
      hasWorkout: boolean;
      isCurrentMonth: boolean;
      workoutTitle?: string;
    } | null> = [];
    for (let i = 0; i < adjustedStart; i++) {
      grid.push(null);
    }

    // Add all days of the month
    calendar.forEach((day) => {
      grid.push(day);
    });

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
                      {recentWorkout.items?.length > 3 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          +{recentWorkout.items.length - 3} more exercise
                          {recentWorkout.items.length - 3 !== 1 ? 's' : ''}
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
                    {isLoadingDaily ? (
                      <Box sx={{ py: 2 }}>
                        <Skeleton variant="rectangular" height={250} />
                      </Box>
                    ) : !dailyData?.stats || dailyData.stats.length === 0 ? (
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
                            mb: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleWeekChange('prev')}
                          >
                            <ChevronLeft />
                          </IconButton>
                          <Typography variant="body2" fontWeight="medium">
                            {getWeekLabel()}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleWeekChange('next')}
                            disabled={weekOffset >= 0}
                          >
                            <ChevronRight />
                          </IconButton>
                        </Box>
                        <Box sx={{ width: '100%', height: 250, mt: 1 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData.stats}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255, 255, 255, 0.1)"
                              />
                              <XAxis
                                dataKey="day"
                                stroke={
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.7)'
                                    : 'rgba(0, 0, 0, 0.6)'
                                }
                                fontSize={12}
                              />
                              <YAxis
                                allowDecimals={false}
                                stroke={
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.7)'
                                    : 'rgba(0, 0, 0, 0.6)'
                                }
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
                              />
                              <Bar
                                dataKey="count"
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                        {weekOffset !== 0 && (
                          <Button
                            size="small"
                            onClick={resetToCurrent}
                            variant="outlined"
                            sx={{
                              mt: 1,
                              textTransform: 'none',
                              fontWeight: 500,
                            }}
                          >
                            Back to Current Week
                          </Button>
                        )}
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
                          {/* Calendar grid */}
                          <Box>
                            {Array.from({
                              length: Math.ceil(getCalendarGrid().length / 7),
                            }).map((_, weekIndex) => {
                              const weekDays = getCalendarGrid().slice(
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
                                            weekIndex <
                                            Math.ceil(
                                              getCalendarGrid().length / 7
                                            ) -
                                              1
                                              ? `1px solid ${theme.palette.divider}`
                                              : 'none',
                                          borderRight:
                                            dayIndex < 6
                                              ? `1px solid ${theme.palette.divider}`
                                              : 'none',
                                          minHeight: { xs: 60, sm: 70 },
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          justifyContent: 'flex-start',
                                          p: 1,
                                        }}
                                      >
                                        {day ? (
                                          <Box
                                            sx={{
                                              width: '100%',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: 0.5,
                                            }}
                                          >
                                            <Box
                                              sx={{
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
                                            {day.hasWorkout && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: 'text.secondary',
                                                  fontSize: {
                                                    xs: '0.65rem',
                                                    sm: '0.7rem',
                                                  },
                                                  lineHeight: 1.2,
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 2,
                                                  WebkitBoxOrient: 'vertical',
                                                }}
                                              >
                                                {day.workoutTitle || 'Workout'}
                                              </Typography>
                                            )}
                                          </Box>
                                        ) : (
                                          <Box />
                                        )}
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              );
                            })}
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
