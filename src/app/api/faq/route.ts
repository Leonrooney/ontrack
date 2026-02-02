import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const tag = (url.searchParams.get('tag') || '').trim().toLowerCase();

  // Fetch all, we'll filter in-memory for fuzziness
  const faqs = await prisma.faqs.findMany({ orderBy: { createdAt: 'desc' } });

  const normalized = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    tags: Array.isArray(f.tags)
      ? f.tags
      : typeof f.tags === 'string'
        ? JSON.parse(f.tags)
        : [],
    slug: f.question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80),
  }));

  const byTag = tag
    ? normalized.filter((f) =>
        f.tags.some((t: string) => t.toLowerCase() === tag)
      )
    : normalized;

  if (!q) return NextResponse.json({ items: byTag }, { status: 200 });

  // Simple fuzzy scoring: contains > word match > char subsequence
  function score(item: (typeof normalized)[number]): number {
    const text = (
      item.question +
      ' ' +
      item.answer +
      ' ' +
      item.tags.join(' ')
    ).toLowerCase();
    if (text.includes(q)) return 3;

    const words = q.split(/\s+/);
    const wordHits = words.filter((w) => text.includes(w)).length;
    if (wordHits) return 2 + wordHits / Math.max(1, words.length);

    // subsequence check
    let i = 0;
    for (const c of text) if (c === q[i]) i++;

    return i / q.length;
  }

  const filtered = byTag
    .map((item) => ({ item, s: score(item) }))
    .filter((x) => x.s > 0.2)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item);

  return NextResponse.json({ items: filtered }, { status: 200 });
}
