'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Typography, Alert } from '@mui/material';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthLink } from '@/components/auth/AuthLink';
import { PasswordField } from '@/components/ui/PasswordField';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Missing reset link. Please use the link from your email.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Password reset
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          Your password has been updated. You can now sign in.
        </Alert>
        <Button component={Link} href="/login" fullWidth variant="contained" sx={{ textDecoration: 'none' }}>
          Sign in
        </Button>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset password
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} href="/forgot-password" fullWidth variant="outlined" sx={{ textDecoration: 'none' }}>
          Request a new link
        </Button>
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Set new password
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your new password below.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <PasswordField
          fullWidth
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          margin="normal"
          autoComplete="new-password"
          helperText="At least 8 characters, with uppercase, lowercase, and a number"
        />
        <PasswordField
          fullWidth
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          margin="normal"
          autoComplete="new-password"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>

      <Typography variant="body2" color="text.secondary" align="center">
        <AuthLink href="/login">Back to sign in</AuthLink>
      </Typography>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout>
      <Suspense fallback={<Typography align="center">Loading...</Typography>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
