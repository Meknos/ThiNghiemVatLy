import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatApiProvider } from './provider';

const make = (apiKey = 'k') => new ChatApiProvider({ baseUrl: 'https://ai.example.com/v1/', apiKey });

// Không gọi dịch vụ AI thật: thay fetch bằng bản giả để kiểm tra yêu cầu gửi đi và cách xử lý câu trả lời.

function reply(content: string, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }), { status });
}

function stubFetch(...responses: (Response | Error)[]) {
  const mock = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error('Không còn câu trả lời giả');
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => vi.unstubAllGlobals());

describe('ChatApiProvider', () => {
  it('gửi đúng địa chỉ, khóa, chế độ JSON và đề bài', async () => {
    const mock = stubFetch(reply('{"status":"success","templateId":"toc-do","params":{"s":1500,"t":300,"find":1},"asks":["tốc độ v"],"summary":"Tóm tắt"}'));
    await make('sk-test').extractExperiment('Một học sinh đi 1,5 km trong 5 phút');

    const [url, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://ai.example.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('qwen3.8-27b');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('JSON');
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Một học sinh đi 1,5 km trong 5 phút' });
  });

  it('dịch vụ không nhận tham số tắt suy nghĩ thì gửi lại không kèm tham số đó', async () => {
    const mock = stubFetch(
      new Response('{"error":"Unrecognized request argument supplied: chat_template_kwargs"}', { status: 400 }),
      reply('{"status":"success","templateId":"toc-do","params":{"find":1},"asks":[],"summary":""}')
    );
    const res = await make().extractExperiment('đề');
    expect(mock).toHaveBeenCalledTimes(2);
    const second = JSON.parse((mock.mock.calls[1] as unknown as [string, RequestInit])[1].body as string);
    expect(second.chat_template_kwargs).toBeUndefined();
    expect(res.templateId).toBe('toc-do');
  });

  it('nhận kết quả hợp lệ và giữ đúng tham số của mẫu', async () => {
    stubFetch(reply('{"status":"success","templateId":"toc-do","params":{"s":1500,"t":300,"find":1},"asks":["tốc độ v"],"summary":"Tóm tắt"}'));
    const res = await make().extractExperiment('đề');
    expect(res).toMatchObject({ status: 'success', source: 'ai', templateId: 'toc-do', params: { s: 1500, t: 300, find: 1 }, asks: ['tốc độ v'] });
    expect(res.notes).toEqual([]);
  });

  it('bỏ tham số lạ, đưa số ngoài khoảng về biên và báo lại', async () => {
    stubFetch(reply('{"status":"success","templateId":"ap-suat-chat-ran","params":{"m":2,"S":5000,"mau_sac":3},"asks":[],"summary":""}'));
    const res = await make().extractExperiment('đề');
    expect(res.params).toEqual({ m: 2, S: 1000 });
    expect(res.notes.some((n) => n.includes('mau_sac'))).toBe(true);
    expect(res.notes.some((n) => n.includes('vượt quá'))).toBe(true);
  });

  it('nhận cả số viết dưới dạng chuỗi', async () => {
    stubFetch(reply('{"status":"success","templateId":"dinh-luat-ohm","params":{"U":"12","R":"6"},"asks":[],"summary":""}'));
    const res = await make().extractExperiment('đề');
    expect(res.params).toEqual({ U: 12, R: 6 });
  });

  it('mã mẫu không có trong danh mục thì báo chưa hỗ trợ, không dựng bừa', async () => {
    stubFetch(reply('{"status":"success","templateId":"thau-kinh","params":{},"asks":[],"summary":"Bài thấu kính"}'));
    const res = await make().extractExperiment('đề');
    expect(res.status).toBe('unsupported');
    expect(res.templateId).toBe('');
  });

  it('đề ngoài danh mục: giữ lời giải thích và gợi ý mẫu gần nhất', async () => {
    stubFetch(reply('{"status":"unsupported","templateId":"phan-xa-anh-sang","params":{},"asks":[],"summary":"Chưa có mẫu thấu kính."}'));
    const res = await make().extractExperiment('đề');
    expect(res).toMatchObject({ status: 'unsupported', suggestedTemplateId: 'phan-xa-anh-sang', summary: 'Chưa có mẫu thấu kính.' });
  });

  it('câu trả lời rỗng hoặc hỏng thì hỏi lại đúng một lần', async () => {
    const mock = stubFetch(reply(''), reply('{"status":"success","templateId":"toc-do","params":{"find":1},"asks":[],"summary":""}'));
    const res = await make().extractExperiment('đề');
    expect(mock).toHaveBeenCalledTimes(2);
    expect(res.templateId).toBe('toc-do');
  });

  it('hỏng cả hai lần thì báo lỗi rõ ràng', async () => {
    stubFetch(reply('xin lỗi'), reply('vẫn không phải json'));
    await expect(make().extractExperiment('đề')).rejects.toMatchObject({ teacherMessage: 'AI trả lời không đúng khuôn dữ liệu.' });
  });

  it('nhận JSON bọc trong chữ thừa, khối mã hoặc sau phần suy nghĩ của mô hình', async () => {
    stubFetch(reply('<think>Đề hỏi tốc độ {v}...</think>\n```json\n{"status":"success","templateId":"toc-do","params":{"s":100,"t":20,"find":1},"asks":[],"summary":""}\n```'));
    const res = await make().extractExperiment('đề');
    expect(res).toMatchObject({ templateId: 'toc-do', params: { s: 100, t: 20, find: 1 } });
  });

  it('dịch vụ không hỗ trợ chế độ JSON thì gửi lại không kèm response_format', async () => {
    const mock = stubFetch(
      new Response('{"error":{"message":"response_format json_object is not supported"}}', { status: 400 }),
      reply('{"status":"success","templateId":"toc-do","params":{"find":1},"asks":[],"summary":""}')
    );
    const res = await make().extractExperiment('đề');
    expect(res.templateId).toBe('toc-do');
    const second = JSON.parse((mock.mock.calls[1] as unknown as [string, RequestInit])[1].body as string);
    expect(second.response_format).toBeUndefined();
  });

  it('không gửi khóa khi máy chủ chạy tại chỗ không cần khóa', async () => {
    const mock = stubFetch(reply('{"status":"success","templateId":"toc-do","params":{},"asks":[],"summary":""}'));
    await new ChatApiProvider({ baseUrl: 'http://localhost:11434/v1' }).extractExperiment('đề');
    const headers = (mock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('đổi mã lỗi của dịch vụ thành lời giải thích cho giáo viên', async () => {
    stubFetch(new Response('{}', { status: 401 }));
    await expect(make().extractExperiment('đề')).rejects.toMatchObject({ teacherMessage: 'Khóa API không hợp lệ với dịch vụ AI đang cấu hình.' });
    stubFetch(new Response('{}', { status: 404 }));
    await expect(make().extractExperiment('đề')).rejects.toMatchObject({ teacherMessage: expect.stringContaining('qwen3.8-27b') });
    stubFetch(new Response('{}', { status: 402 }));
    await expect(make().extractExperiment('đề')).rejects.toMatchObject({ teacherMessage: 'Tài khoản dịch vụ AI đã hết số dư.' });
    stubFetch(new Error('network down'));
    await expect(make().extractExperiment('đề')).rejects.toMatchObject({ teacherMessage: expect.stringContaining('Không kết nối được') });
  });
});
