/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@apps21/types'],
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
