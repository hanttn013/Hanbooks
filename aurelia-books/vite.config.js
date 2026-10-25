import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { offlinePlugin } from './scripts/offline-plugin.mjs'
import macros from 'unplugin-parcel-macros'
import optimizeLocales from '@react-aria/optimize-locales-plugin'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  cacheDir: command === 'build' ? 'node_modules/.vite-build' : 'node_modules/.vite',
  optimizeDeps: { include: ['Provider', 'Button', 'ActionButton', 'ActionMenu', 'Dialog', 'Picker', 'TextField', 'TextArea', 'SearchField', 'Slider', 'Checkbox', 'Skeleton', 'Toast'].map(name => `@react-spectrum/s2/${name}`) },
  plugins: [macros.vite(), react(), { ...optimizeLocales.vite({ locales: ['en-US', 'vi-VN'] }), enforce: 'pre' }, offlinePlugin()],
  build: {
    target: ['es2022'],
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@react-spectrum') || id.includes('node_modules/@react-aria') || id.includes('node_modules/@react-stately')) {
            return 'spectrum-vendor';
          }
        },
      },
    },
  },
}))
