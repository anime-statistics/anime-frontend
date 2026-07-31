export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  mockEnabled: import.meta.env.VITE_MOCK_ENABLED === 'true',
  appTitle: import.meta.env.VITE_APP_TITLE as string,
} as const
