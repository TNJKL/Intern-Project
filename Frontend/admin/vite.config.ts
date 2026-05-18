import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const target = env.GLOBAL_BACKEND_IP;
  const targetUrl = new URL(target || 'http://localhost:5000');

  return {
    plugins: [react()],
    envDir: '../', // Trỏ ra thư mục Frontend/
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
          ws: true,
          timeout: 600000,
          proxyTimeout: 600000,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Ép cứng Host về IP của Backend để Nginx không từ chối
              proxyReq.setHeader('Host', targetUrl.hostname);
              
              // Xóa Origin, Referer và Cookie để làm nhẹ Header, tránh lỗi 400 của Nginx
              proxyReq.removeHeader('Origin');
              proxyReq.removeHeader('Referer');
              proxyReq.removeHeader('Cookie');
            });
            proxy.on('error', (err, _req, res) => {
              console.error('Vite Proxy Error:', err);
              const response = res as any;
              if (response.writeHead && !response.headersSent) {
                response.writeHead(500, { 'Content-Type': 'text/plain' });
              }
              if (response.end) response.end('Proxy Error: ' + err.message);
            });
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
