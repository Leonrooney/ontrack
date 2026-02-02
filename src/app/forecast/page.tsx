'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useForecast, ForecastMetric, ForecastMethod } from '@/hooks/forecast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

export default function ForecastPage() {
  const [metric, setMetric] = useState<ForecastMetric>('steps');
  const [method, setMethod] = useState<ForecastMethod>('ma');
  const [horizon, setHorizon] = useState(14);

  const { data, isLoading, error } = useForecast(metric, method, horizon);

  const chartData = !data
    ? []
    : [
        ...data.history.map((p: any) => ({
          date: p.date,
          actual: p.actual,
          predicted: p.predicted,
          lower: p.lower,
          upper: p.upper,
        })),
        ...data.future.map((p: any) => ({
          date: p.date,
          predicted: p.predicted,
          lower: p.lower,
          upper: p.upper,
        })),
      ];

  // Find the split point between history and future for the reference line
  const historyLength = data?.history.length ?? 0;
  const isFutureIndex = (index: number) => index >= historyLength;

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Forecast
        </Typography>

        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="metric">Metric</InputLabel>
              <Select
                labelId="metric"
                label="Metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as ForecastMetric)}
              >
                <MenuItem value="steps">Steps</MenuItem>
                <MenuItem value="calories">Calories</MenuItem>
                <MenuItem value="distance">Distance (km)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="method">Method</InputLabel>
              <Select
                labelId="method"
                label="Method"
                value={method}
                onChange={(e) => setMethod(e.target.value as ForecastMethod)}
              >
                <MenuItem value="ma">Moving Average</MenuItem>
                <MenuItem value="es">Exponential Smoothing</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="horizon">Horizon</InputLabel>
              <Select
                labelId="horizon"
                label="Horizon"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              >
                <MenuItem value={14}>Next 14 days</MenuItem>
                <MenuItem value={30}>Next 30 days</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, sm: 2 }, overflow: 'hidden' }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={400} />
          ) : error ? (
            <Alert severity="error">Failed to load forecast</Alert>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <ResponsiveContainer width="100%" height={400} minHeight={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis width={60} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    name="Upper band"
                    opacity={0.15}
                    fill="url(#colorUpper)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    name="Lower band"
                    opacity={0.15}
                    fill="url(#colorLower)"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted"
                    stroke="#8884d8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  {data && historyLength > 0 && (
                    <ReferenceLine
                      x={chartData[historyLength - 1]?.date}
                      stroke="red"
                      strokeDasharray="3 3"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

        {data && !isLoading && !error && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing{' '}
              {data.method === 'ma'
                ? 'Moving Average'
                : 'Exponential Smoothing'}{' '}
              forecast for {data.metric} over the next {data.horizon} days
            </Typography>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
