import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { hashPassword } from '@/lib/auth';
import { passwordSchema } from '@/lib/validators';
import { parseBody } from '@/lib/route-utils';

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const result = await parseBody(req, registerSchema);
    if ('response' in result) return result.response;
    const { name, email, password } = result.data;

    const existing = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    await prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        name,
        passwordHash,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created. You can now sign in.',
    });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
