import { NextRequest, NextResponse } from 'next/server';
import { getSessionSafe } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileUpdateSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile
 * Returns the current user's profile/settings
 */
export async function GET(request: NextRequest) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        unitPreference: true,
        themePreference: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      unitPreference: user.unitPreference ?? 'metric',
      themePreference: user.themePreference ?? 'system',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Updates the current user's profile/settings
 */
export async function PUT(request: NextRequest) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = profileUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: {
      name?: string | null;
      unitPreference?: string;
      themePreference?: string;
    } = {};

    if (validated.data.name !== undefined) {
      // Treat empty strings as null to clear the name
      updateData.name = validated.data.name || null;
    }
    if (validated.data.unitPreference !== undefined) {
      updateData.unitPreference = validated.data.unitPreference;
    }
    if (validated.data.themePreference !== undefined) {
      updateData.themePreference = validated.data.themePreference;
    }

    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        unitPreference: true,
        themePreference: true,
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name ?? '',
      unitPreference: updatedUser.unitPreference ?? 'metric',
      themePreference: updatedUser.themePreference ?? 'system',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
