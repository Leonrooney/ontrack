'use client';

import { useState } from 'react';
import { Button, TextField, Typography, Alert } from '@mui/material';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthLink } from '@/components/auth/AuthLink';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Forgot password
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </Typography>

      {sent ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          If an account exists with this email, you will receive a password reset link. Check your inbox and spam folder.
        </Alert>
      ) : (
        <>
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}

      <Typography variant="body2" color="text.secondary" align="center">
        <AuthLink href="/login">Back to sign in</AuthLink>
      </Typography>
    </AuthPageLayout>
  );
}
