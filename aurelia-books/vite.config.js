import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { offlinePlugin } from './scripts/offline-plugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), offlinePlugin()],
})
