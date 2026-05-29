import type { NextConfig } from "next";
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Nạp file .env từ thư mục Frontend/ (thư mục cha của client)
const projectDir = process.cwd();
loadEnvConfig(path.join(projectDir, '..'));

const nextConfig: NextConfig = {
  env: {
    // Ưu tiên biến từ file .env, nếu không có thì dùng IP mặc định
    GLOBAL_BACKEND_IP: process.env.GLOBAL_BACKEND_IP || 'http://10.86.156.23',
    NEXT_PUBLIC_GLOBAL_BACKEND_IP: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || 'http://10.86.156.23',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
