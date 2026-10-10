import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApi } from './mock-api/mockApi'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // `npm run dev:mock` (mode "mock") answers /api/users/* and /api/trip/* locally instead of proxying.
  plugins: [react(), mode === 'mock' && mockApi()],
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
