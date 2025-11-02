'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import {
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { useState } from 'react';

export default function ActivityPage() {
  const [tab, setTab] = useState(0);

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Activity
        </Typography>
        <Paper sx={{ mt: 3 }}>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
            <Tab label="Day" />
            <Tab label="Week" />
            <Tab label="Month" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tab === 0 && <Typography>Day view content</Typography>}
            {tab === 1 && <Typography>Week view content</Typography>}
            {tab === 2 && <Typography>Month view content</Typography>}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}

