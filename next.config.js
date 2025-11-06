/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'media.tenor.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'exercisedb.dev' },
      { protocol: 'https', hostname: 'v1.exercisedb.dev' },
      { protocol: 'https', hostname: 'v2.exercisedb.dev' },
      { protocol: 'https', hostname: 'v2.exercisedb.io' },
    ],
  },
};

module.exports = nextConfig;
