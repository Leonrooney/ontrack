import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { preferencesUpdateSchema } from '@/lib/validators';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preferences
 * Returns the current user's preferences, creating defaults if they don't exist
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Find or create preferences
    let preferences = await prisma.user_preferences.findUnique({
      where: { userId: auth.userId },
    });

    // If no preferences exist, create with defaults
    if (!preferences) {
      preferences = await prisma.user_preferences.create({
        data: {
          id: randomUUID(),
          userId: auth.userId,
          defaultRestSeconds: 90,
          updatedAt: new Date(),
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
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const validated = preferencesUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      );
    }

    // Upsert preferences (create if doesn't exist, update if it does)
    const preferences = await prisma.user_preferences.upsert({
      where: { userId: auth.userId },
      update: {
        defaultRestSeconds: validated.data.defaultRestSeconds,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        userId: auth.userId,
        defaultRestSeconds: validated.data.defaultRestSeconds,
        updatedAt: new Date(),
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
