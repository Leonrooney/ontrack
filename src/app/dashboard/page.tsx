'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Chip,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import {
  DirectionsWalk,
  FitnessCenter,
  LocalFireDepartment,
  Straighten,
  Favorite,
  EmojiEvents,
} from '@mui/icons-material';
import { useDashboard } from '@/hooks/dashboard';
import { useRecentWorkout, useWorkoutFrequency } from '@/hooks/workouts';
import { formatNumber, formatDistance, formatHeartRate, formatDateLong } from '@/lib/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts';
import { useState } from 'react';
import Link from 'next/link';
import { ExerciseThumb } from '@/components/ExerciseThumb';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: recentWorkout, isLoading: isLoadingRecent } = useRecentWorkout();
  const { data: frequencyData, isLoading: isLoadingFrequency } = useWorkoutFrequency(90);
  const [chartLines, setChartLines] = useState({
    steps: true,
    calories: true,
    distance: true,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={400} sx={{ mt: 3 }} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Alert
            severity="error"
            action={<Button onClick={() => refetch()}>Retry</Button>}
            sx={{ mt: 3 }}
          >
            Failed to load dashboard data
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Paper sx={{ p: 6, mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No data available yet. Start tracking your activities to see your dashboard!
            </Typography>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  const { summary, trends, recommendations } = data;

  // Prepare chart data
  const chartData = trends.labels.map((label, index) => ({
    date: label,
    steps: chartLines.steps ? trends.steps[index] : null,
    calories: chartLines.calories ? trends.calories[index] : null,
    distance: chartLines.distance ? trends.distanceKm[index] : null,
  }));

  // Calculate averages for comparison
  const avgSteps =
    trends.steps.length > 0
      ? trends.steps.reduce((a, b) => a + b, 0) / trends.steps.length
      : 0;
  const lastWeekSteps = trends.steps.slice(-7).reduce((a, b) => a + b, 0);
  const stepsDelta = lastWeekSteps / 7 - avgSteps;

  const avgCalories =
    trends.calories.length > 0
      ? trends.calories.reduce((a, b) => a + b, 0) / trends.calories.length
      : 0;
  const lastWeekCalories = trends.calories.slice(-7).reduce((a, b) => a + b, 0);
  const caloriesDelta = lastWeekCalories / 7 - avgCalories;

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        {/* Recent Workout & Workout Frequency Widgets */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Recent Workout Widget */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
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
                    <FitnessCenter sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No workouts yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start tracking your workouts to see them here
                    </Typography>
                    <Button variant="contained" component={Link} href="/workouts/new" size="small">
                      Log Your First Workout
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${recentWorkout.totalSets} sets`} size="small" />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1.5}>
                      {recentWorkout.items?.slice(0, 3).map((it: any) => {
                        const exerciseName = it.exercise?.name ?? it.custom?.name ?? 'Exercise';
                        const exerciseMediaUrl = it.exercise?.mediaUrl ?? it.custom?.mediaUrl ?? undefined;
                        return (
                          <Box key={it.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <ExerciseThumb name={exerciseName} mediaUrl={exerciseMediaUrl} size={24} />
                              <Typography variant="body2" fontWeight="medium">
                                {exerciseName}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                              {it.sets.length} set{it.sets.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        );
                      })}
                      {recentWorkout.items?.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          +{recentWorkout.items.length - 3} more exercise{recentWorkout.items.length - 3 !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Stack>
                    <Button
                      component={Link}
                      href="/workouts"
                      size="small"
                      sx={{ mt: 2 }}
                      fullWidth
                      variant="outlined"
                    >
                      View All Workouts
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Workout Frequency Widget */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workout Frequency
                </Typography>
                {isLoadingFrequency ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="rectangular" height={250} />
                  </Box>
                ) : !frequencyData?.stats || frequencyData.stats.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No workout data available
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ width: '100%', height: 250, mt: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={frequencyData.stats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval="preserveStartEnd"
                            fontSize={12}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Workouts per week (last {Math.ceil(90 / 7)} weeks)
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Steps
                    </Typography>
                    <Typography variant="h5">{formatNumber(summary.totalSteps)}</Typography>
                    {stepsDelta !== 0 && (
                      <Typography
                        variant="body2"
                        color={stepsDelta > 0 ? 'success.main' : 'error.main'}
                        sx={{ mt: 0.5 }}
                      >
                        {stepsDelta > 0 ? '+' : ''}
                        {formatNumber(Math.round(stepsDelta))} avg vs period
                      </Typography>
                    )}
                  </Box>
                  <DirectionsWalk sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Distance
                    </Typography>
                    <Typography variant="h5">{formatDistance(summary.totalDistanceKm)}</Typography>
                  </Box>
                  <Straighten sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Calories
                    </Typography>
                    <Typography variant="h5">{formatNumber(summary.totalCalories)}</Typography>
                    {caloriesDelta !== 0 && (
                      <Typography
                        variant="body2"
                        color={caloriesDelta > 0 ? 'success.main' : 'error.main'}
                        sx={{ mt: 0.5 }}
                      >
                        {caloriesDelta > 0 ? '+' : ''}
                        {formatNumber(Math.round(caloriesDelta))} avg vs period
                      </Typography>
                    )}
                  </Box>
                  <LocalFireDepartment sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Workouts
                    </Typography>
                    <Typography variant="h5">{formatNumber(summary.totalWorkouts)}</Typography>
                  </Box>
                  <FitnessCenter sx={{ fontSize: 40, color: 'secondary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Avg Heart Rate
                    </Typography>
                    <Typography variant="h5">
                      {summary.avgHeartRate ? formatHeartRate(summary.avgHeartRate) : 'N/A'}
                    </Typography>
                  </Box>
                  <Favorite sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Goal Completion
                    </Typography>
                    <Typography variant="h5">{summary.goalCompletionRate.toFixed(1)}%</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {summary.activeGoalsCount} active goals
                    </Typography>
                  </Box>
                  <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Trend Chart */}
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mt: 3, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">14-Day Trends</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Steps"
                onClick={() => setChartLines({ ...chartLines, steps: !chartLines.steps })}
                color={chartLines.steps ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label="Calories"
                onClick={() => setChartLines({ ...chartLines, calories: !chartLines.calories })}
                color={chartLines.calories ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label="Distance"
                onClick={() => setChartLines({ ...chartLines, distance: !chartLines.distance })}
                color={chartLines.distance ? 'primary' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          {chartData.length > 0 ? (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <ResponsiveContainer width="100%" height={400} minHeight={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" width={60} />
                  <YAxis yAxisId="right" orientation="right" width={60} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {chartLines.steps && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="steps"
                      stroke="#82ca9d"
                      name="Steps"
                    />
                  )}
                  {chartLines.calories && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="calories"
                      stroke="#ff7300"
                      name="Calories"
                    />
                  )}
                  {chartLines.distance && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="distance"
                      stroke="#8884d8"
                      name="Distance (km)"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">No trend data available</Typography>
            </Box>
          )}
        </Paper>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {recommendations.map((rec, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1">{rec}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}
