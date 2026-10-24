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

  it('số liệu vượt giới hạn mẫu trực quan thì hỏi lại để chọn mẫu công thức chứa được số liệu', async () => {
    const mock = stubFetch(
      reply('{"status":"success","templateId":"ap-suat-chat-ran","params":{"m":34000,"S":15000},"asks":["áp suất p"],"summary":"Xe tăng"}'),
      reply('{"status":"success","templateId":"ap-suat","params":{"F":340000,"S":15000,"find":1},"asks":["áp suất p"],"summary":"Xe tăng"}')
    );
    const res = await make().extractExperiment('Một xe tăng có trọng lượng 340000 N, diện tích tiếp xúc 1,5 m². Tính áp suất.');
    expect(mock).toHaveBeenCalledTimes(2);
    expect(res).toMatchObject({ templateId: 'ap-suat', params: { F: 340000, S: 15000, find: 1 } });
    expect(res.notes).toEqual([]);
  });

  it('hỏi lại mà vẫn không có mẫu phù hợp thì giữ câu trả lời cũ và báo số bị đưa về biên', async () => {
    stubFetch(
      reply('{"status":"success","templateId":"ap-suat-chat-ran","params":{"m":500,"S":20},"asks":[],"summary":""}'),
      reply('{"status":"success","templateId":"ap-suat-chat-ran","params":{"m":500,"S":20},"asks":[],"summary":""}')
    );
    const res = await make().extractExperiment('đề');
    expect(res.templateId).toBe('ap-suat-chat-ran');
    expect(res.params.m).toBe(100);
    expect(res.notes.some((n) => n.includes('vượt quá'))).toBe(true);
  });

  it('AI đổi đơn vị sai (1,5 m² thành 1500 cm²) thì sửa theo số liệu trong đề và báo lại', async () => {
    stubFetch(reply('{"status":"success","templateId":"ap-suat","params":{"F":340000,"S":1500,"find":1},"asks":["áp suất p"],"summary":""}'));
    const res = await make().extractExperiment('Một xe tăng có trọng lượng 340000 N, diện tích tiếp xúc của các bản xích với mặt đất là 1,5 m². Tính áp suất của xe tăng lên mặt đất.');
    expect(res.params).toMatchObject({ F: 340000, S: 15000 });
    expect(res.notes.some((n) => n.includes('đổi đơn vị'))).toBe(true);
  });

  it('khác biệt không phải lũy thừa của 10 thì giữ số của AI (2 giờ 30 phút = 9000 s)', async () => {
    stubFetch(reply('{"status":"success","templateId":"toc-do","params":{"s":120000,"t":9000,"find":1},"asks":[],"summary":""}'));
    const res = await make().extractExperiment('Một ô tô đi quãng đường 120 km trong 2 giờ 30 phút. Tính tốc độ của ô tô ra km/h.');
    expect(res.params).toMatchObject({ s: 120000, t: 9000 });
    expect(res.notes).toEqual([]);
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
