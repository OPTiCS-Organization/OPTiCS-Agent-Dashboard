import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: parseInt(env.VITE_DASHBOARD_PORT || '5240'),
      proxy: {
        '/api': {
          target: 'http://localhost:5230',
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true,
        },
      },
    },
  }
})
