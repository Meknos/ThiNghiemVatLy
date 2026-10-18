import { FormulaDef, FormulaVar } from '../experiments/cong-thuc/formulas';
import { variablesOf } from '../experiments/cong-thuc/model';

/**
 * Trích số liệu cho mẫu công thức từ đề bài, không cần AI: tìm các cặp "số + đơn vị",
 * đổi về đơn vị của từng đại lượng, rồi gán theo ký hiệu (R1 = 6 Ω), theo từ ngữ đứng trước
 * (tiêu cự 10 cm) hoặc theo thứ tự xuất hiện. Đại lượng duy nhất còn thiếu là đại lượng cần tìm.
 */

interface UnitDef {
  names: string[];
  dim: string;
  /** Giá trị SI của 1 đơn vị này */
  factor: number;
  /** Thang nhiệt độ có gốc khác 0 */
  offset?: number;
}

// Tên đơn vị viết thường, như trong đề bài sau khi đã chuẩn hóa
const UNITS: UnitDef[] = [
  { names: ['km/h', 'km/giờ'], dim: 'speed', factor: 1 / 3.6 },
  { names: ['m/s', 'm/giây'], dim: 'speed', factor: 1 },
  { names: ['km/s'], dim: 'speed', factor: 1000 },
  { names: ['kg/m3', 'kg/m³'], dim: 'density', factor: 1 },
  { names: ['g/cm3', 'g/cm³', 'g/ml'], dim: 'density', factor: 1000 },
  { names: ['n/m3', 'n/m³'], dim: 'weightDensity', factor: 1 },
  { names: ['n/m2', 'n/m²', 'pa', 'paxcan'], dim: 'pressure', factor: 1 },
  { names: ['kpa'], dim: 'pressure', factor: 1000 },
  { names: ['n/cm'], dim: 'stiffness', factor: 100 },
  { names: ['n/m'], dim: 'stiffness', factor: 1 },
  { names: ['j/kg.k', 'j/(kg.k)', 'j/kgk', 'j/kg·k', 'j/(kg·k)', 'j/kg.độ'], dim: 'specificHeat', factor: 1 },
  { names: ['mj/kg'], dim: 'heatValue', factor: 1e6 },
  { names: ['j/kg'], dim: 'heatValue', factor: 1 },
  { names: ['ω.m', 'ωm', 'ω·m', 'ôm.mét', 'ôm mét'], dim: 'resistivity', factor: 1 },
  { names: ['×10⁻⁸ ω·m'], dim: 'resistivity', factor: 1e-8 },
  { names: ['kwh', 'kw.h', 'kw·h', 'số điện'], dim: 'energy', factor: 3.6e6 },
  { names: ['mj'], dim: 'energy', factor: 1e6 },
  { names: ['kj'], dim: 'energy', factor: 1000 },
  { names: ['j', 'jun'], dim: 'energy', factor: 1 },
  { names: ['mw'], dim: 'power', factor: 1e6 },
  { names: ['kw'], dim: 'power', factor: 1000 },
  { names: ['w', 'oát'], dim: 'power', factor: 1 },
  { names: ['kv'], dim: 'voltage', factor: 1000 },
  { names: ['v', 'vôn'], dim: 'voltage', factor: 1 },
  { names: ['ma'], dim: 'current', factor: 0.001 },
  { names: ['a', 'ampe'], dim: 'current', factor: 1 },
  { names: ['kω', 'kôm'], dim: 'resistance', factor: 1000 },
  { names: ['ω', 'ôm', 'ohm'], dim: 'resistance', factor: 1 },
  { names: ['khz'], dim: 'frequency', factor: 1000 },
  { names: ['hz', 'héc'], dim: 'frequency', factor: 1 },
  { names: ['°c', 'độ c', 'oc'], dim: 'temperature', factor: 1 },
  { names: ['°f', 'độ f', 'of'], dim: 'temperature', factor: 5 / 9, offset: -32 },
  { names: ['k', 'kelvin'], dim: 'temperature', factor: 1, offset: -273 },
  { names: ['cm2', 'cm²'], dim: 'area', factor: 1e-4 },
  { names: ['mm2', 'mm²'], dim: 'area', factor: 1e-6 },
  { names: ['dm2', 'dm²'], dim: 'area', factor: 1e-2 },
  { names: ['m2', 'm²'], dim: 'area', factor: 1 },
  { names: ['cm3', 'cm³', 'ml', 'cc'], dim: 'volume', factor: 1e-6 },
  { names: ['dm3', 'dm³', 'lít', 'lit', 'l'], dim: 'volume', factor: 1e-3 },
  { names: ['m3', 'm³'], dim: 'volume', factor: 1 },
  { names: ['km'], dim: 'length', factor: 1000 },
  { names: ['dm'], dim: 'length', factor: 0.1 },
  { names: ['cm'], dim: 'length', factor: 0.01 },
  { names: ['mm'], dim: 'length', factor: 0.001 },
  { names: ['m', 'mét'], dim: 'length', factor: 1 },
  { names: ['giờ', 'h', 'tiếng'], dim: 'time', factor: 3600 },
  { names: ['phút', 'ph'], dim: 'time', factor: 60 },
  { names: ['s', 'giây'], dim: 'time', factor: 1 },
  { names: ['tấn'], dim: 'mass', factor: 1000 },
  { names: ['tạ'], dim: 'mass', factor: 100 },
  { names: ['kg', 'kilôgam', 'ki-lô-gam'], dim: 'mass', factor: 1 },
  { names: ['g', 'gam'], dim: 'mass', factor: 0.001 },
  { names: ['n', 'niutơn', 'newton'], dim: 'force', factor: 1 },
  { names: ['n.m', 'n·m'], dim: 'torque', factor: 1 },
  { names: ['%', 'phần trăm'], dim: 'percent', factor: 1 },
  { names: ['vòng'], dim: 'turns', factor: 1 },
  { names: ['dao động'], dim: 'oscillations', factor: 1 },
  { names: ['×', 'x', 'lần'], dim: 'magnification', factor: 1 }
];

/** Đơn vị của thanh trượt có thể không ghi trong bảng (ví dụ °F của thang đo); tra theo tên. */
const unitOf = (name: string): UnitDef | undefined => {
  const n = name.toLowerCase();
  return UNITS.find((u) => u.names.includes(n));
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const UNIT_ALTERNATION = UNITS.flatMap((u) => u.names)
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join('|');

// Số: 12 | 1,5 | 1.5 | 36 000 | 2.500 (phân cách nghìn) | 1,7.10^-8
const NUM = '(-?[1-9]\\d{0,2}(?:[ .]\\d{3})+(?![.,]\\d)|-?\\d+(?:[.,]\\d+)?)(?:\\s*(?:\\.|×|x|\\*|·)\\s*10\\^\\(?(-?\\d+)\\)?)?';
const UNIT_TAIL = `(?:\\s*(${UNIT_ALTERNATION}))?(?![a-zà-ỹđ0-9²³/])`;
const QUANTITY = new RegExp(`${NUM}${UNIT_TAIL}`, 'g');

function parseNumber(raw: string, pow?: string): number {
  // "36 000" và "2.500" là phân cách hàng nghìn; "1,5" và "1.5" là số thập phân
  const thousands = /^-?[1-9]\d{0,2}(?:[ .]\d{3})+$/.test(raw);
  const n = thousands ? Number(raw.replace(/[ .]/g, '')) : Number(raw.replace(',', '.'));
  return pow !== undefined ? n * Math.pow(10, Number(pow)) : n;
}

interface Quantity {
  index: number;
  end: number;
  value: number;
  unit?: UnitDef;
  used: boolean;
}

/** Chuẩn hóa đề: chữ thường, chỉ số dưới, lũy thừa của 10, dấu trừ. */
/**
 * Đề chép từ tài liệu hay có công thức LaTeX: "\(40^\circ\)", "\(G_1\)", "\frac{1}{2}".
 * Đổi về chữ thường gặp để phần dò số liệu đọc được: 40°, G1, 1/2.
 */
export function stripLatex(text: string): string {
  return text
    .replace(/\\[()[\]]/g, ' ')
    .replace(/\$+/g, ' ')
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√$1')
    .replace(/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\(?:cdot|times)/g, '·')
    .replace(/_\{([^{}]*)\}/g, '$1')
    .replace(/_(\w)/g, '$1')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[{}]/g, '');
}

export function normalizeText(text: string): string {
  const sub: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const sup: Record<string, string> = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  return stripLatex(text)
    .toLowerCase()
    .normalize('NFC')
    .replace(/[₀-₉]/g, (c) => sub[c])
    .replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, e: string) => `10^${e.split('').map((c) => sup[c]).join('')}`)
    .replace(/[−–]/g, '-')
    .replace(/(\d)\s*º/g, '$1°')
    .replace(/Ω/gi, 'ω');
}

function findQuantities(text: string): Quantity[] {
  const out: Quantity[] = [];
  for (const m of text.matchAll(QUANTITY)) {
    // Bỏ số dính vào chữ phía trước (R1, t2, N1...): đó là chỉ số của ký hiệu, không phải số liệu
    const before = text[m.index - 1];
    if (before && /[a-zà-ỹđ_']/.test(before)) continue;
    const unit = m[3] ? UNITS.find((u) => u.names.includes(m[3])) : undefined;
    // "20-30 cm": dấu gạch nối giữa hai số không phải dấu âm
    const raw = m[1].startsWith('-') && before && /\d/.test(before) ? m[1].slice(1) : m[1];
    out.push({ index: m.index, end: m.index + m[0].length, value: parseNumber(raw, m[2]), unit, used: false });
  }
  return out;
}

/** Đổi số liệu đề cho sang đơn vị của thanh trượt của đại lượng `v`; trả về undefined nếu khác loại. */
function convert(q: Quantity, v: FormulaVar): number | undefined {
  const target = unitOf(v.unit);
  if (!q.unit) return target ? undefined : q.value; // số không đơn vị chỉ hợp với đại lượng không đơn vị
  if (!target || target.dim !== q.unit.dim) return undefined;
  const si = (q.value + (q.unit.offset ?? 0)) * q.unit.factor;
  const value = si / target.factor - (target.offset ?? 0);
  return Number(value.toPrecision(10));
}

const symbolPattern = (v: FormulaVar) =>
  [v.symbol, v.key]
    .map((s) => s.toLowerCase().replace(/[()°]/g, ''))
    .filter((s, k, arr) => s && arr.indexOf(s) === k)
    .map(escape)
    .join('|');

/** Từ ngữ hỏi đại lượng cần tìm. */
const ASK = /(tính|tìm|xác định|hỏi|bằng bao nhiêu|là bao nhiêu|bao nhiêu|bao lâu|bao xa)/;

export function extractFormulaParams(def: FormulaDef, prompt: string): Record<string, number> {
  const text = normalizeText(prompt);
  const vars = variablesOf(def);
  // Gán số liệu cho các thừa số trước, vế trái sau: đề thường hỏi vế trái
  const order = [...def.factors, def.target];
  const quantities = findQuantities(text);
  const found: Record<string, number> = {};

  const take = (v: FormulaVar, q: Quantity) => {
    const value = q.unit ? convert(q, v) : q.value;
    if (value === undefined || found[v.key] !== undefined || q.used) return false;
    found[v.key] = value;
    q.used = true;
    return true;
  };

  // 1. Theo ký hiệu: "R1 = 6 Ω", "t = 20 s", "U2 là 12 V"
  for (const v of order) {
    const sym = symbolPattern(v);
    if (!sym) continue;
    const re = new RegExp(`(?:^|[^a-zà-ỹđ0-9_])(?:${sym})\\s*(?:=|:|là|bằng)\\s*`, 'g');
    for (const m of text.matchAll(re)) {
      const at = m.index + m[0].length;
      const q = quantities.find((x) => x.index === at && !x.used);
      if (q && take(v, q)) break;
    }
  }

  // 2. Theo chữ trong đề: tên chất, tên chất lỏng (chỉ điền khi đề chưa ghi số)
  const fromText = def.fromText?.(text) ?? {};
  for (const [key, value] of Object.entries(fromText)) if (found[key] === undefined) found[key] = value;

  // 3. Theo từ ngữ đứng ngay trước số liệu: "tiêu cự 10 cm", "pít-tông nhỏ 2,5 cm²"
  for (const v of order) {
    if (!v.cue || found[v.key] !== undefined) continue;
    const re = new RegExp(`(?:${v.cue})[^\\d;!?]{0,30}?(?=-?\\d)`, 'g');
    for (const m of text.matchAll(re)) {
      // "tính nhiệt độ khi cân bằng, biết nước ở 20 °C": số sau câu hỏi không thuộc đại lượng được hỏi
      if (ASK.test(text.slice(Math.max(0, m.index - 25), m.index))) continue;
      const at = m.index + m[0].length;
      const q = quantities.find((x) => x.index === at && !x.used);
      if (q && take(v, q)) break;
    }
  }

  // 4. Theo thứ tự xuất hiện: số liệu nào hợp đơn vị thì điền vào đại lượng đầu tiên còn trống,
  //    ưu tiên đại lượng có đúng đơn vị đó (300 K vào T chứ không vào t tính bằng °C)
  for (const q of quantities) {
    if (q.used || !q.unit) continue;
    const free = order.filter((x) => found[x.key] === undefined && convert(q, x) !== undefined && !askedNear(text, q, x));
    const v = free.find((x) => unitOf(x.unit) === q.unit) ?? free[0];
    if (v) take(v, q);
  }

  // 5. Đề cho khối lượng nhưng công thức cần lực: P = 10·m (vật đặt trên mặt ngang, treo trên lực kế)
  for (const q of quantities) {
    if (q.used || q.unit?.dim !== 'mass') continue;
    const v = order.find((x) => found[x.key] === undefined && unitOf(x.unit)?.dim === 'force');
    if (v) {
      found[v.key] = Number((q.value * q.unit.factor * 10).toPrecision(10));
      q.used = true;
    }
  }

  const values = def.normalize ? def.normalize(found) : found;

  // Đại lượng cần tìm: đại lượng duy nhất còn thiếu; nếu không thì đại lượng được hỏi trong đề
  const missing = vars.filter((v) => values[v.key] === undefined);
  let find = 1;
  if (missing.length === 1) find = vars.indexOf(missing[0]) + 1;
  else {
    const asked = vars.find((v) => isAsked(text, v));
    if (asked) find = vars.indexOf(asked) + 1;
  }

  const out: Record<string, number> = {};
  for (const v of vars) if (values[v.key] !== undefined && vars.indexOf(v) + 1 !== find) out[v.key] = values[v.key];
  out.find = find;
  return out;
}

/** Đề hỏi đại lượng này: "tính tiêu cự", "tìm R2", "bao nhiêu độ"... */
function isAsked(text: string, v: FormulaVar): boolean {
  const label = escape(v.label.toLowerCase().replace(/\s*\(.*\)$/, ''));
  const sym = symbolPattern(v);
  const re = new RegExp(`${ASK.source}[^.;!?]{0,25}?(?:${label}|(?:^|[^a-zà-ỹđ0-9_])(?:${sym})(?![a-zà-ỹđ0-9_])${v.cue ? `|${v.cue}` : ''})`);
  return re.test(text);
}

/** Số liệu đứng ngay sau câu hỏi về chính đại lượng đó ("tính U2 khi ...") không phải dữ kiện của nó. */
function askedNear(text: string, q: Quantity, v: FormulaVar): boolean {
  const sym = symbolPattern(v);
  if (!sym) return false;
  return new RegExp(`(?:${sym})\\s*=\\s*\\?\\s*$`).test(text.slice(Math.max(0, q.index - 12), q.index));
}
