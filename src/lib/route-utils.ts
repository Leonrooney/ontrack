import { NextResponse } from 'next/server';
import type { z, ZodSchema } from 'zod';

/**
 * Parse and validate JSON body against a Zod schema.
 * Returns parsed data or a 400 NextResponse with a single error message.
 *
 * @example
 * const result = await parseBody(req, mySchema);
 * if (result.response) return result.response;
 * const data = result.data;
 */
export async function parseBody<T extends ZodSchema>(
  req: Request,
  schema: T
): Promise<
  | { data: z.infer<T> }
  | { response: NextResponse }
> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstMessage =
      Object.values(fieldErrors).flat().find(Boolean) ?? 'Invalid input';
    return {
      response: NextResponse.json(
        { error: typeof firstMessage === 'string' ? firstMessage : 'Invalid input' },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data as z.infer<T> };
}

/**
 * Log an error and return a consistent 500 JSON response.
 * Use in catch blocks to avoid repeating try/catch boilerplate.
 */
export function handleRouteError(
  error: unknown,
  context?: string
): NextResponse {
  const message = context ? `${context}: ${String(error)}` : String(error);
  console.error('[API]', message);
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  );
}
