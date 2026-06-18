/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_API_URL: 'https://odrtechapi.app/ims/api',
  },
  images: {
    unoptimized: true,
  },
};

// module.exports = nextConfig;
export default nextConfig;
