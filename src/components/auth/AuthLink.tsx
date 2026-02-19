'use client';

import Link from 'next/link';

const linkStyle = {
  fontWeight: 600,
  color: 'inherit',
  textDecoration: 'underline',
} as const;

interface AuthLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Styled link for auth flows (e.g. "Back to sign in", "Create an account").
 * Keeps appearance consistent across login, signup, forgot-password, reset-password.
 */
export function AuthLink({ href, children }: AuthLinkProps) {
  return <Link href={href} style={linkStyle}>{children}</Link>;
}
