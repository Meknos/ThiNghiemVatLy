import { FormulaDef, FormulaFactor, FormulaVar } from './formulas';

type Values = Record<string, number>;

/** Thứ tự các đại lượng của một công thức: đại lượng ở vế trái trước, rồi tới các thừa số. */
export function variablesOf(def: FormulaDef): FormulaVar[] {
  return [def.target, ...def.factors];
}

/** Một số hạng của biểu thức dạng tổng: coef × var^power. */
interface SumTerm {
  coef: number;
  v: FormulaVar;
}

export interface FormulaSolution {
  def: FormulaDef;
  unknown: FormulaVar;
  /** Giá trị mọi đại lượng theo đơn vị của thanh trượt, trong đó đại lượng cần tìm đã được tính ra */
  values: Values;
  /** Giá trị mọi đại lượng đổi ra đơn vị SI, dùng ở bước thay số */
  si: Values;
  /** Dạng tích: unknown = constant × Π known^power */
  constant: number;
  powers: { v: FormulaVar; power: number }[];
  /** Dạng tổng: unknown^p = c0 + Σ coef × known^p, chia cho `divisor` */
  sum?: { terms: SumTerm[]; c0: number; divisor: number };
}

const exponent = (f: FormulaFactor) => f.exp ?? 1;
const weight = (f: FormulaFactor) => f.weight ?? 1;
const scaleOf = (v: FormulaVar) => v.scale ?? 1;

/**
 * Tính đại lượng thứ `find` (1 = vế trái, 2.. = các thừa số) từ các đại lượng còn lại.
 * Mọi phép tính làm bằng đơn vị SI rồi đổi đáp số về đơn vị của thanh trượt.
 */
export function solveFormula(def: FormulaDef, input: Values, find: number): FormulaSolution {
  const vars = variablesOf(def);
  const index = Math.min(vars.length, Math.max(1, Math.round(find || 1))) - 1;
  const unknown = vars[index];

  const si: Values = {};
  for (const v of vars) si[v.key] = input[v.key] * scaleOf(v);

  let constant = 1;
  let powers: { v: FormulaVar; power: number }[] = [];
  let sum: FormulaSolution['sum'];
  let value: number;

  if (def.kind === 'sum') {
    // target^p = offset + Σ w·x^p. Với thừa số x_j: x_j^p = (target^p − offset − Σ_{i≠j} w·x^p) / w_j
    const p = def.power;
    const offset = def.offset ?? 0;
    let terms: SumTerm[];
    let c0: number;
    let divisor: number;
    if (index === 0) {
      terms = def.factors.map((f) => ({ coef: weight(f), v: f }));
      c0 = offset;
      divisor = 1;
    } else {
      terms = [{ coef: 1, v: def.target }, ...def.factors.filter((_, k) => k !== index - 1).map((f) => ({ coef: -weight(f), v: f }))];
      c0 = -offset;
      divisor = weight(def.factors[index - 1]);
    }
    let acc = c0;
    for (const { coef, v } of terms) acc += coef * Math.pow(si[v.key], p);
    value = Math.pow(acc / divisor, 1 / p);
    sum = { terms, c0, divisor };
  } else if (def.kind === 'custom') {
    value = def.solve[unknown.key](si);
  } else {
    // target = coef × Π factor^exp, nên với một thừa số u có số mũ e:
    // u = (target / (coef × Π thừa số khác^exp))^(1/e)
    if (index === 0) {
      constant = def.coef;
      powers = def.factors.map((f) => ({ v: f, power: exponent(f) }));
    } else {
      const e = exponent(def.factors[index - 1]);
      constant = Math.pow(def.coef, -1 / e);
      powers = [
        { v: def.target, power: 1 / e },
        ...def.factors.filter((_, k) => k !== index - 1).map((f) => ({ v: f, power: -exponent(f) / e }))
      ];
    }
    value = constant;
    for (const { v, power } of powers) value *= Math.pow(si[v.key], power);
  }

  si[unknown.key] = value;
  return { def, unknown, values: { ...input, [unknown.key]: value / scaleOf(unknown) }, si, constant, powers, sum };
}

/** Số viết kiểu Việt Nam, gọn tới 4 chữ số có nghĩa. */
export function fmt(x: number): string {
  if (!Number.isFinite(x)) return '—';
  const rounded = Math.abs(x) >= 1000 ? Math.round(x * 10) / 10 : Number(x.toPrecision(4));
  return String(rounded).replace('.', ',');
}

/** Số viết trong LaTeX: số rất nhỏ hoặc rất lớn viết dạng a·10ⁿ, số âm đặt trong ngoặc. */
export function fmtLatex(x: number, wrapNegative = true): string {
  if (!Number.isFinite(x)) return '\\infty';
  const abs = Math.abs(x);
  let body: string;
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e7)) {
    const e = Math.floor(Math.log10(abs));
    const mantissa = Number((abs / Math.pow(10, e)).toPrecision(3));
    body = `${mantissa === 1 ? '' : `${String(mantissa).replace('.', '{,}')} \\cdot `}10^{${e}}`;
  } else {
    body = fmt(abs).replace(',', '{,}');
  }
  if (x >= 0) return body;
  return wrapNegative ? `(-${body})` : `-${body}`;
}

/**
 * Viết biểu thức của đại lượng cần tìm bằng LaTeX.
 * `show` quyết định mỗi đại lượng hiện ra là ký hiệu hay con số, để dùng chung cho
 * dòng "công thức" và dòng "thay số".
 */
export function expressionLatex(sol: FormulaSolution, show: (v: FormulaVar) => string): string {
  const { def } = sol;
  if (def.kind === 'custom') {
    const byKey = Object.fromEntries(variablesOf(def).map((v) => [v.key, v]));
    return def.rearranged[sol.unknown.key]((key) => show(byKey[key]));
  }
  if (def.kind === 'sum' && sol.sum) return sumLatex(def.power, sol.sum, show);
  return productLatex(sol, show);
}

function productLatex(sol: FormulaSolution, show: (v: FormulaVar) => string): string {
  // Số mũ lẻ một nửa (như khi tìm v từ động năng): đưa cả biểu thức vào trong căn
  const half = sol.powers.some(({ power }) => !Number.isInteger(power));
  const scale = half ? 2 : 1;
  const constant = half ? sol.constant * sol.constant : sol.constant;

  const term = (v: FormulaVar, p: number) => (p === 1 ? show(v) : `${show(v)}^{${p}}`);
  const top = sol.powers.filter(({ power }) => power > 0).map(({ v, power }) => term(v, power * scale));
  const bottom = sol.powers.filter(({ power }) => power < 0).map(({ v, power }) => term(v, -power * scale));

  // Hằng số: 10 đứng trên tử, 1/10 thành 10 dưới mẫu
  if (Math.abs(constant - 1) > 1e-9) {
    if (constant >= 1) top.unshift(fmtLatex(constant));
    else bottom.unshift(fmtLatex(1 / constant));
  }

  const numerator = top.length ? top.join(' \\cdot ') : '1';
  const body = bottom.length ? `\\frac{${numerator}}{${bottom.join(' \\cdot ')}}` : numerator;
  return half ? `\\sqrt{${body}}` : body;
}

/** Ghép các số hạng có dấu thành một tổng: số hạng dương đứng trước. */
function joinSigned(parts: { sign: number; text: string }[]): string {
  const sorted = [...parts.filter((x) => x.sign > 0), ...parts.filter((x) => x.sign < 0)];
  return sorted.map((x, k) => (x.sign < 0 ? `- ${x.text}` : k === 0 ? x.text : `+ ${x.text}`)).join(' ');
}

function sumLatex(p: 1 | -1, sum: NonNullable<FormulaSolution['sum']>, show: (v: FormulaVar) => string): string {
  let { terms, c0, divisor } = sum;
  // Chia cho hệ số âm: đổi dấu cả tử để mẫu luôn dương
  if (divisor < 0) {
    terms = terms.map((t) => ({ ...t, coef: -t.coef }));
    c0 = -c0;
    divisor = -divisor;
  }

  if (p === 1) {
    const parts = terms.map(({ coef, v }) => ({
      sign: Math.sign(coef),
      text: Math.abs(Math.abs(coef) - 1) < 1e-9 ? show(v) : `${fmtLatex(Math.abs(coef))} \\cdot ${show(v)}`
    }));
    if (Math.abs(c0) > 1e-12) parts.push({ sign: Math.sign(c0), text: fmtLatex(Math.abs(c0)) });
    const body = joinSigned(parts);
    return Math.abs(divisor - 1) < 1e-9 ? body : `\\frac{${body}}{${fmtLatex(divisor)}}`;
  }

  // p = −1: unknown = 1 / (Σ coef / x). Hai số hạng hệ số ±1 thì viết gọn x·y / (±y ± x)
  const unit = terms.every(({ coef }) => Math.abs(Math.abs(coef / divisor) - 1) < 1e-9);
  if (terms.length === 2 && unit && Math.abs(c0) < 1e-12) {
    const [a, b] = [...terms].sort((x, y) => y.coef - x.coef);
    const denominator = joinSigned([
      { sign: Math.sign(a.coef), text: show(b.v) },
      { sign: Math.sign(b.coef), text: show(a.v) }
    ]);
    return `\\frac{${show(a.v)} \\cdot ${show(b.v)}}{${denominator}}`;
  }
  const parts = terms.map(({ coef, v }) => ({
    sign: Math.sign(coef),
    text: `\\frac{${fmtLatex(Math.abs(coef / divisor))}}{${show(v)}}`
  }));
  return `\\frac{1}{${joinSigned(parts)}}`;
}

/**
 * Đại lượng cần tìm thay đổi thế nào khi tăng đại lượng `xKey`: với dạng tích là đúng số mũ,
 * với các dạng khác chỉ xét chiều biến thiên (±0,5 nghĩa là "tăng" hoặc "giảm").
 */
export function relationPower(sol: FormulaSolution, xKey: string, find: number): number {
  const exact = sol.powers.find((p) => p.v.key === xKey);
  if (exact) return exact.power;
  const x = sol.values[xKey];
  const dx = Math.max(Math.abs(x) * 0.01, 1e-6);
  const y0 = sol.values[sol.unknown.key];
  const y1 = solveFormula(sol.def, { ...sol.values, [xKey]: x + dx }, find).values[sol.unknown.key];
  return y1 >= y0 ? 0.5 : -0.5;
}

/** Quan hệ giữa đại lượng cần tìm và một đại lượng đã biết, nói theo cách của sách giáo khoa. */
export function relationText(power: number): string {
  if (power === 1) return 'tỉ lệ thuận với';
  if (power === -1) return 'tỉ lệ nghịch với';
  if (power === 2) return 'tỉ lệ thuận với bình phương của';
  if (power > 0) return 'tăng khi tăng';
  return 'giảm khi tăng';
}

/** Nhận xét kết quả: nhận xét riêng của công thức, hoặc cảnh báo đáp số âm, vô hạn. */
export function interpretSolution(sol: FormulaSolution): string | null {
  const own = sol.def.interpret?.(sol.values);
  if (own) return own;
  const answer = sol.values[sol.unknown.key];
  if (!Number.isFinite(answer)) return 'Số liệu đã cho không tính được đại lượng này (phép chia cho 0).';
  if (answer < 0 && sol.unknown.min >= 0) return 'Đáp số âm: số liệu đã cho không phù hợp với hiện tượng, hãy kiểm tra lại đề.';
  return null;
}
