'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Saved workout state structure for localStorage persistence
 */
export interface SavedWorkoutState {
  title: string;
  notes: string;
  items: Array<{
    exerciseId?: string;
    customId?: string;
    name: string;
    bodyPart?: string;
    equipment?: string;
    sets: Array<{
      setNumber: number;
      weightKg?: number;
      reps: number;
      rpe?: number;
      notes?: string;
    }>;
  }>;
  workoutStartTime: string; // ISO date string
  elapsedSeconds: number; // Elapsed time in seconds
  savedAt: string; // ISO date string of when state was saved
}

const STORAGE_KEY = 'ontrack_in_progress_workout';
const WORKOUT_CLEARED_EVENT = 'ontrack-workout-cleared';

/**
 * Hook for persisting in-progress workout state to localStorage
 *
 * Allows users to navigate away from the workout page and return later
 * with all their data (exercises, sets, weights, reps, timer) intact.
 *
 * Features:
 * - Auto-saves workout state to localStorage
 * - Reactive `hasSavedWorkout` boolean that updates when state changes
 * - Listens for storage events (cross-tab updates)
 * - Periodic checks for same-tab updates
 *
 * @returns Object with:
 * - hasSavedWorkout: Boolean indicating if a workout is currently saved
 * - getSavedWorkout: Function to retrieve saved workout state
 * - saveWorkout: Function to save current workout state
 * - clearSavedWorkout: Function to remove saved workout state
 */
export function useWorkoutPersistence() {
  const pathname = usePathname();
  const isWorkoutPage = pathname === '/workouts/new';

  // Check if there's a saved workout
  const hasSavedWorkout = (): boolean => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null;
  };

  // Get saved workout state
  const getSavedWorkout = (): SavedWorkoutState | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as SavedWorkoutState;
    } catch {
      return null;
    }
  };

  // Save workout state
  const saveWorkout = (state: Omit<SavedWorkoutState, 'savedAt'>) => {
    if (typeof window === 'undefined') return;
    const stateToSave: SavedWorkoutState = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  };

  // Clear saved workout (and notify other hook instances so FAB hides immediately)
  const clearSavedWorkout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(WORKOUT_CLEARED_EVENT));
  };

  // Hook to check if there's a saved workout (reactive)
  const [hasWorkout, setHasWorkout] = useState(false);

  useEffect(() => {
    setHasWorkout(hasSavedWorkout());

    // Listen for storage changes (in case workout is saved/cleared in another tab)
    const handleStorageChange = () => {
      setHasWorkout(hasSavedWorkout());
    };

    // Listen for same-tab clear (e.g. user finished workout) so FAB hides immediately
    const handleWorkoutCleared = () => {
      setHasWorkout(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(WORKOUT_CLEARED_EVENT, handleWorkoutCleared);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(() => {
      setHasWorkout(hasSavedWorkout());
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(WORKOUT_CLEARED_EVENT, handleWorkoutCleared);
      clearInterval(interval);
    };
  }, [pathname]);

  return {
    hasSavedWorkout: hasWorkout,
    getSavedWorkout,
    saveWorkout,
    clearSavedWorkout,
  };
}
