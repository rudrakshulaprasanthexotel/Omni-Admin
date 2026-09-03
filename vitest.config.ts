import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Kept separate from `vite.config.ts` so the test run skips the
 * `babel-plugin-react-compiler` pass (slow, and irrelevant to assertions) and
 * the dev proxy table — MSW intercepts at the network layer instead.
 *
 * `.env` is still loaded by Vite, so `import.meta.env.VITE_*` base paths
 * (`/data-engine`, `/cms/configuration`, `/interaction-svc/api`) resolve the
 * same way they do in the browser. Handler patterns are origin-agnostic to
 * match both the jsdom origin and the runtime interaction-svc origin.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The axios timeout state (#1) drives fake timers past 30s.
    testTimeout: 20_000,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: [
        'src/features/interactions/**',
        'src/services/apiClient/**',
        'src/shared/utils/**',
      ],
      exclude: ['src/test/**', '**/*.d.ts'],
    },
  },
});
