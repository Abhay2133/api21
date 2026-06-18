import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    manifest: true,
    outDir: '../public/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.ts',
      },
    },
  },
})
