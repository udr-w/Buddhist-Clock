import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {timeout: 12000},
  retries: 1,
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', {outputFolder: 'playwright-report', open: 'never'}]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {name: 'mobile-chromium', use: {...devices['Pixel 7'], browserName:'chromium'}},
    {name: 'desktop-chromium', use: {browserName:'chromium', viewport:{width:1440,height:900}}}
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --directory site --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    timeout: 30000,
    reuseExistingServer: !process.env.CI
  }
});
