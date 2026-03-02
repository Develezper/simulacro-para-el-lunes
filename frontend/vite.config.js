import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'index.html'),
        clients: resolve(__dirname, 'clients.html'),
        clientCreate: resolve(__dirname, 'client-create.html'),
        clientEdit: resolve(__dirname, 'client-edit.html'),
        reports: resolve(__dirname, 'reports.html'),
        history: resolve(__dirname, 'history.html'),
        migration: resolve(__dirname, 'migration.html')
      }
    }
  }
});
