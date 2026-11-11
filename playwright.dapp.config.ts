import { defineConfig, devices } from '@playwright/test';

const proxyPort = process.env.E2E_PROXY_PORT ?? '4789';
const useProxy =
  process.env.E2E_USE_PROXY === '1' ||
  Boolean(process.env.ZERION_API_DEVELOPMENT_KEY || process.env.CF_ZPI_DEV_BYPASS_SECRET);

const webServers: Array<{
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
}> = [];

if (useProxy) {
  webServers.push({
    command: 'node e2e/proxy.mjs',
    url: `http://127.0.0.1:${proxyPort}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  });
}

export default defineConfig({
  testDir: './e2e/dapp',
  timeout: 2 * 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'e2e-report' }], ['line']],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: webServers.length ? webServers : undefined,
});
