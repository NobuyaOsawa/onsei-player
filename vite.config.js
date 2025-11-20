import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/onsei-player/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})

