'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthLink } from '@/components/auth/AuthLink';
import { PasswordField } from '@/components/ui/PasswordField';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
      router.refresh();
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) setError('Invalid email or password');
      else if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Sign In
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Sign in to access OnTrack
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          margin="normal"
          autoComplete="email"
        />
        <PasswordField
          fullWidth
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          margin="normal"
          autoComplete="current-password"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          New to OnTrack? <AuthLink href="/signup">Create an account</AuthLink>
        </Typography>
      </form>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Demo Credentials:
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          <strong>Email:</strong> demo@ontrack.app
        </Typography>
        <Typography variant="body2" align="center">
          <strong>Password:</strong> Passw0rd!
        </Typography>
      </Box>
    </AuthPageLayout>
  );
}
