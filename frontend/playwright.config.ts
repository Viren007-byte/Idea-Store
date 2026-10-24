import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests', timeout: 60000, workers: 1, fullyParallel: false,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node ../backend/node_modules/tsx/dist/cli.mjs ../backend/tests/browser-server.ts', url: 'http://127.0.0.1:8001/api/health', timeout: 180000, reuseExistingServer: false },
    { command: 'npm.cmd run dev -- --host 127.0.0.1 --port 5174', url: 'http://127.0.0.1:5174', env: { API_PROXY_TARGET: 'http://127.0.0.1:8001' }, timeout: 60000, reuseExistingServer: false },
  ],
})
