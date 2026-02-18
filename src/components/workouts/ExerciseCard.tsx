'use client';

import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Stack,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { formatElapsedTime } from '@/lib/format';

export type SetRow = {
  setNumber: number;
  weightKg?: number;
  reps: number;
  rpe?: number;
  notes?: string;
  isPersonalBest?: boolean;
  pbDescription?: string;
  completed?: boolean;
  previousWeight?: number;
  previousReps?: number;
};

interface ExerciseCardProps {
  exercise: {
    exerciseId?: string;
    customId?: string;
    name: string;
    bodyPart?: string;
    equipment?: string;
  };
  sets: SetRow[];
  lastPerformance?: string;
  defaultRestSeconds?: number; // User preference for rest duration, falls back to 90 if not provided
  onRemoveExercise: () => void;
  onChangeSet: (setIndex: number, field: keyof SetRow, value: any) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
  onToggleSetComplete?: (setIndex: number) => void;
}

// Fallback default rest duration in seconds (used if user preferences fail to load)
const DEFAULT_REST_SECONDS = 90;

/**
 * ExerciseCard - Strong/Hevy-style exercise card with set table
 *
 * Features:
 * - Per-exercise rest timer with countdown and progress bar
 * - Independent timer state for each card instance
 */
export function ExerciseCard({
  exercise,
  sets,
  lastPerformance,
  defaultRestSeconds,
  onRemoveExercise,
  onChangeSet,
  onRemoveSet,
  onAddSet,
  onToggleSetComplete,
}: ExerciseCardProps) {
  // Local state for rep inputs to allow clearing
  const [repInputs, setRepInputs] = useState<Record<number, string>>({});

  // Track which sets were just completed to trigger animation
  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set());
  const checkmarkRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  // Use user preference if provided, otherwise fall back to default
  const restDuration = defaultRestSeconds ?? DEFAULT_REST_SECONDS;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleRemoveClick = () => {
    handleMenuClose();
    setRemoveConfirmOpen(true);
  };

  const handleRemoveConfirm = () => {
    setRemoveConfirmOpen(false);
    onRemoveExercise();
  };

  // Per-set rest timers: smooth progress via startedAt; support paused to show actual rest time
  type RestTimerState = {
    total: number;
    startedAt: number;
    paused?: boolean;
    elapsedWhenPaused?: number;
  };
  const [setRestTimers, setSetRestTimers] = useState<
    Record<number, RestTimerState>
  >({});
  const [smoothTick, setSmoothTick] = useState(0);
  const intervalRefs = useRef<Record<number, ReturnType<typeof setInterval> | null>>({});
  const smoothIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSetsLengthRef = useRef(sets.length);

  // When a set is removed, clear all rest timers for this exercise so we don't keep a rest
  // that belonged to the deleted set (or show it on the wrong set after re-indexing).
  useEffect(() => {
    const prevLen = prevSetsLengthRef.current;
    if (sets.length < prevLen) {
      Object.keys(intervalRefs.current).forEach((key) => {
        const id = intervalRefs.current[Number(key)];
        if (id) {
          clearInterval(id);
        }
      });
      intervalRefs.current = {};
      setSetRestTimers({});
    }
    prevSetsLengthRef.current = sets.length;
  }, [sets.length]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach((id) => {
        if (id) clearInterval(id);
      });
      if (smoothIntervalRef.current) clearInterval(smoothIntervalRef.current);
    };
  }, []);

  // Smooth progress: re-render every 100ms when any timer is running (so bar fills smoothly)
  useEffect(() => {
    const hasActive = Object.entries(setRestTimers).some(
      ([_, t]) => t && !t.paused
    );
    if (!hasActive) {
      if (smoothIntervalRef.current) {
        clearInterval(smoothIntervalRef.current);
        smoothIntervalRef.current = null;
      }
      return;
    }
    smoothIntervalRef.current = setInterval(() => {
      setSmoothTick((t) => t + 1);
    }, 100);
    return () => {
      if (smoothIntervalRef.current) {
        clearInterval(smoothIntervalRef.current);
        smoothIntervalRef.current = null;
      }
    };
  }, [setRestTimers]);

  // Start rest timer for a specific set; pause any other running timers so user sees actual rest time
  const startSetRest = (setIndex: number) => {
    const duration = restDuration;
    const now = Date.now();

    // Clear existing interval for this set
    if (intervalRefs.current[setIndex]) {
      clearInterval(intervalRefs.current[setIndex]!);
      intervalRefs.current[setIndex] = null;
    }

    setSetRestTimers((prev) => {
      const next: Record<number, RestTimerState> = { ...prev };

      // Pause any other running timers and record how long they actually rested
      Object.keys(next).forEach((key) => {
        const i = Number(key);
        if (i === setIndex) return;
        const t = next[i]!;
        if (t.paused) return;
        const elapsed = Math.floor((now - t.startedAt) / 1000);
        next[i] = {
          ...t,
          paused: true,
          elapsedWhenPaused: Math.min(elapsed, t.total),
        };
      });

      next[setIndex] = { total: duration, startedAt: now };
      return next;
    });

    // Single interval to remove this set's timer when countdown ends
    intervalRefs.current[setIndex] = setInterval(() => {
      setSetRestTimers((prev) => {
        const timer = prev[setIndex];
        if (!timer || timer.paused) return prev;
        const elapsed = (Date.now() - timer.startedAt) / 1000;
        if (elapsed >= timer.total) {
          if (intervalRefs.current[setIndex]) {
            clearInterval(intervalRefs.current[setIndex]!);
            intervalRefs.current[setIndex] = null;
          }
          const newState = { ...prev };
          delete newState[setIndex];
          return newState;
        }
        return prev;
      });
    }, 1000);
  };

  // Progress for bar (0–100): smooth when running, 100 or frozen when paused)
  const getSetProgress = (setIndex: number): number => {
    const timer = setRestTimers[setIndex];
    if (!timer || timer.total === 0) return 0;
    if (timer.paused && timer.elapsedWhenPaused !== undefined) {
      return (timer.elapsedWhenPaused / timer.total) * 100;
    }
    const elapsed = (Date.now() - timer.startedAt) / 1000;
    return Math.min(100, (elapsed / timer.total) * 100);
  };

  // Remaining seconds for display (running) or elapsed when paused
  const getSetRestDisplay = (setIndex: number): { label: string; seconds: number } => {
    const timer = setRestTimers[setIndex];
    if (!timer) return { label: '', seconds: 0 };
    if (timer.paused && timer.elapsedWhenPaused !== undefined) {
      return {
        label: 'Rested',
        seconds: timer.elapsedWhenPaused,
      };
    }
    const elapsed = (Date.now() - timer.startedAt) / 1000;
    const remaining = Math.max(0, Math.ceil(timer.total - elapsed));
    return { label: 'Rest', seconds: remaining };
  };

  // Handle set completion toggle
  const handleSetComplete = (setIndex: number) => {
    const wasCompleted = sets[setIndex]?.completed;

    // Toggle completion state first
    if (onToggleSetComplete) {
      onToggleSetComplete(setIndex);
    }

    // Trigger animation if completing (not uncompleting)
    if (!wasCompleted) {
      // Use double requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = checkmarkRefs.current[setIndex];
          if (element) {
            // Remove any existing animation class first
            element.classList.remove('checkmark-animate');
            // Force reflow
            void element.offsetHeight;
            // Add animation class
            element.classList.add('checkmark-animate');

            // Remove class after animation
            setTimeout(() => {
              element.classList.remove('checkmark-animate');
            }, 600);
          }
        });
      });

      // Auto-start rest timer when set is completed
      startSetRest(setIndex);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Typography
            variant="h6"
            sx={{
              wordBreak: 'break-word',
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            {exercise.name}
          </Typography>
          <IconButton
            size="small"
            aria-label="Exercise options"
            onClick={handleMenuOpen}
            sx={{ flexShrink: 0 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Exercise Options Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleRemoveClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Remove Exercise</ListItemText>
          </MenuItem>
        </Menu>

        {/* Remove Confirmation Dialog */}
        <Dialog
          open={removeConfirmOpen}
          onClose={() => setRemoveConfirmOpen(false)}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Remove Exercise?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to remove "{exercise.name}" from this
              workout? This action cannot be undone.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setRemoveConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRemoveConfirm}
                variant="contained"
                color="error"
              >
                Remove
              </Button>
            </Stack>
          </Box>
        </Dialog>

        {/* Set Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '50px', px: 1, py: 0.5 }}>
                  Set
                </TableCell>
                <TableCell sx={{ width: '80px', px: 1, py: 0.5 }}>
                  Previous
                </TableCell>
                <TableCell sx={{ width: '80px', px: 1, py: 0.5 }}>
                  +kg
                </TableCell>
                <TableCell sx={{ width: '70px', px: 1, py: 0.5 }}>
                  Reps
                </TableCell>
                <TableCell sx={{ width: '50px', px: 1, py: 0.5 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sets.map((set, idx) => {
                const timer = setRestTimers[idx];
                const isRunning =
                  timer &&
                  !timer.paused &&
                  (Date.now() - timer.startedAt) / 1000 < timer.total;
                const isPaused = timer?.paused;
                const showRestRow = timer && (isRunning || isPaused);
                const restDisplay = getSetRestDisplay(idx);
                return (
                  <Fragment key={idx}>
                    <TableRow>
                      <TableCell sx={{ px: 1, py: 0.5 }}>
                        {set.setNumber}
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 0.5 }}>
                        {set.previousWeight !== undefined &&
                        set.previousReps !== undefined ? (
                          <Typography variant="body2" color="text.secondary">
                            {set.previousWeight}kg × {set.previousReps}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 0.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ step: 0.5, min: 0 }}
                          value={set.weightKg ?? ''}
                          onChange={(e) =>
                            onChangeSet(
                              idx,
                              'weightKg',
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          sx={{ width: '70px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 0.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ step: 1, min: 1 }}
                          value={
                            repInputs[idx] !== undefined
                              ? repInputs[idx]
                              : set.reps
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setRepInputs((prev) => ({ ...prev, [idx]: val }));
                            if (
                              val !== '' &&
                              !isNaN(Number(val)) &&
                              Number(val) >= 1
                            ) {
                              onChangeSet(idx, 'reps', Number(val));
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || Number(val) < 1) {
                              setRepInputs((prev) => {
                                const newState = { ...prev };
                                delete newState[idx];
                                return newState;
                              });
                              onChangeSet(idx, 'reps', 1);
                            } else {
                              setRepInputs((prev) => {
                                const newState = { ...prev };
                                delete newState[idx];
                                return newState;
                              });
                            }
                          }}
                          sx={{ width: '60px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ px: 1, py: 0.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          {set.isPersonalBest && (
                            <Tooltip
                              title={set.pbDescription || 'New personal best'}
                              arrow
                            >
                              <EmojiEventsIcon
                                sx={{
                                  fontSize: 18,
                                  color: '#ffd700',
                                  filter:
                                    'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                                }}
                              />
                            </Tooltip>
                          )}
                          <IconButton
                            ref={(el) => {
                              checkmarkRefs.current[idx] = el;
                            }}
                            size="small"
                            onClick={() => handleSetComplete(idx)}
                            aria-label={
                              set.completed ? 'Uncomplete set' : 'Complete set'
                            }
                            sx={{
                              color: set.completed
                                ? 'success.main'
                                : 'action.disabled',
                              backgroundColor: set.completed
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'transparent',
                              '&:hover': {
                                color: set.completed
                                  ? 'success.dark'
                                  : 'action.active',
                                backgroundColor: set.completed
                                  ? 'rgba(76, 175, 80, 0.15)'
                                  : 'action.hover',
                              },
                              transition: 'all 0.2s ease-in-out',
                              '&.checkmark-animate': {
                                animation: 'checkmarkPulse 0.6s ease-in-out',
                                '@keyframes checkmarkPulse': {
                                  '0%': {
                                    transform: 'scale(0.8)',
                                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                  },
                                  '40%': {
                                    transform: 'scale(1.25)',
                                    backgroundColor: 'rgba(76, 175, 80, 0.4)',
                                  },
                                  '70%': {
                                    transform: 'scale(1.05)',
                                  },
                                  '100%': {
                                    transform: 'scale(1)',
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                  },
                                },
                                '& svg': {
                                  animation:
                                    'checkmarkTick 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                  '@keyframes checkmarkTick': {
                                    '0%': {
                                      transform: 'scale(0) rotate(-180deg)',
                                      opacity: 0,
                                    },
                                    '40%': {
                                      transform: 'scale(1.5) rotate(15deg)',
                                      opacity: 1,
                                    },
                                    '70%': {
                                      transform: 'scale(0.9) rotate(-5deg)',
                                    },
                                    '100%': {
                                      transform: 'scale(1) rotate(0deg)',
                                      opacity: 1,
                                    },
                                  },
                                },
                              },
                            }}
                          >
                            {set.completed ? (
                              <CheckCircleIcon
                                fontSize="small"
                                sx={{
                                  color: 'success.main',
                                  transition: 'transform 0.2s ease-in-out',
                                }}
                              />
                            ) : (
                              <CheckBoxOutlineBlankIcon
                                fontSize="small"
                                sx={{
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onRemoveSet(idx)}
                            aria-label="Remove set"
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                color: 'error.dark',
                                backgroundColor: 'error.light',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {/* Rest Timer Bar for this set (smooth progress; shows "Rested: X:XX" when paused) */}
                    {showRestRow && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{ px: 1, py: 0.5, border: 'none' }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color={isPaused ? 'text.secondary' : 'primary.main'}
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {restDisplay.label}: {formatElapsedTime(restDisplay.seconds)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={getSetProgress(idx)}
                              sx={{
                                height: 4,
                                borderRadius: 1,
                                backgroundColor: 'action.disabledBackground',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: isPaused
                                    ? 'action.disabled'
                                    : 'primary.main',
                                  transition: 'transform 0.1s linear',
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Set Button */}
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddSet();
          }}
          sx={{ mt: 1.5, width: '100%' }}
        >
          + Add Set ({formatElapsedTime(restDuration)})
        </Button>
      </CardContent>
    </Card>
  );
}
