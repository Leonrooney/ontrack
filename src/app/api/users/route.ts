import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET /api/users - Example protected API route
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Replace with actual database query
  // Example: const users = await prisma.user.findMany()

  return NextResponse.json({
    message: 'Protected route accessed successfully',
    user: session.user,
    // users: [...]
  });
}

// POST /api/users - Example API route for creating users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Add validation with Zod
    // TODO: Add database operation with Prisma
    // Example: const user = await prisma.user.create({ data: body })

    return NextResponse.json(
      { message: 'User created successfully', data: body },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

