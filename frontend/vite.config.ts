import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4300,
    strictPort: true,
  },
  build: {
    sourcemap: true,
  },
});