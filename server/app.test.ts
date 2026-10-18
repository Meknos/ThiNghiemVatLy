import { describe, expect, it } from 'vitest';
import { createApp, createRateLimiter, rateLimitFromEnv } from './app';

const fakeProvider = {
  usingAi: false,
  description: 'dò từ khóa',
  extractExperiment: async () => ({ status: 'success' as const, source: 'keyword' as const, templateId: 'toc-do', params: {}, asks: [], summary: '', notes: [] })
};

const post = (app: ReturnType<typeof createApp>, prompt: unknown, ip = '1.2.3.4') =>
  app.request('/api/tao-thi-nghiem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify({ prompt })
  });

describe('API tạo thí nghiệm', () => {
  it('trả kết quả của nhà cung cấp AI', async () => {
    const app = createApp({ getProvider: () => fakeProvider });
    const res = await post(app, 'Một học sinh đi 1,5 km trong 5 phút');
    expect(res.status).toBe(200);
    expect((await res.json()).templateId).toBe('toc-do');
  });

  it('từ chối đề rỗng hoặc quá dài', async () => {
    const app = createApp({ getProvider: () => fakeProvider });
    expect((await post(app, '   ')).status).toBe(400);
    expect((await post(app, 'a'.repeat(2001))).status).toBe(400);
  });

  it('chặn khi một IP hỏi quá số lượt cho phép, IP khác vẫn hỏi được', async () => {
    const app = createApp({ getProvider: () => fakeProvider, rateLimit: () => 2 });
    expect((await post(app, 'đề 1')).status).toBe(200);
    expect((await post(app, 'đề 2')).status).toBe(200);
    const blocked = await post(app, 'đề 3');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect((await post(app, 'đề 1', '5.6.7.8')).status).toBe(200);
  });
});

describe('Bộ đếm giới hạn lượt hỏi', () => {
  it('mở lại sau khi hết khoảng thời gian đếm', () => {
    let t = 0;
    const limit = createRateLimiter(1, 1000, () => t);
    expect(limit('a').ok).toBe(true);
    expect(limit('a').ok).toBe(false);
    t = 1001;
    expect(limit('a').ok).toBe(true);
  });

  it('đọc mức giới hạn từ biến môi trường, sai thì dùng mặc định', () => {
    expect(rateLimitFromEnv('50')).toBe(50);
    expect(rateLimitFromEnv('abc')).toBe(30);
    expect(rateLimitFromEnv(undefined)).toBe(30);
  });
});
