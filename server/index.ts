import { serve } from '@hono/node-server';

// Nạp khóa API từ tệp .env (nếu có) trước khi tạo nhà cung cấp AI
try {
  process.loadEnvFile?.('.env');
} catch {
  // không có tệp .env: dùng biến môi trường sẵn có
}

const { getAiProvider } = await import('./provider');
const { createApp, rateLimitFromEnv } = await import('./app');

const app = createApp({
  getProvider: () => getAiProvider(),
  rateLimit: () => rateLimitFromEnv(process.env.AIPLAB_RATE_LIMIT)
});

const PORT = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port: PORT });
console.log(`AIPLab AI backend: http://localhost:${PORT} — chế độ: ${getAiProvider().description}`);
