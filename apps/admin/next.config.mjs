/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@api21/types'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
