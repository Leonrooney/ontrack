'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Box, Typography, Paper } from '@mui/material';

export default function NewRoutinePage() {
  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          New Routine
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            Routine creation feature coming soon. This will allow you to create
            and save workout templates.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}
