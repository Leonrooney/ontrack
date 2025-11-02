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
import { formatNumber, formatDistance, formatHeartRate } from '@/lib/format';
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
} from 'recharts';
import { useState } from 'react';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();
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
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

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
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">14-Day Trends</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
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
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">No trend data available</Typography>
            </Box>
          )}
        </Paper>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }}>
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
