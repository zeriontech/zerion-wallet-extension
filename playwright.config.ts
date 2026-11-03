import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const proxyPort = process.env.E2E_PROXY_PORT ?? '4789';
const useProxy =
  process.env.E2E_USE_PROXY === '1' ||
  Boolean(
    process.env.ZERION_API_DEVELOPMENT_KEY ||
      process.env.CF_ZPI_DEV_BYPASS_SECRET
  );

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './e2e',
  // The extension is built against a local proxy so the Cloudflare bypass
  // secret never enters Chromium (and therefore never enters traces).
  webServer: useProxy
    ? {
        command: 'node e2e/proxy.mjs',
        url: `http://127.0.0.1:${proxyPort}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
  // 2 minutes: onboarding with a recovery phrase derives multiple wallets and
  // can exceed 60s on CI runners.
  timeout: 2 * 60 * 1000,
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use.
  // See https://playwright.dev/docs/test-reporters
  reporter: [['html', { outputFolder: 'e2e-report' }]],
  use: {
    permissions: ['clipboard-read', 'clipboard-write'],
    // Collect trace when retrying the failed test.
    // See https://playwright.dev/docs/trace-viewer
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
