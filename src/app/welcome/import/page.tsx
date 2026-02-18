'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { MainLayout } from '@/components/layout/MainLayout';

export default function WelcomeImportPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Container
        maxWidth="sm"
        sx={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 4 },
              width: '100%',
              maxWidth: 440,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <FitnessCenterIcon
                sx={{
                  fontSize: 48,
                  color: 'primary.main',
                  mb: 1,
                }}
              />
              <Typography variant="h5" component="h1" gutterBottom>
                Welcome to OnTrack
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your account is ready. Bring your workout history with you.
              </Typography>
            </Box>

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Import your data from other apps
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you used <strong>Hevy</strong>, <strong>Strong</strong>, or
              any app that exports CSV, you can import your workouts so nothing
              gets left behind.
            </Typography>

            <Stack spacing={2} sx={{ mt: 3 }}>
              <Button
                component={Link}
                href="/profile"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{ py: 1.5 }}
              >
                Import workouts from CSV
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<SkipNextIcon />}
                onClick={() => router.push('/dashboard')}
                sx={{ py: 1.5 }}
              >
                Skip for now
              </Button>
            </Stack>

            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              align="center"
              sx={{ mt: 3 }}
            >
              You can import or export data anytime from Profile.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </MainLayout>
  );
}
