import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: ['jspdf', 'jspdf-autotable', 'xlsx']
  },
  ssr: {
    noExternal: ['jspdf', 'jspdf-autotable', 'xlsx']
  }
})
