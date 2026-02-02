'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useExercises } from '@/hooks/exercises';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { useState, useMemo } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from '@mui/material';

const bodyParts = [
  'all',
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'full body',
];

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('all');
  const [openInstr, setOpenInstr] = useState(false);
  const [instrTitle, setInstrTitle] = useState<string>('');
  const [instrBody, setInstrBody] = useState<string>('');

  const { data, isLoading, error } = useExercises(
    searchQuery || undefined,
    bodyPartFilter !== 'all' ? bodyPartFilter : undefined,
    true
  );

  const filteredExercises = useMemo(() => {
    if (!data) return [];
    const allExercises = [...(data.catalog || []), ...(data.custom || [])];

    // The API should handle body part filtering, but we do client-side search filtering
    // in case the search query doesn't match the API's search
    if (!searchQuery) {
      return allExercises;
    }

    const query = searchQuery.toLowerCase();
    return allExercises.filter((ex) => {
      return (
        ex.name?.toLowerCase().includes(query) ||
        ex.bodyPart?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Explore Exercises
        </Typography>

        {/* Search and Filter */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <TextField
            fullWidth
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Body Part</InputLabel>
            <Select
              value={bodyPartFilter}
              label="Body Part"
              onChange={(e) => setBodyPartFilter(e.target.value)}
            >
              {bodyParts.map((bp) => (
                <MenuItem key={bp} value={bp}>
                  {bp === 'all'
                    ? 'All'
                    : bp.charAt(0).toUpperCase() + bp.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Exercises List */}
        {isLoading ? (
          <Paper sx={{ p: 2 }}>
            <Typography>Loading...</Typography>
          </Paper>
        ) : error ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="error">Failed to load exercises</Typography>
          </Paper>
        ) : filteredExercises.length === 0 ? (
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">
              No exercises found. Try adjusting your search.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredExercises.map((ex) => (
              <Paper key={ex.id} sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ExerciseThumb
                    name={ex.name}
                    mediaUrl={ex.mediaUrl}
                    size={48}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                      {ex.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[ex.bodyPart, ex.equipment].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                  {ex.instructions && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInstrTitle(ex.name);
                        setInstrBody(ex.instructions);
                        setOpenInstr(true);
                      }}
                    >
                      <InfoOutlinedIcon />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Instructions Dialog */}
        <Dialog
          open={openInstr}
          onClose={() => setOpenInstr(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{instrTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
              {instrBody}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
