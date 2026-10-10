import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
