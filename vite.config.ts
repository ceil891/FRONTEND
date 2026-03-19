import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: [
      '@mui/material', 
      '@mui/icons-material', 
      '@emotion/react', 
      '@emotion/styled',
      'react-router-dom',
      'hoist-non-react-statics',
      'prop-types',
      'react-is',
      '@mui/material/styles'
    ],
    exclude: ['jspdf', 'jspdf-autotable', 'xlsx']
  }
})