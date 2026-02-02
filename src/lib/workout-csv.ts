/**
 * Workout CSV Export/Import Utilities
 *
 * CSV Format:
 * title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
 */

import { format } from 'date-fns';

export interface CSVWorkoutRow {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  exercise_title: string;
  superset_id: string;
  exercise_notes: string;
  set_index: number;
  set_type: string;
  weight_kg: number | string;
  reps: number | string;
  distance_km: string;
  duration_seconds: string;
  rpe: string;
}

/**
 * Convert workout data to CSV format
 */
export function exportWorkoutsToCSV(workouts: any[]): string {
  const rows: CSVWorkoutRow[] = [];

  for (const workout of workouts) {
    const startTime = workout.date ? new Date(workout.date) : new Date();
    // Calculate end time based on duration or use start time + 1 hour as default
    const durationMinutes = workout.durationMin || 60;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Format: "28 Jan 2026, 14:12" (day month year, hour:minute)
    const startTimeStr = format(startTime, 'd MMM yyyy, HH:mm');
    const endTimeStr = format(endTime, 'd MMM yyyy, HH:mm');

    for (const item of workout.items || []) {
      const exerciseName =
        item.exercise?.name || item.custom?.name || 'Unknown Exercise';

      for (const set of item.sets || []) {
        rows.push({
          title: workout.title || '',
          start_time: startTimeStr,
          end_time: endTimeStr,
          description: workout.notes || '',
          exercise_title: exerciseName,
          superset_id: '',
          exercise_notes: '',
          set_index: (set.setNumber || 1) - 1, // Convert to 0-indexed
          set_type: 'normal',
          weight_kg: set.weightKg ?? '',
          reps: set.reps ?? '',
          distance_km: '',
          duration_seconds: '',
          rpe: set.rpe ?? '',
        });
      }
    }
  }

  // Convert to CSV string
  const headers = [
    'title',
    'start_time',
    'end_time',
    'description',
    'exercise_title',
    'superset_id',
    'exercise_notes',
    'set_index',
    'set_type',
    'weight_kg',
    'reps',
    'distance_km',
    'duration_seconds',
    'rpe',
  ];

  const csvRows = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      [
        `"${escapeCSV(row.title)}"`,
        `"${escapeCSV(row.start_time)}"`,
        `"${escapeCSV(row.end_time)}"`,
        `"${escapeCSV(row.description)}"`,
        `"${escapeCSV(row.exercise_title)}"`,
        `"${escapeCSV(row.superset_id)}"`,
        `"${escapeCSV(row.exercise_notes)}"`,
        row.set_index,
        `"${escapeCSV(row.set_type)}"`,
        row.weight_kg === '' ? '' : row.weight_kg,
        row.reps === '' ? '' : row.reps,
        `"${escapeCSV(row.distance_km)}"`,
        `"${escapeCSV(row.duration_seconds)}"`,
        row.rpe === '' ? '' : row.rpe,
      ].join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Escape CSV field values
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  return String(value).replace(/"/g, '""');
}

/**
 * Parse CSV file and convert to workout data format
 */
export function parseCSVToWorkouts(csvText: string): any[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h.toLowerCase().trim()] = i;
  });

  // Group rows by workout (title + start_time)
  const workoutMap = new Map<string, any[]>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const getValue = (key: string): string => {
      const idx = headerMap[key];
      return idx !== undefined && idx < values.length
        ? values[idx]?.trim() || ''
        : '';
    };

    const title = getValue('title');
    const startTime = getValue('start_time');
    const workoutKey = `${title}|||${startTime}`;

    if (!workoutMap.has(workoutKey)) {
      workoutMap.set(workoutKey, []);
    }
    workoutMap.get(workoutKey)!.push({
      title,
      start_time: startTime,
      end_time: getValue('end_time'),
      description: getValue('description'),
      exercise_title: getValue('exercise_title'),
      superset_id: getValue('superset_id'),
      exercise_notes: getValue('exercise_notes'),
      set_index: parseInt(getValue('set_index')) || 0,
      set_type: getValue('set_type') || 'normal',
      weight_kg: getValue('weight_kg')
        ? parseFloat(getValue('weight_kg'))
        : null,
      reps: getValue('reps') ? parseInt(getValue('reps')) : null,
      distance_km: getValue('distance_km') || '',
      duration_seconds: getValue('duration_seconds') || '',
      rpe: getValue('rpe') ? parseFloat(getValue('rpe')) : null,
    });
  }

  // Convert grouped rows to workout format
  const workouts: any[] = [];

  for (const [workoutKey, rows] of workoutMap.entries()) {
    if (rows.length === 0) continue;

    const firstRow = rows[0];
    const [title, startTimeStr] = workoutKey.split('|||');

    // Parse date from format "d MMM yyyy, HH:mm" or "dd MMM yyyy, HH:mm" (e.g., "28 Jan 2026, 14:12")
    let workoutDate: Date;
    try {
      // Try parsing the date format - handles both single and double digit days
      const dateParts = startTimeStr.match(
        /(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{1,2}):(\d{2})/
      );
      if (dateParts) {
        const months: Record<string, number> = {
          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };
        const monthStr = dateParts[2].toLowerCase().substring(0, 3);
        const month = months[monthStr];
        if (month !== undefined) {
          workoutDate = new Date(
            parseInt(dateParts[3]),
            month,
            parseInt(dateParts[1]),
            parseInt(dateParts[4]),
            parseInt(dateParts[5])
          );
          // Validate the date
          if (isNaN(workoutDate.getTime())) {
            workoutDate = new Date(startTimeStr);
          }
        } else {
          workoutDate = new Date(startTimeStr);
        }
      } else {
        // Try standard date parsing
        workoutDate = new Date(startTimeStr);
        if (isNaN(workoutDate.getTime())) {
          workoutDate = new Date();
        }
      }
    } catch {
      workoutDate = new Date();
    }

    // Group rows by exercise
    const exerciseMap = new Map<string, any[]>();
    for (const row of rows) {
      const exerciseName = row.exercise_title || 'Unknown Exercise';
      if (!exerciseMap.has(exerciseName)) {
        exerciseMap.set(exerciseName, []);
      }
      exerciseMap.get(exerciseName)!.push(row);
    }

    // Build workout items
    const items: any[] = [];
    for (const [exerciseName, exerciseRows] of exerciseMap.entries()) {
      // Sort by set_index
      exerciseRows.sort((a, b) => a.set_index - b.set_index);

      const sets = exerciseRows.map((row, idx) => ({
        setNumber: idx + 1,
        weightKg: row.weight_kg || undefined,
        reps: row.reps || 1,
        rpe: row.rpe || undefined,
        notes: row.exercise_notes || undefined,
      }));

      items.push({
        exerciseName,
        sets,
      });
    }

    workouts.push({
      date: workoutDate.toISOString(),
      title: title || undefined,
      notes: firstRow.description || undefined,
      items,
    });
  }

  return workouts;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);
  return result;
}
