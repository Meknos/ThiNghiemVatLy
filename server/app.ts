import { Hono, type Context } from 'hono';
import type { AiProvider } from './provider';

const MAX_PROMPT_LENGTH = 2000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_RATE_LIMIT = 30; // lượt hỏi AI mỗi 10 phút cho một địa chỉ IP

interface ProviderInfo extends AiProvider {
  usingAi: boolean;
  description: string;
}

/**
 * Giới hạn số lượt hỏi AI theo địa chỉ IP, để khóa API không bị dùng cạn khi trang web để công khai.
 * Đếm trong bộ nhớ: trên Cloudflare mỗi máy chủ biên đếm riêng, nên đây là giới hạn gần đúng.
 * Cả trường dùng chung một đường mạng thì chung một IP, nên mức mặc định để rộng rãi.
 */
export function createRateLimiter(limit: number, windowMs = RATE_WINDOW_MS, now = () => Date.now()) {
  const hits = new Map<string, number[]>();
  return (key: string): { ok: boolean; retryAfterSec: number } => {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.ceil((windowMs - (t - recent[0])) / 1000) };
    }
    recent.push(t);
    hits.set(key, recent);
    // Dọn bớt các IP cũ để bộ nhớ không phình ra
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (!v.some((x) => t - x < windowMs)) hits.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  };
}

function clientIp(c: Context): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

/**
 * Ứng dụng API dùng chung cho máy chủ Node (server/index.ts) và Cloudflare Pages Functions
 * (functions/api/[[route]].ts). Mỗi nơi tự cung cấp nhà cung cấp AI theo cấu hình của mình.
 */
export function createApp(options: {
  getProvider: (c: Context) => ProviderInfo;
  rateLimit?: (c: Context) => number;
}) {
  const app = new Hono();
  let limiter: ReturnType<typeof createRateLimiter> | null = null;

  app.get('/api/trang-thai', (c) => {
    const provider = options.getProvider(c);
    return c.json({ ai: provider.usingAi ? 'model' : 'keyword', mode: provider.description });
  });

  app.post('/api/tao-thi-nghiem', async (c) => {
    limiter ??= createRateLimiter(options.rateLimit?.(c) ?? DEFAULT_RATE_LIMIT);
    const { ok, retryAfterSec } = limiter(clientIp(c));
    if (!ok) {
      c.header('Retry-After', String(retryAfterSec));
      return c.json({ error: `Đã hỏi AI quá nhiều lần, hãy thử lại sau khoảng ${Math.ceil(retryAfterSec / 60)} phút.` }, 429);
    }

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Yêu cầu không phải JSON hợp lệ.' }, 400);
    }

    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return c.json({ error: 'Thiếu nội dung đề bài.' }, 400);
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json({ error: `Đề bài dài quá ${MAX_PROMPT_LENGTH} ký tự.` }, 400);
    }

    return c.json(await options.getProvider(c).extractExperiment(prompt));
  });

  return app;
}

/** Đọc mức giới hạn từ biến môi trường AIPLAB_RATE_LIMIT (số lượt mỗi 10 phút). */
export function rateLimitFromEnv(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE_LIMIT;
}
