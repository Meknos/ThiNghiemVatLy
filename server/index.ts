import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { getAiProvider } from './provider';

const app = new Hono();

app.post('/api/tao-thi-nghiem', async (c) => {
  try {
    const body = await c.req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Thiếu trường prompt hợp lệ' }, 400);
    }

    const provider = getAiProvider();
    const result = await provider.extractExperiment(prompt);

    return c.json(result);
  } catch (err: any) {
    return c.json({ error: 'Lỗi xử lý AI: ' + err.message }, 500);
  }
});

const PORT = 3001;
console.log(`AIPLab AI Backend server running at http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
