'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Box, Typography, Paper } from '@mui/material';

export default function ExploreRoutinesPage() {
  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Explore Routines
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            Routine exploration feature coming soon. This will allow you to
            browse and discover workout routines.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}
