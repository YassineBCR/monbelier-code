import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Vite scanne UNIQUEMENT index.html → src/ et rien d'autre
    entries: ['index.html'],
    exclude: ['lucide-react'],
  },
});