import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  cacheDir: 'node_modules/.vite-vitest',
  plugins: [react()],
  test: {
    server: { deps: { inline: [/@react-spectrum\/s2/] } },
    environment: 'jsdom',
    // Fork workers atomically rename transformed temp modules, which is blocked by
    // the Windows app sandbox. Threads keep the suite portable in this environment.
    pool: 'threads',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.{test,spec}.{js,jsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
});
