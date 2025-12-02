'use client';

import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Stack,
  Divider,
  Skeleton,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useFaq } from '@/hooks/faq';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/** Force dynamic so the page isn't statically prerendered */
export const dynamic = 'force-dynamic';

function FaqInner() {
  const sp = useSearchParams();
  const initialQuery = sp.get('q') ?? '';
  const initialTag = sp.get('tag') ?? undefined;

  const [query, setQuery] = useState(initialQuery);
  const [activeTag, setActiveTag] = useState<string | undefined>(initialTag);

  const { data, isLoading, error } = useFaq(query, activeTag);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    data?.items.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data]);

  useEffect(() => {
    // handle deep link anchors like /faq#hydration
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [data]);

  return (
    <MainLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          FAQ
        </Typography>

        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: 'hidden' }}>
          <TextField
            fullWidth
            label="Search FAQs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: steps target, calorie deficit, hydration..."
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {(allTags.length ? allTags : ['steps', 'goals', 'workouts', 'nutrition', 'hydration']).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                clickable
                color={activeTag === tag ? 'primary' : 'default'}
                onClick={() => setActiveTag(activeTag === tag ? undefined : tag)}
                sx={{ mb: 1 }}
              />
            ))}
            {activeTag && (
              <Chip label="Clear tag" onClick={() => setActiveTag(undefined)} variant="outlined" sx={{ mb: 1 }} />
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, sm: 2 }, overflow: 'hidden' }}>
          {isLoading ? (
            <Stack spacing={2}>
              <Skeleton height={40} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </Stack>
          ) : error ? (
            <Alert severity="error">Failed to load FAQs</Alert>
          ) : (data?.items.length ?? 0) === 0 ? (
            <Typography color="text.secondary">No results. Try different keywords or tags.</Typography>
          ) : (
            <Stack spacing={3}>
              {data!.items.map((faq) => (
                <Box key={faq.id} id={faq.slug}>
                  <Typography variant="h6">
                    <MuiLink component={Link} href={`/faq#${faq.slug}`}>
                      {faq.question}
                    </MuiLink>
                  </Typography>
                  <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>{faq.answer}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                    {faq.tags.map((t) => (
                      <Chip key={t} label={t} size="small" />
                    ))}
                  </Stack>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}

export default function FaqPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
              FAQ
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Skeleton height={40} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </Paper>
          </Box>
        </MainLayout>
      }
    >
      <FaqInner />
    </Suspense>
  );
}
