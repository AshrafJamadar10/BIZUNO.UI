import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    open: true,
    port: 9081,
    host: true,
    strictPort: true,
  },

  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
