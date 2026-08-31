import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy every Roomly microservice prefix to the API gateway (Eureka discovery-locator
      // routing: gateway strips the leading /<service-name> segment). Proxying keeps the
      // browser same-origin so Roomly's cookie-based JWT auth + CORS never come into play
      // in dev, regardless of what port Vite runs on.
      proxy: {
        '/auth-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/hotel-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/room-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/booking-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/payment-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/review-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/notification-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/invoice-service': { target: 'http://localhost:8080', changeOrigin: true },
        '/housekeeping-service': { target: 'http://localhost:8080', changeOrigin: true },
      },
    },
  };
});
