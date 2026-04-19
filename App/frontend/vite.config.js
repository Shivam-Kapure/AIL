import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Forces Vite to expose the network
    port: 5173,
    watch: {
      usePolling: true // Fixes file-watching issues in Docker
    }
  }
})
