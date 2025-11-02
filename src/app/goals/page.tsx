'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Paper,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
} from '@mui/material';
import { useState } from 'react';
import { Add, Edit, Delete, LocalFireDepartment } from '@mui/icons-material';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/goals';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { formatNumber } from '@/lib/format';
import { formatDateISO } from '@/lib/format';

const goalTypeOptions = [
  { value: 'STEPS', label: 'Steps' },
  { value: 'CALORIES', label: 'Calories' },
  { value: 'WORKOUTS', label: 'Workouts' },
  { value: 'DISTANCE', label: 'Distance' },
];

const periodOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const goalSchema = yup.object({
  type: yup.string().oneOf(['STEPS', 'CALORIES', 'WORKOUTS', 'DISTANCE']).required('Type is required'),
  period: yup.string().oneOf(['DAILY', 'WEEKLY', 'MONTHLY']).required('Period is required'),
  targetInt: yup
    .number()
    .transform((value, originalValue) => {
      return originalValue === '' ? undefined : value;
    })
    .min(0)
    .when('type', {
      is: (value: string) => ['STEPS', 'WORKOUTS'].includes(value),
      then: (schema) => schema.required('Target is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  targetDec: yup
    .number()
    .transform((value, originalValue) => {
      return originalValue === '' ? undefined : value;
    })
    .min(0)
    .when('type', {
      is: (value: string) => ['DISTANCE', 'CALORIES'].includes(value),
      then: (schema) => schema.required('Target is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  startDate: yup.string(),
  isActive: yup.boolean(),
});

export default function GoalsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const { data: goals = [], isLoading, error, refetch } = useGoals();

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const handleAdd = () => {
    setEditingGoal(null);
    setIsAddDialogOpen(true);
    // Reset form to initial values
    setTimeout(() => {
      formik.resetForm({
        values: {
          type: '',
          period: '',
          targetInt: '',
          targetDec: '',
          startDate: formatDateISO(new Date()),
          isActive: true,
        },
      });
    }, 0);
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (goal: any) => {
    updateMutation.mutate({
      id: goal.id,
      input: { isActive: !goal.isActive },
    });
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingGoal(null);
    // Reset form when closing
    setTimeout(() => {
      formik.resetForm({
        values: {
          type: '',
          period: '',
          targetInt: '',
          targetDec: '',
          startDate: formatDateISO(new Date()),
          isActive: true,
        },
      });
    }, 0);
  };

  const formik = useFormik({
    initialValues: {
      type: editingGoal?.type || '',
      period: editingGoal?.period || '',
      targetInt: editingGoal?.targetInt || '',
      targetDec: editingGoal?.targetDec || '',
      startDate: editingGoal?.startDate || formatDateISO(new Date()),
      isActive: editingGoal?.isActive ?? true,
    },
    validationSchema: goalSchema,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload: any = {
          type: values.type,
          period: values.period,
          startDate: values.startDate,
          isActive: values.isActive,
        };

        if (['STEPS', 'WORKOUTS'].includes(values.type)) {
          const num = typeof values.targetInt === 'string' ? parseFloat(values.targetInt) : values.targetInt;
          payload.targetInt = isNaN(num) ? undefined : num;
        } else {
          const num = typeof values.targetDec === 'string' ? parseFloat(values.targetDec) : values.targetDec;
          payload.targetDec = isNaN(num) ? undefined : num;
        }

        if (editingGoal) {
          await updateMutation.mutateAsync({ id: editingGoal.id, input: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }

        handleCloseDialog();
      } catch (error: any) {
        console.error('Error saving goal:', error);
        // Error handling is done via snackbar in the mutations
      } finally {
        setSubmitting(false);
      }
    },
  });

  const getGoalTitle = (goal: any) => {
    const typeLabel = goalTypeOptions.find(o => o.value === goal.type)?.label || goal.type;
    const periodLabel = periodOptions.find(o => o.value === goal.period)?.label || goal.period;
    return `${typeLabel} — ${periodLabel}`;
  };

  const formatTarget = (goal: any) => {
    if (['STEPS', 'WORKOUTS'].includes(goal.type)) {
      return formatNumber(goal.targetInt || 0);
    } else {
      return `${(goal.targetDec || 0).toFixed(1)}${goal.type === 'DISTANCE' ? ' km' : ''}`;
    }
  };

  const formatCurrentValue = (goal: any) => {
    if (!goal.progress) return '0';
    if (['STEPS', 'WORKOUTS'].includes(goal.type)) {
      return formatNumber(goal.progress.currentValue);
    } else {
      return goal.progress.currentValue.toFixed(1);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Goals
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Create Goal
          </Button>
        </Box>

        {/* Goals List */}
        {isLoading ? (
          <Box>
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          </Box>
        ) : error ? (
          <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
            Failed to load goals
          </Alert>
        ) : goals.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No goals yet. Create your first goal to start tracking!
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleAdd} sx={{ mt: 2 }}>
              Create Goal
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {goals.map((goal) => (
              <Card key={goal.id} sx={{ opacity: goal.isActive ? 1 : 0.6 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">{getGoalTitle(goal)}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {goal.progress && goal.progress.streakCount > 0 && (
                        <Chip
                          icon={<LocalFireDepartment />}
                          label={`${goal.progress.streakCount} ${goal.period?.toLowerCase()} streak`}
                          color="warning"
                          size="small"
                        />
                      )}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={goal.isActive}
                            onChange={() => handleToggleActive(goal)}
                            size="small"
                          />
                        }
                        label="Active"
                        labelPlacement="start"
                      />
                    </Box>
                  </Box>

                  {goal.progress && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrentValue(goal)} / {formatTarget(goal)} {goal.type === 'DISTANCE' ? '' : goal.type?.toLowerCase()}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {goal.progress.pct.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={goal.progress.pct}
                          color={goal.progress.isMetThisPeriod ? 'success' : 'primary'}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>

                      {goal.progress.isMetThisPeriod && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Goal met this {goal.period?.toLowerCase()}! 🎉
                        </Alert>
                      )}
                    </>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(goal)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(goal.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                margin="normal"
                select
                label="Type"
                value={formik.values.type}
                onChange={(e) => {
                  formik.setFieldValue('type', e.target.value);
                  // Clear target fields when type changes
                  formik.setFieldValue('targetInt', '');
                  formik.setFieldValue('targetDec', '');
                }}
                error={formik.touched.type && Boolean(formik.errors.type)}
                helperText={(formik.touched.type && formik.errors.type) as string}
              >
                {goalTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                margin="normal"
                select
                label="Period"
                {...formik.getFieldProps('period')}
                error={formik.touched.period && Boolean(formik.errors.period)}
                helperText={(formik.touched.period && formik.errors.period) as string}
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {['STEPS', 'WORKOUTS'].includes(formik.values.type) && (
                <TextField
                  fullWidth
                  margin="normal"
                  label={`Target ${formik.values.type === 'STEPS' ? 'Steps' : 'Workouts'}`}
                  type="number"
                  {...formik.getFieldProps('targetInt')}
                  error={formik.touched.targetInt && Boolean(formik.errors.targetInt)}
                  helperText={(formik.touched.targetInt && formik.errors.targetInt) as string}
                />
              )}

              {['DISTANCE', 'CALORIES'].includes(formik.values.type) && (
                <TextField
                  fullWidth
                  margin="normal"
                  label={`Target ${formik.values.type === 'DISTANCE' ? 'Distance (km)' : 'Calories'}`}
                  type="number"
                  step="0.1"
                  {...formik.getFieldProps('targetDec')}
                  error={formik.touched.targetDec && Boolean(formik.errors.targetDec)}
                  helperText={(formik.touched.targetDec && formik.errors.targetDec) as string}
                />
              )}

              <TextField
                fullWidth
                margin="normal"
                label="Start Date"
                type="date"
                {...formik.getFieldProps('startDate')}
                error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                helperText={(formik.touched.startDate && formik.errors.startDate) as string}
                InputLabelProps={{ shrink: true }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    {...formik.getFieldProps('isActive')}
                    type="checkbox"
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={formik.isSubmitting}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
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
