/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@api21/types'],
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
