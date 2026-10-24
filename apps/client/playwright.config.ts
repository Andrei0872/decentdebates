import { config } from 'dotenv-flow';
import { defineConfig, devices } from '@playwright/test';

config({ node_env: 'test', silent: true });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'corepack pnpm -C ../.. run start:prod:local:client',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
