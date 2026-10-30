import { ProblemPart, formulaMissing, keywordParts } from '../core/parts';
import { getExperimentById } from '../core/registry';

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
  /** Các câu hỏi của đề, mỗi câu một thí nghiệm (máy chủ bản cũ không gửi trường này) */
  parts?: ProblemPart[];
}

const TIMEOUT_MS = 90_000; // máy chủ có thể phải hỏi AI hai lần

/** Danh sách câu của kết quả; máy chủ bản cũ chỉ trả một mẫu thì dựng thành một câu. */
export function partsOf(res: ExperimentRequestResult): ProblemPart[] {
  if (res.parts?.length) return res.parts;
  const template = getExperimentById(res.templateId);
  if (!template) return [];
  return [{ templateId: template.id, title: template.title, params: res.params, links: {}, missing: formulaMissing(template, res.params), asks: res.asks }];
}

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
    const { parts, message } = keywordParts(prompt);
    return {
      status: parts.length ? 'success' : 'unsupported',
      source: 'offline',
      templateId: parts[0]?.templateId ?? '',
      params: parts[0]?.params ?? {},
      asks: [],
      summary: message,
      notes: [reason],
      parts
    };
  }
}
