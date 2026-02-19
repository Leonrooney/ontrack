import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuthOr401, hashPassword, comparePassword } from '@/lib/auth';
import { passwordSchema } from '@/lib/validators';
import { parseBody } from '@/lib/route-utils';

const bodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export async function POST(req: Request) {
  const auth = await requireAuthOr401();
  if (auth instanceof NextResponse) return auth;

  const result = await parseBody(req, bodySchema);
  if ('response' in result) return result.response;
  const { currentPassword, newPassword } = result.data;

  const user = await prisma.users.findUnique({
    where: { email: auth.email },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: 'This account cannot change password here' },
      { status: 400 }
    );
  }

  const currentOk = await comparePassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.users.update({
    where: { id: user.id },
    data: { passwordHash, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
