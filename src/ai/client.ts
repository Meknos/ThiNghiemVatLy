import { dispatchContextToTemplate } from './dispatcher';

export interface ExperimentRequestResult {
  status: 'success' | 'unsupported';
  /** 'ai': AI đã đọc đề. 'keyword': máy chủ chỉ dò từ khóa. 'offline': không gọi được máy chủ, dò từ khóa ngay trên trình duyệt. */
  source: 'ai' | 'keyword' | 'offline';
  templateId: string;
  params: Record<string, number>;
  asks: string[];
  summary: string;
  suggestedTemplateId?: string;
  notes: string[];
}

const TIMEOUT_MS = 90_000; // máy chủ có thể phải hỏi AI hai lần

/** Gửi đề bài lên máy chủ AI; nếu không gọi được thì dò từ khóa tại chỗ để giáo viên vẫn dùng được. */
export async function requestExperiment(prompt: string): Promise<ExperimentRequestResult> {
  let reason = 'Không kết nối được máy chủ AI nên chỉ dò từ khóa trong đề bài.';
  try {
    const res = await fetch('/api/tao-thi-nghiem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const data = await res.json();
    if (res.status === 429) reason = `${data?.error ?? 'Đã hỏi AI quá nhiều lần.'} Tạm dò từ khóa trong đề bài.`;
    if (!res.ok) throw new Error(data?.error || `Máy chủ trả về lỗi ${res.status}`);
    return data as ExperimentRequestResult;
  } catch {
    const local = dispatchContextToTemplate(prompt);
    return {
      status: 'success',
      source: 'offline',
      templateId: local.templateId,
      params: local.extractedParams ?? {},
      asks: [],
      summary: local.message,
      notes: [reason]
    };
  }
}
