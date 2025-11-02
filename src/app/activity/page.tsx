'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material';
import { useState } from 'react';
import { ArrowBack, ArrowForward, CalendarToday, Add } from '@mui/icons-material';
import { DateRange } from '@/types/activity';
import { useActivity, useCreateActivity, useUpdateActivity, useDeleteActivity } from '@/hooks/activity';
import { getRangeBounds, getPreviousPeriod, getNextPeriod, isToday } from '@/lib/date';
import { formatDateShort, formatNumber, formatDistance, formatHeartRate, formatDateISO } from '@/lib/format';
import { useFormik } from 'formik';
import * as yup from 'yup'; // Will switch to zod in a moment
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

const activitySchema = yup.object({
  date: yup.string().required('Date is required'),
  steps: yup.number().min(0).required('Steps is required'),
  distanceKm: yup.number().min(0).required('Distance is required'),
  calories: yup.number().min(0).required('Calories is required'),
  heartRateAvg: yup.number().min(30).max(220).optional(),
  workouts: yup.number().min(0).max(5).required('Workouts is required'),
});

export default function ActivityPage() {
  const [tab, setTab] = useState<number>(0);
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const ranges: DateRange[] = ['day', 'week', 'month'];
  const currentRange = ranges[tab];

  const { data: entries = [], isLoading, error, refetch } = useActivity(currentRange, anchorDate);

  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();

  // Handle navigation
  const handlePrevious = () => {
    setAnchorDate(getPreviousPeriod(currentRange, anchorDate));
  };

  const handleNext = () => {
    setAnchorDate(getNextPeriod(currentRange, anchorDate));
  };

  const handleToday = () => {
    setAnchorDate(new Date());
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Handle CRUD operations
  const handleAdd = () => {
    setEditingEntry(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingEntry(null);
    formik.resetForm();
  };

  const formik = useFormik({
    initialValues: {
      date: editingEntry?.date || formatDateISO(new Date()),
      steps: editingEntry?.steps || 0,
      distanceKm: editingEntry?.distanceKm || 0,
      calories: editingEntry?.calories || 0,
      heartRateAvg: editingEntry?.heartRateAvg || '',
      workouts: editingEntry?.workouts || 0,
    },
    validationSchema: activitySchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const payload = {
          date: values.date,
          steps: values.steps,
          distanceKm: values.distanceKm,
          calories: values.calories,
          heartRateAvg: values.heartRateAvg === '' ? undefined : values.heartRateAvg,
          workouts: values.workouts,
        };

        if (editingEntry) {
          updateMutation.mutate({ id: editingEntry.id, input: payload });
        } else {
          createMutation.mutate(payload);
        }

        handleCloseDialog();
      } catch (error) {
        console.error('Error saving activity:', error);
      }
    },
  });

  // Prepare chart data
  const chartData = entries.map((entry) => ({
    date: formatDateShort(entry.date),
    steps: entry.steps,
    distance: entry.distanceKm,
    calories: entry.calories,
    heartRate: entry.heartRateAvg,
  }));

  const { start, end } = getRangeBounds(currentRange, anchorDate);

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Activity
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Add Activity
          </Button>
        </Box>

        {/* Date Navigation */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton onClick={handlePrevious}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1">{formatDateShort(start)} - {formatDateShort(end)}</Typography>
              <Button
                size="small"
                startIcon={<CalendarToday />}
                onClick={handleToday}
                disabled={isToday(anchorDate)}
              >
                {currentRange === 'day' ? 'Today' : currentRange === 'week' ? 'This Week' : 'This Month'}
              </Button>
            </Box>
            <IconButton onClick={handleNext} disabled={isToday(anchorDate) && currentRange === 'day'}>
              <ArrowForward />
            </IconButton>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Day" />
            <Tab label="Week" />
            <Tab label="Month" />
          </Tabs>
        </Paper>

        {/* Chart */}
        <Paper sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activity Overview
          </Typography>
          {isLoading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : error ? (
            <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
              Failed to load activity data
            </Alert>
          ) : chartData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No activity yet for this period
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                Add Activity
              </Button>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="distance" fill="#8884d8" fillOpacity={0.6} name="Distance (km)" />
                <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#82ca9d" name="Steps" />
                <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#ff7300" name="Calories" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activity Entries
          </Typography>
          {isLoading ? (
            <Box>
              <Skeleton variant="rectangular" height={100} />
            </Box>
          ) : entries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No entries found
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Steps</TableCell>
                    <TableCell align="right">Distance</TableCell>
                    <TableCell align="right">Calories</TableCell>
                    <TableCell align="right">Heart Rate</TableCell>
                    <TableCell align="right">Workouts</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDateShort(entry.date)}</TableCell>
                      <TableCell align="right">{formatNumber(entry.steps)}</TableCell>
                      <TableCell align="right">{formatDistance(entry.distanceKm)}</TableCell>
                      <TableCell align="right">{formatNumber(entry.calories)}</TableCell>
                      <TableCell align="right">
                        {entry.heartRateAvg ? formatHeartRate(entry.heartRateAvg) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={entry.workouts} size="small" color={entry.workouts > 0 ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleEdit(entry)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" onClick={() => handleDelete(entry.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingEntry ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                margin="normal"
                label="Date"
                type="date"
                {...formik.getFieldProps('date')}
                error={formik.touched.date && Boolean(formik.errors.date)}
                helperText={(formik.touched.date && formik.errors.date) as string}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Steps"
                type="number"
                {...formik.getFieldProps('steps')}
                error={formik.touched.steps && Boolean(formik.errors.steps)}
                helperText={(formik.touched.steps && formik.errors.steps) as string}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Distance (km)"
                type="number"
                {...formik.getFieldProps('distanceKm')}
                error={formik.touched.distanceKm && Boolean(formik.errors.distanceKm)}
                helperText={(formik.touched.distanceKm && formik.errors.distanceKm) as string}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Calories"
                type="number"
                {...formik.getFieldProps('calories')}
                error={formik.touched.calories && Boolean(formik.errors.calories)}
                helperText={(formik.touched.calories && formik.errors.calories) as string}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Heart Rate (avg)"
                type="number"
                {...formik.getFieldProps('heartRateAvg')}
                error={formik.touched.heartRateAvg && Boolean(formik.errors.heartRateAvg)}
                helperText={(formik.touched.heartRateAvg && formik.errors.heartRateAvg) as string}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Workouts"
                type="number"
                {...formik.getFieldProps('workouts')}
                error={formik.touched.workouts && Boolean(formik.errors.workouts)}
                helperText={(formik.touched.workouts && formik.errors.workouts) as string}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingEntry ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbars */}
        <Snackbar
          open={createMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={createMutation.closeSnackbar}
        >
          <MuiAlert
            onClose={createMutation.closeSnackbar}
            severity={createMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {createMutation.snackbar.message}
          </MuiAlert>
        </Snackbar>

        <Snackbar
          open={updateMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={updateMutation.closeSnackbar}
        >
          <MuiAlert
            onClose={updateMutation.closeSnackbar}
            severity={updateMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {updateMutation.snackbar.message}
          </MuiAlert>
        </Snackbar>

        <Snackbar
          open={deleteMutation.snackbar.open}
          autoHideDuration={6000}
          onClose={deleteMutation.closeSnackbar}
        >
          <MuiAlert
            onClose={deleteMutation.closeSnackbar}
            severity={deleteMutation.snackbar.severity}
            sx={{ width: '100%' }}
          >
            {deleteMutation.snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
