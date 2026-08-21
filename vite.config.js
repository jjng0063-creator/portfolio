import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://jjng0063-creator.github.io/portfolio/, so every asset
  // URL needs the repo name prefixed. Use import.meta.env.BASE_URL to build
  // paths to files in public/ rather than hardcoding a leading slash.
  base: '/portfolio/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
