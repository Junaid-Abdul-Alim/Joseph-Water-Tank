import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Use Vite 8's default fast minifier
    minify: 'oxc',
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize dependencies
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }

            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor'
            }
          }
        }
      }
    },
    // Target modern browsers for smaller output
    target: 'esnext',
    // Faster source map generation
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'react-chartjs-2'],
    // Force pre-bundle on every start
    force: false
  },
  // Faster resolution
  resolve: {
    extensions: ['.js', '.jsx']
  }
})
