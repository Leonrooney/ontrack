import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { passwordSchema } from '@/lib/validators';
import { parseBody } from '@/lib/route-utils';

const bodySchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export async function POST(req: Request) {
  const result = await parseBody(req, bodySchema);
  if ('response' in result) return result.response;
  const { token, newPassword } = result.data;

  const user = await prisma.users.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.users.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
