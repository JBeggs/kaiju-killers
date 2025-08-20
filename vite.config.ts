import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    // Enable compression for avatar files
    middlewareMode: false,
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei']
  },
  build: {
    rollupOptions: {
      output: {
        // Separate avatar files into their own chunk
        manualChunks: {
          'avatar-data': ['./public/avatar/hector.json']
        }
      }
    }
  }
})