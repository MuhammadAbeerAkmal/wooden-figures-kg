import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the browser talks to Vite, and Vite forwards /api to the NestJS API.
// In Docker, nginx does the same (see nginx.conf), so the UI never needs CORS.
const apiTarget = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  // The SHACL form component is about 600 kB. It is in its own chunk, loaded only on /new.
  build: { chunkSizeWarningLimit: 700 },
  server: { port: 5173, proxy: { '/api': apiTarget } },
  preview: { port: 5173, proxy: { '/api': apiTarget } },
});
