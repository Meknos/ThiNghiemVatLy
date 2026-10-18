import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Trình duyệt gọi /api, Vite chuyển tiếp sang máy chủ AI (npm run server)
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
