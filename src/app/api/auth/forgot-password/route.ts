import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { parseBody } from '@/lib/route-utils';

const bodySchema = z.object({
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
});

const RESET_EXPIRY_HOURS = 1;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OnTrack <onboarding@resend.dev>';

export async function POST(req: Request) {
  const result = await parseBody(req, bodySchema);
  if ('response' in result) return result.response;
  const { email } = result.data;
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Always return success to avoid leaking whether the email exists
  if (!user?.passwordHash) {
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  }

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.users.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Reset your OnTrack password',
      html: `
        <p>You requested a password reset for your OnTrack account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in ${RESET_EXPIRY_HOURS} hour(s). If you didn't request this, you can ignore this email.</p>
      `,
    });
    if (error) {
      console.error('[Forgot password] Resend error', error);
      // Still return success; user can retry or use dev link
    }
  } else if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Forgot password] Reset link for', email, ':', resetUrl);
  }

  return NextResponse.json({
    message: 'If an account exists with this email, you will receive a password reset link.',
  });
}
