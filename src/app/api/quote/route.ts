import { NextResponse } from 'next/server';

/**
 * Quote widget: fetches a random quote from the external Zen Quotes API.
 * @see https://zenquotes.io
 * @see https://docs.zenquotes.io/zenquotes-documentation/
 */
const ZEN_QUOTES_URL = 'https://zenquotes.io/api/random';
const headers = {
  'User-Agent': 'OnTrack/1.0',
  Accept: 'application/json',
};

export async function GET() {
  try {
    const res = await fetch(ZEN_QUOTES_URL, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Quote service unavailable' },
        { status: 502 }
      );
    }
    const data = (await res.json()) as Array<{ q?: string; a?: string }>;
    const quote = Array.isArray(data) ? data[0] : null;
    if (quote?.q && quote?.a) {
      return NextResponse.json({
        content: quote.q,
        author: quote.a,
      });
    }
    return NextResponse.json(
      { error: 'Invalid quote response' },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 502 }
    );
  }
}
