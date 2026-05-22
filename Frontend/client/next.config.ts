import type { NextConfig } from "next";
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Nạp file .env từ thư mục Frontend/ (thư mục cha của client)
const projectDir = process.cwd();
loadEnvConfig(path.join(projectDir, '..'));

const nextConfig: NextConfig = {
  env: {
    // Ưu tiên biến từ file .env, nếu không có thì dùng IP mặc định
    GLOBAL_BACKEND_IP: process.env.GLOBAL_BACKEND_IP || 'https://morbidity-stucco-grower.ngrok-free.dev',
    NEXT_PUBLIC_GLOBAL_BACKEND_IP: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || 'https://morbidity-stucco-grower.ngrok-free.dev',
  },
  images: {
    unoptimized: false,
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bizweb.dktcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'amazon-beverage-storage-906024320323-ap-southeast-1-an.s3.ap-southeast-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
