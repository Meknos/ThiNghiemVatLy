// Cloudflare Pages Function: mọi yêu cầu /api/* chạy qua ứng dụng Hono dùng chung với máy chủ Node.
// Trang giao diện (thư mục dist) do Cloudflare Pages phục vụ trực tiếp.
import { handle } from 'hono/cloudflare-pages';
import { createApp, rateLimitFromEnv } from '../../server/app';
import { AiEnv, ResilientProvider } from '../../server/provider';

// Biến môi trường và khóa bí mật đặt trong trang quản lý Cloudflare (Settings → Variables and Secrets)
let cached: { env: AiEnv; provider: ResilientProvider } | null = null;

const app = createApp({
  getProvider: (c) => {
    const env = c.env as AiEnv;
    if (!cached || cached.env !== env) cached = { env, provider: new ResilientProvider(env) };
    return cached.provider;
  },
  rateLimit: (c) => rateLimitFromEnv((c.env as AiEnv).AIPLAB_RATE_LIMIT)
});

export const onRequest = handle(app);
