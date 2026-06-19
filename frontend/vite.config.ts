import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    hmr: {
      host: 'localhost',
      port: 8081, // Connect directly to Bun SSR server running on port 8081 for HMR
    },
  },
})
