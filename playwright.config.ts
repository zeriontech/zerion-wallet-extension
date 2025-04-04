import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './e2e',
  // 1 minute, default is 30 seconds
  timeout: 1 * 60 * 1000,
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
