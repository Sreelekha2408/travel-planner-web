/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApi } from './mock-api/mockApi'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // `npm run dev:mock` (mode "mock") answers /api/users/* and /api/trip/* locally instead of proxying.
  plugins: [react(), mode === 'mock' && mockApi()],
  build: {
    rolldownOptions: {
      output: {
        // Vendor chunks: libraries change far less often than app code, so they get their
        // own cacheable files and an app deploy doesn't force re-downloading React or MUI.
        // MUI X date pickers aren't listed: they stay in the lazily loaded trip form chunk.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'mui', test: /node_modules[\\/](@mui[\\/](material|system|utils|styled-engine|private-theming|icons-material|core-downloads-tracker)|@emotion|@popperjs|react-transition-group)[\\/]/ },
          ],
        },
      },
    },
  },
  // Vitest reuses this config, so tests resolve imports and JSX exactly like the app.
  test: {
    environment: 'jsdom', // a simulated browser DOM for React Testing Library
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    proxy: {
      // The Spring Boot API has no common prefix and owns /dashboard, which is also a
      // frontend route. Prefixing API calls with /api avoids that clash; the prefix is
      // stripped before forwarding. Same-origin in the browser, so no CORS in dev.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))
