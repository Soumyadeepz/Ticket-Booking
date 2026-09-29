import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const KILLER_SW_SCRIPT = `
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
`;

const FORCE_RELOAD_MODULE = `
if (typeof window !== 'undefined') {
  (async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
  })();
}
export default {};
`;

function clearStaleServiceWorkerPlugin() {
  return {
    name: 'clear-stale-service-worker',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Allow Google OAuth popup window.postMessage communication without COOP blocking
        res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');

        const url = req.url?.split('?')[0] || '';

        if (
          url === '/sw.js' ||
          url === '/service-worker.js' ||
          url === '/dev-sw.js' ||
          url === '/registerSW.js' ||
          url.startsWith('/workbox-')
        ) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Clear-Site-Data', '"cache", "storage"');
          res.end(KILLER_SW_SCRIPT);
          return;
        }

        if (url.endsWith('.tsx') || url.endsWith('.ts')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Clear-Site-Data', '"cache", "storage"');
          res.end(FORCE_RELOAD_MODULE);
          return;
        }

        const cookies = req.headers.cookie || '';
        if (!cookies.includes('tb_sw_cleared_v2=1')) {
          res.setHeader('Clear-Site-Data', '"cache", "storage"');
          res.setHeader(
            'Set-Cookie',
            'tb_sw_cleared_v2=1; Path=/; Max-Age=86400; SameSite=Lax'
          );
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [clearStaleServiceWorkerPlugin(), react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
