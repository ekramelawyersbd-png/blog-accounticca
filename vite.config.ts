import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) {
            return 'vendor-firebase';
          }
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'vendor-charts';
          }
          if (
            id.includes('/jspdf/') ||
            id.includes('/html2canvas/') ||
            id.includes('/jszip/')
          ) {
            return 'vendor-pdf-tools';
          }
          if (id.includes('/lucide-react/')) {
            return 'vendor-icons';
          }
          return undefined;
        },
      },
    },
  },
});
