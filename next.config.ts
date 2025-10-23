import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: { remotePatterns: [{ hostname: 'upload.wikimedia.org', protocol: 'https' }] },
};

export default nextConfig;
