import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@dummyyy/channels': path.resolve(__dirname, '../../packages/channels/src'),
    },
  },
  build: {
    // Optimize for TV browsers
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'hls': ['hls.js'],
        },
      },
    },
  },
})
