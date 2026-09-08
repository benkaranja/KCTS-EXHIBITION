import { defineConfig } from 'vite';

export default defineConfig({
  base: '/KCTS-EXHIBITION/',
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
