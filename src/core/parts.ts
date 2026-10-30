import { ExperimentTemplate, ParamDef } from './types';
import { getExperimentById } from './registry';
import { convertUnit, extractFormulaParams, normalizeText } from '../ai/extract';
import { dispatchContextToTemplate } from '../ai/dispatcher';
import { FORMULAS } from '../experiments/cong-thuc/formulas';

/**
 * Một đề bài có thể hỏi nhiều câu ("Tính công và công suất"). Mỗi câu là một phần,
 * dựng bằng một mẫu thí nghiệm; phần sau có thể lấy kết quả của phần trước làm số liệu.
 */
export interface ProblemPart {
  templateId: string;
  /** Nhãn ngắn hiển thị trên thanh chuyển câu, ví dụ "Tính công suất 𝒫" */
  title: string;
  /** Số liệu đề cho trực tiếp, đã đổi về đơn vị của mẫu */
  params: Record<string, number>;
  /** Tham số lấy từ kết quả của phần trước: tên tham số → phần nguồn (đếm từ 0) và đại lượng ở phần đó */
  links: Record<string, { from: number; quantity: string }>;
  /** Tham số đề không cho nhưng cần để dựng thí nghiệm: giáo viên tự nhập hoặc dùng giá trị ngẫu nhiên */
  missing: string[];
  asks: string[];
}

/** Mẫu công thức: có tham số "find" và các đại lượng xếp theo thứ tự 1, 2, 3... */
export const isFormulaTemplate = (t: ExperimentTemplate<any>) => 'find' in t.params;

/** Tham số lựa chọn đánh số (cách mắc, chiều truyền, bài thí nghiệm...), không phải đại lượng đo. */
export const isChoiceParam = (def: ParamDef) => !def.unit && Number.isInteger(def.min) && def.step >= 1 && def.max - def.min <= 5;

/**
 * Các đại lượng mẫu công thức cần mà đề chưa cho: mọi đại lượng trừ đại lượng cần tìm,
 * đại lượng đề đã cho và đại lượng lấy từ câu trước.
 */
export function formulaMissing(template: ExperimentTemplate<any>, params: Record<string, number>, linked: string[] = []): string[] {
  if (!isFormulaTemplate(template)) return [];
  const vars = Object.keys(template.params).filter((k) => k !== 'find');
  const find = Math.min(vars.length, Math.max(1, Math.round(params.find ?? 1)));
  return vars.filter((k, i) => i + 1 !== find && params[k] === undefined && !linked.includes(k));
}

/**
 * Giá trị gợi ý cho một số liệu đề không cho: số "đẹp" (2 chữ số có nghĩa) quanh giá trị mặc định
 * của thanh trượt, nằm trong khoảng cho phép. `rand` thay được để kiểm thử.
 */
export function suggestValue(def: ParamDef, rand: () => number = Math.random): number {
  const step = def.step > 0 ? def.step : 1;
  const clamp = (x: number) => Math.min(def.max, Math.max(def.min, x));
  const snap = (x: number) => Number((Math.round(x / step) * step).toFixed(6));

  if (isChoiceParam(def)) return def.min + Math.floor(rand() * (def.max - def.min + 1));

  let value: number;
  if (def.defaultVal > 0) {
    // Từ một nửa tới gấp đôi giá trị mặc định
    value = def.defaultVal * Math.pow(2, rand() * 2 - 1);
    value = Number(value.toPrecision(2));
  } else {
    value = def.min + rand() * (def.max - def.min);
  }
  value = clamp(snap(value));
  // Làm tròn theo bước có thể ra 0 với đại lượng nhỏ: lấy giá trị mặc định cho chắc
  return value === 0 && def.min > 0 ? def.defaultVal : value;
}

/** Giá trị và đơn vị của một đại lượng sau khi chạy thí nghiệm: tìm trong kết quả, rồi trong tham số. */
export function quantityOf(
  template: ExperimentTemplate<any>,
  values: Record<string, number>,
  name: string
): { value: number; unit: string } | undefined {
  let outputs: Record<string, number> = {};
  try {
    outputs = template.compute(values);
  } catch {
    // giữ rỗng, thử tìm trong tham số
  }
  const def = template.params[name] as ParamDef | undefined;
  const out = template.outputs.find((o) => o.symbol === name || o.symbol === def?.symbol);
  const fromOutput = outputs[name] ?? (def ? outputs[def.symbol] : undefined);
  if (fromOutput !== undefined && Number.isFinite(fromOutput)) return { value: fromOutput, unit: def?.unit ?? out?.unit ?? '' };
  if (def && values[name] !== undefined) return { value: values[name], unit: def.unit };
  return undefined;
}

/** Bộ tham số đầy đủ của một mẫu: mặc định, rồi số liệu đã có. */
export function withDefaults(template: ExperimentTemplate<any>, params: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, def] of Object.entries(template.params) as [string, ParamDef][]) out[key] = params[key] ?? def.defaultVal;
  return out;
}

/**
 * Tham số của phần `index`: số liệu hiện tại của phần đó (giáo viên có thể đã chỉnh),
 * rồi ghi đè các tham số liên kết bằng kết quả mới nhất của các phần trước.
 */
export function resolvePartParams(
  parts: ProblemPart[],
  current: (Record<string, number> | undefined)[],
  index: number,
  seen: Set<number> = new Set()
): Record<string, number> {
  const part = parts[index];
  const template = getExperimentById(part.templateId);
  if (!template) return { ...part.params };
  const values = withDefaults(template, current[index] ?? part.params);
  if (seen.has(index)) return values; // phòng liên kết vòng
  seen.add(index);

  for (const [key, link] of Object.entries(part.links)) {
    const source = parts[link.from];
    const sourceTemplate = source && getExperimentById(source.templateId);
    if (!sourceTemplate || link.from >= index) continue;
    const q = quantityOf(sourceTemplate, resolvePartParams(parts, current, link.from, seen), link.quantity);
    const def = template.params[key] as ParamDef | undefined;
    if (!q || !def) continue;
    values[key] = Number(convertUnit(q.value, q.unit, def.unit).toPrecision(10));
  }
  return values;
}

/**
 * Số liệu thiếu khi chỉ dò từ khóa (không có AI): mẫu công thức thiếu đại lượng nào thì hỏi đại lượng đó;
 * mẫu trực quan thì hỏi các đại lượng đo (có đơn vị) chưa trích được. Phòng thí nghiệm lực và chuyển động
 * tự có số liệu cho từng bài nên không hỏi.
 */
export function keywordMissing(template: ExperimentTemplate<any> | undefined, params: Record<string, number>): string[] {
  if (!template) return [];
  if (isFormulaTemplate(template)) return formulaMissing(template, params);
  if (template.id === 'luc-va-chuyen-dong') return [];
  return (Object.entries(template.params) as [string, ParamDef][])
    .filter(([key, def]) => params[key] === undefined && !isChoiceParam(def))
    .map(([key]) => key);
}

/**
 * Dạng đề nhiều câu hay gặp mà dò từ khóa nhận được: câu trước tính ra đại lượng câu sau cần.
 * Mỗi dòng: điều kiện, các mẫu theo thứ tự, liên kết của từng câu.
 */
const KEYWORD_CHAINS: { match: RegExp; steps: { templateId: string; links?: ProblemPart['links'] }[] }[] = [
  // "Công và công suất của người kéo", "tính công suất và công" (đề chỉ hỏi công suất thì không tách)
  {
    match: /\bcông\b(?! suất)[^.?!,;\d]{0,30}\bvà\s+công suất|công suất[^.?!,;\d]{0,30}\bvà\s+công\b(?! suất)/,
    steps: [{ templateId: 'cong-co-hoc' }, { templateId: 'cong-suat', links: { A: { from: 0, quantity: 'A' } } }]
  }
];

/** Đại lượng mà một câu dạng công thức tính ra (đại lượng thứ `find`); mẫu trực quan thì không có. */
export function unknownOf(template: ExperimentTemplate<any>, params: Record<string, number>): string | undefined {
  if (!isFormulaTemplate(template)) return undefined;
  const vars = Object.keys(template.params).filter((k) => k !== 'find');
  return vars[Math.min(vars.length, Math.max(1, Math.round(params.find ?? 1))) - 1];
}

/**
 * Tách đề có các câu con "a) ... b) ..." (hoặc "a. ...", "1) ...", "Câu a) ...") thành phần dữ kiện chung
 * và từng câu. Nhãn phải đi đúng thứ tự a, b, c... (hoặc 1, 2, 3...) và có ít nhất hai câu.
 */
export function splitSubQuestions(prompt: string): { stem: string; questions: { label: string; text: string }[] } | null {
  const MARKER = /(^|[\s.;:?!])(?:câu\s+)?([a-eA-E]\s*[).]|[1-5]\s*\))\s+/g;
  const found: { label: string; start: number; end: number }[] = [];
  for (const m of prompt.matchAll(MARKER)) {
    const label = m[2][0].toLowerCase();
    const expected = found.length === 0 ? null : String.fromCharCode(found[found.length - 1].label.charCodeAt(0) + 1);
    if (expected === null ? label !== 'a' && label !== '1' : label !== expected) continue;
    found.push({ label, start: m.index + m[1].length, end: m.index + m[0].length });
  }
  if (found.length < 2) return null;
  return {
    stem: prompt.slice(0, found[0].start).trim(),
    questions: found.map((f, k) => ({ label: f.label, text: prompt.slice(f.end, found[k + 1]?.start ?? prompt.length).trim() }))
  };
}

/** Một câu dò từ khóa: chọn mẫu và trích số liệu; null khi đề thuộc chủ đề chưa hỗ trợ. */
function singlePart(prompt: string, title?: string, dispatch = dispatchContextToTemplate(prompt)): ProblemPart | null {
  const template = getExperimentById(dispatch.templateId);
  if (!template) return null;
  const params = dispatch.extractedParams ?? {};
  return { templateId: template.id, title: title ?? template.title, params, links: {}, missing: keywordMissing(template, params), asks: [] };
}

const shorten = (s: string, max = 42) => {
  const t = s.replace(/[\s.;:?!]+$/, '');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/** Đề có câu a), b), c): dò từng câu kèm dữ kiện chung, câu sau lấy kết quả câu trước khi còn thiếu. */
function subQuestionParts(prompt: string): ProblemPart[] | null {
  const split = splitSubQuestions(prompt);
  if (!split) return null;
  const parts: ProblemPart[] = [];
  for (const q of split.questions) {
    // Nhắc tên (không kèm số) các đại lượng câu trước đã tính, để chọn đúng mẫu: "tính điện trở"
    // sau khi đã có cường độ dòng điện thì là bài định luật Ôm tìm R
    const known = parts.flatMap((p) => {
      const t = getExperimentById(p.templateId)!;
      const key = unknownOf(t, p.params);
      return key ? [(t.params[key] as ParamDef).label.toLowerCase()] : [];
    });
    const text = `${split.stem} ${q.text}${known.length ? ` Đã biết ${known.join(', ')} từ câu trước.` : ''}`;
    const part = singlePart(text, `Câu ${q.label}: ${shorten(q.text)}`);
    if (!part) continue;

    // Đại lượng còn thiếu mà một câu trước đã tính ra thì lấy kết quả của câu đó (câu gần nhất trước)
    for (const key of [...part.missing]) {
      for (let j = parts.length - 1; j >= 0; j--) {
        if (unknownOf(getExperimentById(parts[j].templateId)!, parts[j].params) === key) {
          part.links[key] = { from: j, quantity: key };
          part.missing = part.missing.filter((k) => k !== key);
          break;
        }
      }
    }
    parts.push(part);
  }
  return parts.length >= 2 ? parts : null;
}

/** Dò từ khóa (không có AI): tách đề thành các câu và tìm số liệu thiếu của từng câu. */
export function keywordParts(prompt: string): { parts: ProblemPart[]; message: string } {
  const sub = subQuestionParts(prompt);
  if (sub) return { parts: sub, message: `Nhận diện: đề có ${sub.length} câu hỏi` };

  const text = normalizeText(prompt);
  const chain = KEYWORD_CHAINS.find((c) => c.match.test(text));
  if (chain) {
    const parts = chain.steps.flatMap((step) => {
      const template = getExperimentById(step.templateId);
      const def = FORMULAS.find((f) => f.id === step.templateId);
      if (!template || !def) return [];
      const links = step.links ?? {};
      const params = extractFormulaParams(def, prompt);
      // Đại lượng lấy từ câu trước không phải số liệu của đề, và câu này hỏi đúng vế trái của công thức
      for (const key of Object.keys(links)) delete params[key];
      params.find = 1;
      return [{ templateId: template.id, title: template.title, params, links, missing: formulaMissing(template, params, Object.keys(links)), asks: [] }];
    });
    if (parts.length === chain.steps.length) {
      return { parts, message: `Nhận diện: đề có ${parts.length} câu (${parts.map((p) => p.title).join(', ')})` };
    }
  }

  // Một câu; chủ đề chưa hỗ trợ thì danh sách câu rỗng và lời nhắn nói rõ lý do
  const dispatch = dispatchContextToTemplate(prompt);
  const part = singlePart(prompt, undefined, dispatch);
  return { parts: part ? [part] : [], message: dispatch.message };
}
