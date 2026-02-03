import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        ordersMfe: 'http://localhost:5001/assets/remoteEntry.js',
        analyticsMfe: 'http://localhost:5002/assets/remoteEntry.js',
        notificationsMfe: 'http://localhost:5003/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5000,
    cors: true,
  },
  preview: {
    port: 5000,
    cors: true,
  },
});
