/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  // Proxy API calls through this same origin so the auth cookie (set by the
  // backend response) is scoped to this domain — middleware.js reads it via
  // request.cookies, which only sees cookies belonging to this origin.
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
