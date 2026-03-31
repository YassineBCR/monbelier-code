import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['lucide-react', 'html5-qrcode'],
  },
  build: {
    commonjsOptions: {
      // Évite que Rollup plante sur des modules CJS complexes
      transformMixedEsModules: true,
    },
  },
});