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
    AUTH_SECRET: rootEnv.AUTH_SECRET,
    // Expose Firebase config variables mapped from root .env
    NEXT_PUBLIC_FIREBASE_API_KEY: rootEnv.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: rootEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: rootEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: rootEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: rootEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    NEXT_PUBLIC_FIREBASE_APP_ID: rootEnv.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  images: {
    unoptimized: true,
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

  typedRoutes: false,
};

export default nextConfig;