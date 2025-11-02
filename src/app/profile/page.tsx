import { MainLayout } from '@/components/layout/MainLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function ProfilePage() {
  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="body1">
            Profile content will go here.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}

