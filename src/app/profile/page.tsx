import { MainLayout } from '@/components/layout/MainLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function ProfilePage() {
  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="body1">
            Profile content will go here.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}

