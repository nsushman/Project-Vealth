import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: ".", // Ensure Vite looks in the project root for index.html
  server: {
    host: '0.0.0.0',
    strictPort: true,
    port: 5173,
    allowedHosts: [
      'c6d60fa4-0dbf-40d5-baf7-3fc632a21645-00-cvr9le6w295d.riker.replit.dev'
    ]
  }
});
