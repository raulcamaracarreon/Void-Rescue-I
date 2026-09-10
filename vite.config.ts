import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs work locally and under GitHub Pages project URLs.
  base: './',
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
