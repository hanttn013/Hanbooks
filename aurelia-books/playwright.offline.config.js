import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/offline',
  timeout: 180_000,
  workers: 1,
  outputDir: 'qa/offline-results',
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 360, height: 800 }, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
