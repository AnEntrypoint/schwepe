import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    // Global launch options for all browsers
    launchOptions: {
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-software-rasterizer',
            '--disable-extensions'
          ]
        }
      }
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: [
            '--enable-gpu-rasterization',
            '--enable-accelerated-video-decode',
            '--enable-accelerated-2d-canvas'
          ]
        }
      }
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          args: [
            '--enable-gpu-rasterization',
            '--enable-accelerated-video-decode'
          ]
        }
      }
    }
  ]
});