import { NextRequest, NextResponse } from 'next/server';
import { getSessionSafe } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { preferencesUpdateSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preferences
 * Returns the current user's preferences, creating defaults if they don't exist
 */
export async function GET(request: NextRequest) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find or create preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, create with defaults
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          defaultRestSeconds: 90,
        },
      });
    }

    return NextResponse.json({
      id: preferences.id,
      userId: preferences.userId,
      defaultRestSeconds: preferences.defaultRestSeconds,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 * Updates the current user's preferences
 */
export async function PUT(request: NextRequest) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = preferencesUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert preferences (create if doesn't exist, update if it does)
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        defaultRestSeconds: validated.data.defaultRestSeconds,
      },
      create: {
        userId: user.id,
        defaultRestSeconds: validated.data.defaultRestSeconds,
      },
    });

    return NextResponse.json({
      id: preferences.id,
      userId: preferences.userId,
      defaultRestSeconds: preferences.defaultRestSeconds,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}




