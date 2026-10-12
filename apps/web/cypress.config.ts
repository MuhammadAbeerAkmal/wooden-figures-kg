import { defineConfig } from 'cypress';

// The tests need the full stack. Either:
//   docker compose up            and  CYPRESS_BASE_URL=http://localhost:8080 npm run e2e
//   npm run dev:api + dev:web    and  npm run e2e   (default base URL below)
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
  },
});
