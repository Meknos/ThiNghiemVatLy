import { z } from 'zod';
import { dispatchContextToTemplate } from '../src/ai/dispatcher';
import { getExperimentById } from '../src/core/registry';
import { validateParams } from '../src/core/validate';
import { buildSystemPrompt } from './prompt';

/** Kết quả trả về cho trình duyệt. */
export interface AiResponse {
  status: 'success' | 'unsupported';
  /** 'ai': mô hình ngôn ngữ đã đọc đề. 'keyword': chỉ dò từ khóa (chưa có khóa API hoặc gọi mô hình lỗi). */
  source: 'ai' | 'keyword';
  templateId: string;
  params: Record<string, number>;
  asks: string[];
  summary: string;
  suggestedTemplateId?: string;
  /** Ghi chú cho giáo viên: số liệu bị chỉnh về khoảng cho phép, lý do dùng dò từ khóa... */
  notes: string[];
}

export interface AiProvider {
  extractExperiment(prompt: string): Promise<AiResponse>;
}

/* ------------------------------------------------------------------
   Dò từ khóa: dùng khi chưa cấu hình khóa API hoặc mô hình không trả lời được
------------------------------------------------------------------ */

export class KeywordProvider implements AiProvider {
  constructor(private reason = 'Chưa cấu hình khóa API nên chỉ dò từ khóa trong đề bài.') {}

  async extractExperiment(prompt: string): Promise<AiResponse> {
    const dispatch = dispatchContextToTemplate(prompt);
    return finalize(
      { templateId: dispatch.templateId, params: dispatch.extractedParams ?? {}, asks: [], summary: dispatch.message },
      'keyword',
      [this.reason]
    );
  }
}

/* ------------------------------------------------------------------
   Mô hình ngôn ngữ qua API kiểu OpenAI (/chat/completions): đọc đề, chọn mẫu
   thí nghiệm và trích tham số, trả về JSON. Dùng được với mọi dịch vụ theo chuẩn này
   (DeepSeek, DashScope, OpenRouter, Ollama, LM Studio...), chọn bằng AI_BASE_URL.
------------------------------------------------------------------ */

// Mô hình trả JSON tự do (JSON mode không ép khuôn), nên mọi trường đều được kiểm tra lại ở đây
const ExtractionSchema = z.object({
  status: z.enum(['success', 'unsupported']).catch('success'),
  templateId: z.string(),
  params: z.record(z.string(), z.coerce.number()).catch({}),
  asks: z.array(z.string()).catch([]),
  summary: z.string().catch('')
});

type Extraction = z.infer<typeof ExtractionSchema>;

/** Lỗi khi gọi dịch vụ AI, kèm câu giải thích dành cho giáo viên. */
class AiCallError extends Error {
  constructor(public teacherMessage: string, detail: string) {
    super(detail);
  }
}

const REQUEST_TIMEOUT_MS = 40_000;

export const DEFAULT_MODEL = 'qwen3.8-27b';

export interface ChatApiConfig {
  baseUrl: string;
  /** Để trống với máy chủ chạy tại chỗ không cần khóa (Ollama, LM Studio) */
  apiKey?: string;
  model?: string;
  /** Cho mô hình "suy nghĩ" trước khi trả lời (chậm hơn). Mặc định tắt. */
  thinking?: boolean;
}

export class ChatApiProvider implements AiProvider {
  private baseUrl: string;
  private apiKey: string;
  readonly model: string;
  private system = buildSystemPrompt();
  /** Một số dịch vụ không nhận response_format; khi gặp lỗi đó thì thôi không gửi nữa */
  private jsonMode = true;
  /**
   * Tắt phần "suy nghĩ" của các mô hình Qwen3 (máy chủ kiểu vLLM/SGLang): việc chọn mẫu và điền số
   * không cần suy luận dài, tắt đi thì trả lời nhanh hơn hẳn. Dịch vụ không nhận tham số này thì bỏ.
   */
  private noThinking: boolean;

  constructor(config: ChatApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey ?? '';
    this.model = config.model || DEFAULT_MODEL;
    this.noThinking = !config.thinking;
  }

  /** Một lượt hỏi–đáp; trả về nội dung chữ của câu trả lời. */
  private async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
    const send = async () => {
      try {
        return await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            ...(this.jsonMode ? { response_format: { type: 'json_object' } } : {}),
            ...(this.noThinking ? { chat_template_kwargs: { enable_thinking: false } } : {}),
            max_tokens: 4000, // đủ rộng để JSON không bị cắt giữa chừng
            stream: false
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
      } catch (err) {
        throw new AiCallError('Không kết nối được tới dịch vụ AI (sai địa chỉ, mất mạng hoặc quá thời gian chờ).', String(err));
      }
    };

    let res = await send();
    let detail = res.ok ? '' : await res.text().catch(() => '');

    // Dịch vụ không nhận tham số tắt suy nghĩ: gửi lại không kèm tham số đó
    const rejectsThinkingFlag =
      /chat_template_kwargs|enable_thinking/i.test(detail) ||
      (/unrecognized|unknown|extra/i.test(detail) && !/response_format|json_object/i.test(detail));
    if (res.status === 400 && this.noThinking && rejectsThinkingFlag) {
      this.noThinking = false;
      res = await send();
      detail = res.ok ? '' : await res.text().catch(() => '');
    }

    // Dịch vụ không hỗ trợ chế độ JSON: gửi lại không kèm response_format, lời nhắc vẫn yêu cầu JSON
    if (res.status === 400 && this.jsonMode && /response_format|json_object/i.test(detail)) {
      this.jsonMode = false;
      res = await send();
      detail = res.ok ? '' : await res.text().catch(() => '');
    }

    if (!res.ok) {
      const teacherMessage =
        res.status === 401 || res.status === 403 ? 'Khóa API không hợp lệ với dịch vụ AI đang cấu hình.' :
        res.status === 402 ? 'Tài khoản dịch vụ AI đã hết số dư.' :
        res.status === 404 ? `Dịch vụ AI không có mô hình "${this.model}" hoặc sai địa chỉ AI_BASE_URL.` :
        res.status === 429 ? 'Dịch vụ AI đang giới hạn số lượt gọi, hãy thử lại sau ít phút.' :
        res.status >= 500 ? 'Máy chủ dịch vụ AI đang gặp sự cố.' :
        `Dịch vụ AI từ chối yêu cầu (mã ${res.status}).`;
      throw new AiCallError(teacherMessage, `HTTP ${res.status}: ${detail.slice(0, 500)}`);
    }

    const data: any = await res.json();
    return String(data?.choices?.[0]?.message?.content ?? '');
  }

  private parse(text: string): Extraction | null {
    // Bỏ phần suy nghĩ <think>…</think> và chữ thừa quanh JSON (một số mô hình bọc JSON trong ```json)
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const result = ExtractionSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  async extractExperiment(prompt: string): Promise<AiResponse> {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: this.system },
      { role: 'user', content: prompt }
    ];

    let text = await this.chat(messages);
    let parsed = this.parse(text);

    // Mô hình đôi khi trả nội dung rỗng hoặc JSON hỏng: hỏi lại đúng một lần
    if (!parsed) {
      text = await this.chat([
        ...messages,
        ...(text ? [{ role: 'assistant' as const, content: text }] : []),
        { role: 'user', content: 'Câu trả lời vừa rồi không phải JSON hợp lệ theo khuôn đã nêu. Hãy trả lại đúng một đối tượng JSON theo khuôn đó, không kèm chữ nào khác.' }
      ]);
      parsed = this.parse(text);
    }
    if (!parsed) {
      throw new AiCallError('AI trả lời không đúng khuôn dữ liệu.', `Nội dung nhận được: ${text.slice(0, 300)}`);
    }

    if (parsed.status === 'unsupported') {
      return {
        status: 'unsupported',
        source: 'ai',
        templateId: '',
        params: {},
        asks: parsed.asks,
        summary: parsed.summary,
        suggestedTemplateId: getExperimentById(parsed.templateId)?.id,
        notes: []
      };
    }
    return finalize(parsed, 'ai', []);
  }
}

/* ------------------------------------------------------------------
   Kiểm tra lại mọi tham số, dù đến từ mô hình hay từ dò từ khóa
------------------------------------------------------------------ */

function finalize(
  raw: { templateId: string; params: Record<string, number>; asks: string[]; summary: string },
  source: AiResponse['source'],
  notes: string[]
): AiResponse {
  const template = getExperimentById(raw.templateId);
  if (!template) {
    return { status: 'unsupported', source, templateId: '', params: {}, asks: raw.asks, summary: raw.summary, notes };
  }

  // Chỉ giữ tham số mà mẫu có; giá trị ngoài khoảng cho phép bị đưa về biên và báo lại
  const known: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw.params)) {
    if (template.params[key] && Number.isFinite(value)) known[key] = value;
    else notes.push(`Bỏ qua "${key}": mẫu thí nghiệm không có tham số này.`);
  }
  const defs: Record<string, any> = {};
  for (const key of Object.keys(known)) defs[key] = template.params[key];
  const checked = validateParams(defs, known);
  for (const message of Object.values(checked.errors)) {
    notes.push(`${message}. Thí nghiệm dùng giá trị ở biên nên kết quả không còn khớp hoàn toàn với đề.`);
  }

  return {
    status: 'success',
    source,
    templateId: template.id,
    params: checked.cleanedParams,
    asks: raw.asks,
    summary: raw.summary,
    notes
  };
}

/* ------------------------------------------------------------------
   Chọn nhà cung cấp
------------------------------------------------------------------ */

/**
 * Gọi dịch vụ AI khi đã cấu hình địa chỉ; mọi lỗi (khóa sai, hết số dư, mất mạng) đều rơi về
 * dò từ khóa để giáo viên vẫn dùng được, kèm ghi chú nói rõ lý do.
 */
/** Biến môi trường cấu hình AI: process.env khi chạy Node, c.env khi chạy trên Cloudflare. */
export type AiEnv = Record<string, string | undefined>;

export class ResilientProvider implements AiProvider {
  private ai: ChatApiProvider | null = null;
  private disabledReason: string | null = null;
  private baseUrl: string | undefined;

  constructor(env: AiEnv) {
    const baseUrl = env.AI_BASE_URL?.trim();
    const apiKey = (env.AI_API_KEY || env.DEEPSEEK_API_KEY)?.trim();
    this.baseUrl = baseUrl;
    if (env.AIPLAB_AI === 'off') {
      this.disabledReason = 'AI đang tắt (AIPLAB_AI=off) nên chỉ dò từ khóa trong đề bài.';
    } else if (!baseUrl) {
      this.disabledReason = 'Chưa cấu hình địa chỉ dịch vụ AI (AI_BASE_URL) nên chỉ dò từ khóa trong đề bài.';
    } else {
      this.ai = new ChatApiProvider({
        baseUrl,
        apiKey,
        model: env.AIPLAB_MODEL?.trim(),
        thinking: env.AIPLAB_THINKING === 'on'
      });
    }
  }

  get usingAi() {
    return this.ai !== null;
  }

  /** Mô tả ngắn cấu hình đang dùng, để in ra khi khởi động máy chủ */
  get description() {
    return this.ai ? `mô hình ${this.ai.model} tại ${this.baseUrl}` : 'dò từ khóa';
  }

  async extractExperiment(prompt: string): Promise<AiResponse> {
    if (!this.ai) return new KeywordProvider(this.disabledReason ?? undefined).extractExperiment(prompt);
    try {
      return await this.ai.extractExperiment(prompt);
    } catch (err) {
      console.error('[AI]', err);
      const reason = err instanceof AiCallError ? err.teacherMessage : 'AI gặp lỗi không rõ.';
      return new KeywordProvider(`${reason} Tạm dò từ khóa trong đề bài.`).extractExperiment(prompt);
    }
  }
}

let provider: ResilientProvider | null = null;

/** Nhà cung cấp dùng chung cho máy chủ Node, đọc cấu hình từ process.env. */
export function getAiProvider(): ResilientProvider {
  if (!provider) provider = new ResilientProvider(process.env);
  return provider;
}
