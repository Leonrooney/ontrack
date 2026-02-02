'use client';

import Image from 'next/image';
import { Avatar } from '@mui/material';

function isAllowedHost(url?: string | null) {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    // List must match next.config.js remotePatterns; extend if you add more
    const allowed = new Set([
      'i.imgur.com',
      'media.tenor.com',
      'upload.wikimedia.org',
      'images.unsplash.com',
      'cdn.jsdelivr.net',
      // add common ExerciseDB hosts
      'exercisedb.dev',
      'v1.exercisedb.dev',
      'v2.exercisedb.dev',
      'v2.exercisedb.io',
      // RapidAPI image hosts sometimes proxy via cdn
      'rapidapi.com',
    ]);
    return allowed.has(h);
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string): string {
  // Upgrade http to https if not present
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

export function ExerciseThumb({
  name,
  mediaUrl,
  size = 40,
}: {
  name: string;
  mediaUrl?: string | null;
  size?: number;
}) {
  if (!mediaUrl) {
    return (
      <Avatar sx={{ width: size, height: size }}>
        {name.slice(0, 1).toUpperCase()}
      </Avatar>
    );
  }

  // Check if it's a local placeholder (starts with /)
  const isLocal = mediaUrl.startsWith('/');
  const allowed = isAllowedHost(mediaUrl);
  const sanitizedUrl = sanitizeUrl(mediaUrl);

  if (isLocal) {
    // Local SVG placeholders - use regular img tag
    return (
      <img
        src={sanitizedUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          objectFit: 'cover',
        }}
      />
    );
  }

  if (allowed) {
    // Whitelisted remote host - use Next.js Image
    return (
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Image
          src={sanitizedUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Fallback to plain <img> so we still show thumbnails even if host isn't in next.config
  return (
    <img
      src={sanitizedUrl}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        objectFit: 'cover',
        flexShrink: 0,
      }}
      loading="lazy"
    />
  );
}
