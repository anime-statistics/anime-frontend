import { defineConfig, devices } from '@playwright/test'

// Overridable because Windows sometimes reserves port 3000 for Hyper-V.
const PORT = process.env.E2E_PORT ?? '3000'
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/visual',
  fullyParallel: true,
  // Screenshot comparison is advisory: it must not block a PR on font rendering
  // differences between machines, so CI treats this config as optional.
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: BASE_URL,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
