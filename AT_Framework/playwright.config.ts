import { defineConfig } from '@playwright/test';
import { config } from './config/env';

export default defineConfig({

  testDir: './tests',

  fullyParallel: false,

  workers: process.env.CI ? 1 : undefined,

  retries: process.env.CI ? 2 : 1,

reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'playwright-report/report.json' }],
  ['allure-playwright']
],

  use: {
    baseURL: config.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium'
      }
    }

    // need to uncomment when cross-browser execution is required.

    // {
    //   name: 'firefox',
    //   use: { browserName: 'firefox' }
    // },
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' }
    // }

  ]

});