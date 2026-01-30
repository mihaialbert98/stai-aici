/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  sassOptions: {
    includePaths: ['./src/styles'],
  },
};

module.exports = nextConfig;
