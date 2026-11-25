import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Machine-specific overrides belong in .env.local (see .env.example).
  const env = loadEnv(mode, process.cwd(), '');
  const gateway = {
    target: env.ROOMLY_GATEWAY_URL || 'http://127.0.0.1:8080',
    changeOrigin: true,
    // The backend allows one browser origin, so a dev server on another port presents that one.
    ...(env.ROOMLY_ALLOWED_ORIGIN ? {headers: {origin: env.ROOMLY_ALLOWED_ORIGIN}} : {}),
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: Number(env.DEV_PORT) || 3000,
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
        '/auth-service': gateway,
        '/hotel-service': gateway,
        '/room-service': gateway,
        '/booking-service': gateway,
        '/payment-service': gateway,
        '/review-service': gateway,
        '/notification-service': gateway,
        '/invoice-service': gateway,
        '/housekeeping-service': gateway,
      },
    },
  };
});
