import { defineConfig } from '@playwright/test';
import { config } from './config/env';

export default defineConfig({

  testDir: './tests',

  fullyParallel: false,

  workers: process.env.CI ? 1 : undefined,

  retries: process.env.CI ? 1 : undefined,

reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'playwright-report/report.json' }],
  ['allure-playwright']
],

  use: {
    baseURL: config.baseUrl,
    trace: 'on',
    screenshot: 'on',
    video: 'on'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--disable-popup-blocking']
        }
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