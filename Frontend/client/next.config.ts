import type { NextConfig } from "next";
import path from 'path';
import fs from 'fs';

// Đọc thủ công file .env từ thư mục Frontend/ (thư mục cha) để Next.js compiler nhận diện chính xác biến môi trường
let rootEnv: Record<string, string> = {};
try {
  const envPath = path.join(process.cwd(), '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          rootEnv[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
} catch (error) {
  console.error('Failed to read root .env file manually:', error);
}

const nextConfig: NextConfig = {
  env: {
    // Luôn ưu tiên biến môi trường từ file .env ở gốc, nếu không có mới dùng fallback
    GLOBAL_BACKEND_IP: rootEnv.GLOBAL_BACKEND_IP || 'http://localhost:8080',
    NEXT_PUBLIC_GLOBAL_BACKEND_IP: rootEnv.NEXT_PUBLIC_GLOBAL_BACKEND_IP || 'http://localhost:8080',
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
