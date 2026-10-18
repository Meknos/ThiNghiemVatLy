import { ExperimentTemplate } from '../../core/types';

/** Một đại lượng trong công thức. */
export interface FormulaVar {
  key: string;      // tên tham số, ví dụ 's'
  symbol: string;   // ký hiệu hiển thị, ví dụ 's'
  latex: string;    // ký hiệu viết bằng LaTeX, ví dụ 'W_đ'
  label: string;    // tên đại lượng
  unit: string;     // đơn vị của thanh trượt và của số liệu trong đề
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  /** Đơn vị thường gặp khác để hiển thị kèm: giá trị × factor */
  alt?: { unit: string; factor: number };
  /**
   * Hệ số đổi sang đơn vị SI khi thay số (giá trị SI = giá trị × scale), dùng khi đơn vị
   * của thanh trượt không phải SI, ví dụ tiết diện tính bằng mm² thì scale = 1e-6.
   */
  scale?: number;
  /** Đơn vị SI tương ứng, hiển thị ở bước thay số khi có `scale` */
  siUnit?: string;
  /** Từ ngữ đứng trước số liệu của đại lượng này trong đề bài (biểu thức chính quy) */
  cue?: string;
}

/** Thừa số trong công thức: số mũ dùng cho dạng tích, hệ số dùng cho dạng tổng. */
export interface FormulaFactor extends FormulaVar {
  exp?: number;
  weight?: number;
}

type Values = Record<string, number>;

interface FormulaBase {
  id: string;
  title: string;
  group: ExperimentTemplate['group'];
  topic: string;
  target: FormulaVar;
  factors: FormulaFactor[];
  latex: string;
  conditions: string;
  aiHint: string;
  /** Hình minh họa riêng cho công thức, nếu có */
  scene?: SceneId;
  /** Nhận xét về kết quả dành cho học sinh (tính chất ảnh, số liệu bất hợp lí...) */
  interpret?: (values: Values) => string | null;
  /** Số liệu suy ra từ chữ trong đề (tên chất, tên chất lỏng...) khi đề không ghi số */
  fromText?: (text: string) => Values;
  /** Sắp lại số liệu đã trích từ đề cho đúng vai trò (ví dụ vật nóng luôn là vật 1) */
  normalize?: (values: Values) => Values;
}

/**
 * Công thức dạng tích: target = coef × Π factor^exp.
 * Nhờ dạng này, biết các đại lượng còn lại là tính được bất kỳ đại lượng nào.
 */
export interface ProductFormula extends FormulaBase {
  kind?: 'product';
  coef: number;
}

/**
 * Công thức dạng tổng: target^power = offset + Σ weight × factor^power,
 * với power = 1 (điện trở nối tiếp, đổi nhiệt độ) hoặc power = -1 (song song, thấu kính).
 */
export interface SumFormula extends FormulaBase {
  kind: 'sum';
  power: 1 | -1;
  offset?: number;
}

/** Công thức không đưa được về hai dạng trên: mỗi đại lượng có sẵn cách tính và biểu thức riêng. */
export interface CustomFormula extends FormulaBase {
  kind: 'custom';
  solve: Record<string, (v: Values) => number>;
  /** Biểu thức của từng đại lượng theo các đại lượng còn lại; `s(key)` trả về ký hiệu hoặc con số */
  rearranged: Record<string, (s: (key: string) => string) => string>;
}

export type FormulaDef = ProductFormula | SumFormula | CustomFormula;

export type SceneId =
  | 'motion' | 'push' | 'lens' | 'lens-diverging' | 'echo' | 'wave' | 'lever' | 'series' | 'parallel'
  | 'spring' | 'hydraulic' | 'heat' | 'mixing' | 'incline' | 'wire';

/* ------------------------------------------------------------------
   Bảng tra theo tên chất (SGK KHTN THCS)
------------------------------------------------------------------ */

/** Tìm giá trị theo chất được nhắc tới đầu tiên (hoặc thứ `nth`) trong đề. */
function lookup(text: string, table: [RegExp, number][], nth = 0): number | undefined {
  const found = table
    .map(([re, value]) => ({ index: text.search(re), value }))
    .filter((x) => x.index >= 0)
    .sort((a, b) => a.index - b.index)
    // "nước đá" cũng khớp "nước": mỗi vị trí trong đề chỉ tính một chất (chất ghi trước trong bảng)
    .filter((x, k, arr) => k === 0 || arr[k - 1].index !== x.index);
  return found[nth]?.value;
}

const SPECIFIC_HEAT: [RegExp, number][] = [
  [/nước đá/, 1800],
  [/nước/, 4200],
  [/rượu/, 2500],
  [/nhôm/, 880],
  [/đồng/, 380],
  [/(sắt|thép)/, 460],
  [/chì/, 130],
  [/đất/, 800]
];

const LIQUID_WEIGHT: [RegExp, number][] = [
  [/thủy ngân/, 136000],
  [/nước (biển|muối)/, 10300],
  [/dầu/, 8000],
  [/rượu/, 8000],
  [/xăng/, 7000],
  [/nước/, 10000]
];

const RESISTIVITY: [RegExp, number][] = [
  [/bạc/, 1.6],
  [/đồng/, 1.7],
  [/nhôm/, 2.8],
  [/vonfram/, 5.5],
  [/(sắt|thép)/, 12],
  [/nikelin/, 40],
  [/constantan/, 50],
  [/nicrom/, 110]
];

const HEAT_OF_COMBUSTION: [RegExp, number][] = [
  [/hiđrô|hidro/, 120],
  [/xăng/, 46],
  [/(dầu hỏa|dầu hoả|khí đốt|dầu)/, 44],
  [/than đá/, 27],
  [/than (gỗ|củi)/, 34],
  [/củi/, 10],
  [/than bùn/, 14]
];

const defined = (v: Record<string, number | undefined>): Values => {
  const out: Values = {};
  for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = x;
  return out;
};

/* ------------------------------------------------------------------
   Danh mục công thức vật lý KHTN THCS (lớp 6–9)
------------------------------------------------------------------ */

export const FORMULAS: FormulaDef[] = [
  /* ---------------- Mở đầu & Đo lường ---------------- */
  {
    id: 'doi-nhiet-do',
    kind: 'sum',
    power: 1,
    offset: 32,
    title: 'Đổi Nhiệt Độ Celsius – Fahrenheit',
    group: 'Mở đầu & Đo lường',
    topic: 'Thang nhiệt độ',
    target: { key: 'F', symbol: 't(°F)', latex: 't_{°F}', label: 'Nhiệt độ theo độ F', unit: '°F', min: -58, max: 572, step: 0.1, defaultVal: 77 },
    factors: [
      { key: 't', symbol: 't(°C)', latex: 't_{°C}', label: 'Nhiệt độ theo độ C', unit: '°C', min: -50, max: 300, step: 0.1, defaultVal: 25, weight: 1.8 }
    ],
    latex: 't_{°F} = 1{,}8 \\cdot t_{°C} + 32',
    conditions: 'Nước đá đang tan ở 0 °C = 32 °F, nước sôi ở 100 °C = 212 °F. Mỗi độ C ứng với 1,8 độ F.',
    aiHint: 'Các bài đổi nhiệt độ giữa thang Celsius (°C) và thang Fahrenheit (°F).',
    scene: 'heat'
  },
  {
    id: 'nhiet-do-kelvin',
    kind: 'sum',
    power: 1,
    offset: 273,
    title: 'Đổi Nhiệt Độ Celsius – Kelvin',
    group: 'Mở đầu & Đo lường',
    topic: 'Thang nhiệt độ',
    target: { key: 'T', symbol: 'T', latex: 'T', label: 'Nhiệt độ theo kelvin', unit: 'K', min: 0, max: 600, step: 1, defaultVal: 298 },
    factors: [
      { key: 't', symbol: 't', latex: 't', label: 'Nhiệt độ theo độ C', unit: '°C', min: -273, max: 300, step: 1, defaultVal: 25, weight: 1 }
    ],
    latex: 'T(\\text{K}) = t(°\\text{C}) + 273',
    conditions: 'Độ không tuyệt đối 0 K ứng với −273 °C. Độ chênh 1 K bằng độ chênh 1 °C.',
    aiHint: 'Các bài đổi nhiệt độ giữa thang Celsius (°C) và thang Kelvin (K).',
    scene: 'heat'
  },

  /* ---------------- Cơ học: chuyển động ---------------- */
  {
    id: 'toc-do',
    title: 'Tốc Độ, Quãng Đường, Thời Gian',
    group: 'Cơ học',
    topic: 'Tốc độ',
    target: { key: 'v', symbol: 'v', latex: 'v', label: 'Tốc độ', unit: 'm/s', min: 0.5, max: 50, step: 0.5, defaultVal: 5, alt: { unit: 'km/h', factor: 3.6 } },
    coef: 1,
    factors: [
      { key: 's', symbol: 's', latex: 's', label: 'Quãng đường', unit: 'm', min: 1, max: 100000, step: 1, defaultVal: 100, exp: 1, alt: { unit: 'km', factor: 0.001 } },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian', unit: 's', min: 1, max: 36000, step: 1, defaultVal: 20, exp: -1, alt: { unit: 'phút', factor: 1 / 60 } }
    ],
    latex: 'v = \\frac{s}{t}',
    conditions: 'Tính bằng mét và giây: 1 km = 1000 m, 1 giờ = 3600 s, 1 m/s = 3,6 km/h. Công thức cho tốc độ trung bình trên cả quãng đường.',
    aiHint: 'Các bài toán chuyển động: cho hai trong ba đại lượng tốc độ, quãng đường, thời gian và hỏi đại lượng còn lại (người đi bộ, xe đạp, ô tô, tàu hỏa...).',
    scene: 'motion'
  },
  {
    id: 'toc-do-trung-binh',
    kind: 'custom',
    title: 'Tốc Độ Trung Bình Trên Hai Đoạn Đường',
    group: 'Cơ học',
    topic: 'Tốc độ',
    target: { key: 'v', symbol: 'vtb', latex: 'v_{tb}', label: 'Tốc độ trung bình', unit: 'm/s', min: 0.1, max: 50, step: 0.1, defaultVal: 2, alt: { unit: 'km/h', factor: 3.6 } },
    factors: [
      { key: 's1', symbol: 's1', latex: 's_1', label: 'Quãng đường thứ nhất', unit: 'm', min: 1, max: 100000, step: 1, defaultVal: 1200, alt: { unit: 'km', factor: 0.001 }, cue: '(đầu|thứ nhất|đoạn 1|lúc đi|lên dốc)' },
      { key: 't1', symbol: 't1', latex: 't_1', label: 'Thời gian đi đoạn thứ nhất', unit: 's', min: 1, max: 36000, step: 1, defaultVal: 600, alt: { unit: 'phút', factor: 1 / 60 } },
      { key: 's2', symbol: 's2', latex: 's_2', label: 'Quãng đường thứ hai', unit: 'm', min: 1, max: 100000, step: 1, defaultVal: 1800, alt: { unit: 'km', factor: 0.001 }, cue: '(sau|tiếp theo|thứ hai|còn lại|đoạn 2|lúc về|xuống dốc)' },
      { key: 't2', symbol: 't2', latex: 't_2', label: 'Thời gian đi đoạn thứ hai', unit: 's', min: 1, max: 36000, step: 1, defaultVal: 900, alt: { unit: 'phút', factor: 1 / 60 } }
    ],
    solve: {
      v: ({ s1, s2, t1, t2 }) => (s1 + s2) / (t1 + t2),
      s1: ({ v, s2, t1, t2 }) => v * (t1 + t2) - s2,
      s2: ({ v, s1, t1, t2 }) => v * (t1 + t2) - s1,
      t1: ({ v, s1, s2, t2 }) => (s1 + s2) / v - t2,
      t2: ({ v, s1, s2, t1 }) => (s1 + s2) / v - t1
    },
    rearranged: {
      v: (s) => `\\frac{${s('s1')} + ${s('s2')}}{${s('t1')} + ${s('t2')}}`,
      s1: (s) => `${s('v')} \\cdot (${s('t1')} + ${s('t2')}) - ${s('s2')}`,
      s2: (s) => `${s('v')} \\cdot (${s('t1')} + ${s('t2')}) - ${s('s1')}`,
      t1: (s) => `\\frac{${s('s1')} + ${s('s2')}}{${s('v')}} - ${s('t2')}`,
      t2: (s) => `\\frac{${s('s1')} + ${s('s2')}}{${s('v')}} - ${s('t1')}`
    },
    latex: 'v_{tb} = \\frac{s_1 + s_2}{t_1 + t_2}',
    conditions: 'Tốc độ trung bình bằng tổng quãng đường chia cho tổng thời gian, không phải trung bình cộng của hai tốc độ.',
    aiHint: 'Các bài tính tốc độ trung bình khi vật đi hai đoạn đường khác nhau (lên dốc rồi xuống dốc, đi rồi về...), mỗi đoạn có quãng đường và thời gian riêng.',
    scene: 'motion'
  },

  /* ---------------- Cơ học: lực ---------------- */
  {
    id: 'trong-luong',
    title: 'Trọng Lượng Của Vật',
    group: 'Cơ học',
    topic: 'Trọng lực',
    target: { key: 'P', symbol: 'P', latex: 'P', label: 'Trọng lượng', unit: 'N', min: 0, max: 1000, step: 1, defaultVal: 20 },
    coef: 10,
    factors: [
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng', unit: 'kg', min: 0.1, max: 100, step: 0.1, defaultVal: 2, exp: 1, alt: { unit: 'g', factor: 1000 } }
    ],
    latex: 'P = 10 \\cdot m',
    conditions: 'Công thức gần đúng ở gần mặt đất: vật có khối lượng 1 kg thì có trọng lượng khoảng 10 N. Khối lượng tính bằng kg.',
    aiHint: 'Các bài toán đổi giữa khối lượng và trọng lượng của vật: vật nặng bao nhiêu kg thì trọng lượng bao nhiêu N, hoặc ngược lại.',
    scene: 'spring'
  },
  {
    id: 'luc-dan-hoi',
    title: 'Lực Đàn Hồi Của Lò Xo',
    group: 'Cơ học',
    topic: 'Lực đàn hồi',
    target: { key: 'F', symbol: 'Fđh', latex: 'F_{đh}', label: 'Lực đàn hồi', unit: 'N', min: 0, max: 200, step: 0.1, defaultVal: 2 },
    coef: 1,
    factors: [
      { key: 'k', symbol: 'k', latex: 'k', label: 'Độ cứng của lò xo', unit: 'N/m', min: 1, max: 5000, step: 1, defaultVal: 50, exp: 1 },
      { key: 'dl', symbol: 'Δl', latex: '\\Delta l', label: 'Độ giãn của lò xo', unit: 'cm', min: 0.1, max: 50, step: 0.1, defaultVal: 4, exp: 1, scale: 0.01, siUnit: 'm', cue: '(giãn|dãn|nén|biến dạng)' }
    ],
    latex: 'F_{đh} = k \\cdot \\Delta l',
    conditions: 'Đúng khi lò xo chưa bị giãn quá giới hạn đàn hồi. Độ giãn Δl = chiều dài lúc treo vật trừ chiều dài tự nhiên, đổi ra mét khi tính. Treo vật đứng yên thì Fđh = P = 10·m.',
    aiHint: 'Các bài toán lò xo có độ cứng k: tính lực đàn hồi, độ giãn của lò xo hoặc độ cứng khi biết hai đại lượng còn lại.',
    scene: 'spring'
  },
  {
    id: 'khoi-luong-rieng-ct',
    title: 'Khối Lượng Riêng (Tính m, V hoặc D)',
    group: 'Cơ học',
    topic: 'Khối lượng riêng',
    target: { key: 'D', symbol: 'D', latex: 'D', label: 'Khối lượng riêng', unit: 'kg/m³', min: 100, max: 22000, step: 10, defaultVal: 2700, alt: { unit: 'g/cm³', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng', unit: 'kg', min: 0.01, max: 10000, step: 0.01, defaultVal: 5.4, exp: 1, alt: { unit: 'g', factor: 1000 } },
      { key: 'V', symbol: 'V', latex: 'V', label: 'Thể tích', unit: 'dm³', min: 0.01, max: 10000, step: 0.01, defaultVal: 2, exp: -1, scale: 0.001, siUnit: 'm³', alt: { unit: 'lít', factor: 1 } }
    ],
    latex: 'D = \\frac{m}{V}',
    conditions: 'Khối lượng tính bằng kg, thể tích tính bằng m³ (1 dm³ = 1 lít = 0,001 m³). Nước 1000, nhôm 2700, sắt 7800, đồng 8900, chì 11300 kg/m³.',
    aiHint: 'Các bài tính toán khối lượng riêng D = m/V khi cần tìm khối lượng hoặc thể tích của vật (ví dụ khối lượng của 2 lít dầu, thể tích của 5 kg sắt). Bài đo khối lượng riêng bằng cân và bình chia độ thì dùng mẫu khoi-luong-rieng.'
  },
  {
    id: 'trong-luong-rieng',
    title: 'Trọng Lượng Riêng',
    group: 'Cơ học',
    topic: 'Khối lượng riêng',
    target: { key: 'd', symbol: 'd', latex: 'd', label: 'Trọng lượng riêng', unit: 'N/m³', min: 1000, max: 220000, step: 100, defaultVal: 27000 },
    coef: 10,
    factors: [
      { key: 'D', symbol: 'D', latex: 'D', label: 'Khối lượng riêng', unit: 'kg/m³', min: 100, max: 22000, step: 10, defaultVal: 2700, exp: 1 }
    ],
    latex: 'd = 10 \\cdot D',
    conditions: 'Suy ra từ P = 10·m: trọng lượng riêng (N/m³) bằng 10 lần khối lượng riêng (kg/m³). Nước có d = 10 000 N/m³.',
    aiHint: 'Các bài đổi giữa khối lượng riêng D và trọng lượng riêng d của một chất.'
  },
  {
    id: 'ap-suat',
    title: 'Áp Suất (Tính p, F hoặc S)',
    group: 'Cơ học',
    topic: 'Áp suất',
    target: { key: 'p', symbol: 'p', latex: 'p', label: 'Áp suất', unit: 'Pa', min: 0, max: 10000000, step: 1, defaultVal: 20000 },
    coef: 1,
    factors: [
      { key: 'F', symbol: 'F', latex: 'F', label: 'Áp lực', unit: 'N', min: 1, max: 1000000, step: 1, defaultVal: 500, exp: 1 },
      { key: 'S', symbol: 'S', latex: 'S', label: 'Diện tích bị ép', unit: 'cm²', min: 0.1, max: 100000, step: 0.1, defaultVal: 250, exp: -1, scale: 1e-4, siUnit: 'm²', cue: '(diện tích|tiếp xúc)' }
    ],
    latex: 'p = \\frac{F}{S}',
    conditions: 'Áp lực là lực ép vuông góc với mặt bị ép; vật đặt trên mặt nằm ngang thì F = P = 10·m. Diện tích đổi ra m² khi tính (1 cm² = 0,0001 m²); 1 Pa = 1 N/m².',
    aiHint: 'Các bài tính toán áp suất p = F/S khi đề hỏi áp lực hoặc diện tích bị ép (ví dụ người nặng bao nhiêu, diện tích tiếp xúc tối thiểu để không lún). Bài chỉ hỏi áp suất của vật đặt trên mặt sàn thì ưu tiên mẫu ap-suat-chat-ran.'
  },
  {
    id: 'ap-suat-chat-long-ct',
    title: 'Áp Suất Chất Lỏng (Tính p, d hoặc h)',
    group: 'Cơ học',
    topic: 'Áp suất chất lỏng',
    target: { key: 'p', symbol: 'p', latex: 'p', label: 'Áp suất chất lỏng', unit: 'Pa', min: 0, max: 200000000, step: 1, defaultVal: 30000 },
    coef: 1,
    factors: [
      { key: 'd', symbol: 'd', latex: 'd', label: 'Trọng lượng riêng chất lỏng', unit: 'N/m³', min: 5000, max: 140000, step: 100, defaultVal: 10000, exp: 1 },
      { key: 'h', symbol: 'h', latex: 'h', label: 'Độ sâu', unit: 'm', min: 0.01, max: 11000, step: 0.01, defaultVal: 3, exp: 1, cue: '(sâu|độ sâu|cột)' }
    ],
    latex: 'p = d \\cdot h',
    conditions: 'h là độ sâu tính từ mặt thoáng chất lỏng đến điểm đang xét, đổi ra mét. Nước 10 000, nước biển 10 300, dầu 8 000, thủy ngân 136 000 N/m³.',
    aiHint: 'Các bài tính toán áp suất chất lỏng p = d·h khi đề hỏi độ sâu (tàu ngầm, thợ lặn ở độ sâu bao nhiêu) hoặc trọng lượng riêng của chất lỏng. Bài chỉ hỏi áp suất tại một độ sâu cho trước thì ưu tiên mẫu ap-suat-chat-long.',
    fromText: (text) => defined({ d: lookup(text, LIQUID_WEIGHT) })
  },
  {
    id: 'may-nen-thuy-luc',
    title: 'Máy Nén Thủy Lực',
    group: 'Cơ học',
    topic: 'Áp suất chất lỏng',
    target: { key: 'F', symbol: 'F', latex: 'F', label: 'Lực ở pít-tông lớn', unit: 'N', min: 1, max: 1000000, step: 1, defaultVal: 4000, cue: '(pít-?tông lớn|pittông lớn|nâng|ô tô|xe)' },
    coef: 1,
    factors: [
      { key: 'f', symbol: 'f', latex: 'f', label: 'Lực tác dụng lên pít-tông nhỏ', unit: 'N', min: 1, max: 10000, step: 1, defaultVal: 200, exp: 1, cue: '(nhỏ|tác dụng)' },
      { key: 'S', symbol: 'S', latex: 'S', label: 'Diện tích pít-tông lớn', unit: 'cm²', min: 1, max: 100000, step: 1, defaultVal: 400, exp: 1, cue: 'lớn' },
      { key: 's', symbol: 's', latex: 's', label: 'Diện tích pít-tông nhỏ', unit: 'cm²', min: 0.1, max: 1000, step: 0.1, defaultVal: 20, exp: -1, cue: 'nhỏ' }
    ],
    latex: '\\frac{F}{f} = \\frac{S}{s} \\;\\Rightarrow\\; F = f \\cdot \\frac{S}{s}',
    conditions: 'Chất lỏng truyền nguyên vẹn áp suất đi mọi hướng. Hai diện tích chỉ cần cùng đơn vị. Bỏ qua trọng lượng pít-tông và ma sát.',
    aiHint: 'Các bài máy nén (máy ép, kích) thủy lực có pít-tông nhỏ và pít-tông lớn: tính lực nâng, lực cần tác dụng hoặc diện tích pít-tông.',
    scene: 'hydraulic'
  },
  {
    id: 'luc-day-ac-si-met-ct',
    title: 'Lực Đẩy Ác-si-mét (Tính F, d hoặc V)',
    group: 'Cơ học',
    topic: 'Lực đẩy Archimedes',
    target: { key: 'FA', symbol: 'FA', latex: 'F_A', label: 'Lực đẩy Ác-si-mét', unit: 'N', min: 0, max: 100000, step: 0.01, defaultVal: 2 },
    coef: 1,
    factors: [
      { key: 'd', symbol: 'd', latex: 'd', label: 'Trọng lượng riêng chất lỏng', unit: 'N/m³', min: 5000, max: 140000, step: 100, defaultVal: 10000, exp: 1 },
      { key: 'V', symbol: 'V', latex: 'V', label: 'Thể tích phần chìm', unit: 'cm³', min: 1, max: 10000000, step: 1, defaultVal: 200, exp: 1, scale: 1e-6, siUnit: 'm³', alt: { unit: 'dm³', factor: 0.001 } }
    ],
    latex: 'F_A = d \\cdot V',
    conditions: 'V là thể tích phần vật chìm trong chất lỏng (vật chìm hẳn thì bằng thể tích vật), đổi ra m³ khi tính. Số chỉ lực kế khi nhúng vật giảm đúng bằng FA.',
    aiHint: 'Các bài tính toán lực đẩy Ác-si-mét F_A = d·V khi đề hỏi thể tích vật hoặc trọng lượng riêng chất lỏng (ví dụ biết số chỉ lực kế trong không khí và trong nước). Bài hỏi lực đẩy và điều kiện chìm nổi thì ưu tiên mẫu luc-day-archimedes.',
    fromText: (text) => defined({ d: lookup(text, LIQUID_WEIGHT) })
  },

  /* ---------------- Cơ học: công, năng lượng, máy cơ đơn giản ---------------- */
  {
    id: 'cong-co-hoc',
    title: 'Công Cơ Học',
    group: 'Cơ học',
    topic: 'Công',
    target: { key: 'A', symbol: 'A', latex: 'A', label: 'Công', unit: 'J', min: 0, max: 100000, step: 1, defaultVal: 500, alt: { unit: 'kJ', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'F', symbol: 'F', latex: 'F', label: 'Lực tác dụng', unit: 'N', min: 1, max: 2000, step: 1, defaultVal: 100, exp: 1 },
      { key: 's', symbol: 's', latex: 's', label: 'Quãng đường dịch chuyển', unit: 'm', min: 0.1, max: 200, step: 0.1, defaultVal: 5, exp: 1 }
    ],
    latex: 'A = F \\cdot s',
    conditions: 'Lực không đổi và cùng hướng với chuyển động. Nếu vật không dịch chuyển, hoặc lực vuông góc với hướng chuyển động, thì lực không sinh công.',
    aiHint: 'Các bài toán tính công khi kéo, đẩy, nâng vật: cho lực và quãng đường (hoặc độ cao nâng vật), hỏi công; hoặc cho công và hỏi lực hay quãng đường.',
    scene: 'push'
  },
  {
    id: 'cong-suat',
    title: 'Công Suất',
    group: 'Cơ học',
    topic: 'Công suất',
    target: { key: 'P', symbol: '𝒫', latex: '\\mathcal{P}', label: 'Công suất', unit: 'W', min: 0, max: 100000, step: 1, defaultVal: 100, alt: { unit: 'kW', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'A', symbol: 'A', latex: 'A', label: 'Công thực hiện', unit: 'J', min: 1, max: 1000000, step: 1, defaultVal: 3000, exp: 1, alt: { unit: 'kJ', factor: 0.001 } },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian', unit: 's', min: 1, max: 3600, step: 1, defaultVal: 30, exp: -1, alt: { unit: 'phút', factor: 1 / 60 } }
    ],
    latex: '\\mathcal{P} = \\frac{A}{t}',
    conditions: 'Công suất cho biết công thực hiện trong một giây: 1 W = 1 J/s. Thời gian tính bằng giây.',
    aiHint: 'Các bài toán so sánh ai, máy nào làm việc khỏe hơn; tính công suất từ công và thời gian, hoặc tính công, thời gian khi biết công suất.'
  },
  {
    id: 'cong-suat-keo',
    title: 'Công Suất Theo Lực Kéo Và Tốc Độ',
    group: 'Cơ học',
    topic: 'Công suất',
    target: { key: 'P', symbol: '𝒫', latex: '\\mathcal{P}', label: 'Công suất', unit: 'W', min: 0, max: 1000000, step: 1, defaultVal: 10000, alt: { unit: 'kW', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'F', symbol: 'F', latex: 'F', label: 'Lực kéo', unit: 'N', min: 1, max: 100000, step: 1, defaultVal: 1000, exp: 1 },
      { key: 'v', symbol: 'v', latex: 'v', label: 'Tốc độ', unit: 'm/s', min: 0.1, max: 100, step: 0.1, defaultVal: 10, exp: 1, alt: { unit: 'km/h', factor: 3.6 } }
    ],
    latex: '\\mathcal{P} = \\frac{A}{t} = \\frac{F \\cdot s}{t} = F \\cdot v',
    conditions: 'Lực kéo không đổi, cùng hướng chuyển động và vật chuyển động đều. Tốc độ tính bằng m/s (36 km/h = 10 m/s).',
    aiHint: 'Các bài cho lực kéo của động cơ (ô tô, ngựa kéo xe, đầu tàu) và tốc độ chuyển động, hỏi công suất; hoặc cho công suất và hỏi lực kéo, tốc độ.',
    scene: 'push'
  },
  {
    id: 'hieu-suat',
    title: 'Hiệu Suất',
    group: 'Cơ học',
    topic: 'Hiệu suất',
    target: { key: 'H', symbol: 'H', latex: 'H', label: 'Hiệu suất', unit: '%', min: 1, max: 100, step: 0.1, defaultVal: 80 },
    coef: 100,
    factors: [
      { key: 'Aci', symbol: 'Aci', latex: 'A_{ci}', label: 'Năng lượng (công) có ích', unit: 'J', min: 1, max: 100000000, step: 1, defaultVal: 4000, exp: 1, alt: { unit: 'kJ', factor: 0.001 }, cue: 'có ích' },
      { key: 'Atp', symbol: 'Atp', latex: 'A_{tp}', label: 'Năng lượng (công) toàn phần', unit: 'J', min: 1, max: 100000000, step: 1, defaultVal: 5000, exp: -1, alt: { unit: 'kJ', factor: 0.001 }, cue: '(toàn phần|tiêu thụ|cung cấp|bỏ ra)' }
    ],
    latex: 'H = \\frac{A_{ci}}{A_{tp}} \\cdot 100\\%',
    conditions: 'Phần năng lượng hao phí (ma sát, tỏa nhiệt) làm cho năng lượng có ích luôn nhỏ hơn năng lượng toàn phần, nên H < 100%.',
    aiHint: 'Các bài tính hiệu suất của máy cơ, mặt phẳng nghiêng, động cơ, bếp điện: cho năng lượng (công) có ích và toàn phần, hỏi hiệu suất; hoặc ngược lại.',
    interpret: ({ H }) => (H > 100 ? 'Hiệu suất lớn hơn 100% là vô lí: năng lượng có ích không thể vượt năng lượng toàn phần.' : null)
  },
  {
    id: 'mo-men-luc',
    title: 'Mô Men Lực',
    group: 'Cơ học',
    topic: 'Tác dụng làm quay của lực',
    target: { key: 'M', symbol: 'M', latex: 'M', label: 'Mô men lực', unit: 'N·m', min: 0, max: 5000, step: 0.1, defaultVal: 10 },
    coef: 1,
    factors: [
      { key: 'F', symbol: 'F', latex: 'F', label: 'Lực', unit: 'N', min: 1, max: 1000, step: 1, defaultVal: 20, exp: 1 },
      { key: 'd', symbol: 'd', latex: 'd', label: 'Cánh tay đòn', unit: 'm', min: 0.05, max: 5, step: 0.05, defaultVal: 0.5, exp: 1, alt: { unit: 'cm', factor: 100 } }
    ],
    latex: 'M = F \\cdot d',
    conditions: 'd là khoảng cách từ trục quay đến giá của lực (cánh tay đòn), tính bằng mét.',
    aiHint: 'Các bài toán về tác dụng làm quay của một lực: tính mô men của lực đối với trục quay khi biết lực và cánh tay đòn (cờ lê vặn ốc, mở cửa...). Bài đòn bẩy có hai lực thì dùng mẫu don-bay.',
    scene: 'lever'
  },
  {
    id: 'don-bay',
    title: 'Điều Kiện Cân Bằng Của Đòn Bẩy',
    group: 'Cơ học',
    topic: 'Đòn bẩy',
    target: { key: 'F1', symbol: 'F1', latex: 'F_1', label: 'Lực ở đầu thứ nhất', unit: 'N', min: 0.1, max: 100000, step: 0.1, defaultVal: 50, cue: '(cần|tác dụng|người|tay)' },
    coef: 1,
    factors: [
      { key: 'F2', symbol: 'F2', latex: 'F_2', label: 'Lực ở đầu thứ hai (vật)', unit: 'N', min: 0.1, max: 100000, step: 0.1, defaultVal: 200, exp: 1, cue: '(vật|nặng|treo)' },
      { key: 'd2', symbol: 'd2', latex: 'd_2', label: 'Cánh tay đòn của F2', unit: 'cm', min: 1, max: 1000, step: 1, defaultVal: 20, exp: 1 },
      { key: 'd1', symbol: 'd1', latex: 'd_1', label: 'Cánh tay đòn của F1', unit: 'cm', min: 1, max: 1000, step: 1, defaultVal: 80, exp: -1 }
    ],
    latex: 'F_1 \\cdot d_1 = F_2 \\cdot d_2',
    conditions: 'Đòn bẩy cân bằng khi mô men hai lực bằng nhau. d1, d2 là khoảng cách từ điểm tựa đến giá của mỗi lực, chỉ cần cùng đơn vị. Bỏ qua trọng lượng của đòn bẩy. Treo vật m kg thì lực bằng 10·m N.',
    aiHint: 'Các bài đòn bẩy, bập bênh, xà beng có số liệu: hai lực ở hai đầu và khoảng cách đến điểm tựa, hỏi lực cần tác dụng hoặc vị trí điểm tựa. Bài chỉ khảo sát định tính đòn bẩy thì dùng mẫu luc-va-chuyen-dong.',
    scene: 'lever'
  },
  {
    id: 'mat-phang-nghieng',
    title: 'Mặt Phẳng Nghiêng',
    group: 'Cơ học',
    topic: 'Máy cơ đơn giản',
    target: { key: 'F', symbol: 'F', latex: 'F', label: 'Lực kéo vật theo mặt nghiêng', unit: 'N', min: 0.1, max: 100000, step: 0.1, defaultVal: 125, cue: '(lực kéo|lực đẩy|kéo với lực|đẩy với lực)' },
    coef: 1,
    factors: [
      { key: 'P', symbol: 'P', latex: 'P', label: 'Trọng lượng vật', unit: 'N', min: 1, max: 100000, step: 1, defaultVal: 500, exp: 1, cue: '(vật nặng|trọng lượng|thùng|vật có)' },
      { key: 'h', symbol: 'h', latex: 'h', label: 'Độ cao mặt nghiêng', unit: 'm', min: 0.1, max: 100, step: 0.1, defaultVal: 1, exp: 1, cue: '(cao|độ cao)' },
      { key: 'l', symbol: 'l', latex: 'l', label: 'Chiều dài mặt nghiêng', unit: 'm', min: 0.1, max: 500, step: 0.1, defaultVal: 4, exp: -1, cue: '(dài|chiều dài)' }
    ],
    latex: 'F \\cdot l = P \\cdot h',
    conditions: 'Bỏ qua ma sát: công kéo vật theo mặt nghiêng bằng công nâng thẳng vật lên độ cao h. Mặt nghiêng càng dài (càng thoai thoải) thì lực kéo càng nhỏ.',
    aiHint: 'Các bài kéo, đẩy vật lên mặt phẳng nghiêng (tấm ván, dốc) không ma sát: tính lực kéo, chiều dài hoặc độ cao của mặt nghiêng.',
    scene: 'incline'
  },
  {
    id: 'dong-nang',
    title: 'Động Năng',
    group: 'Cơ học',
    topic: 'Năng lượng cơ học',
    target: { key: 'W', symbol: 'Wđ', latex: 'W_đ', label: 'Động năng', unit: 'J', min: 0, max: 1000000, step: 1, defaultVal: 100, alt: { unit: 'kJ', factor: 0.001 } },
    coef: 0.5,
    factors: [
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng', unit: 'kg', min: 0.1, max: 2000, step: 0.1, defaultVal: 2, exp: 1 },
      { key: 'v', symbol: 'v', latex: 'v', label: 'Tốc độ', unit: 'm/s', min: 0.5, max: 50, step: 0.5, defaultVal: 10, exp: 2, alt: { unit: 'km/h', factor: 3.6 } }
    ],
    latex: 'W_đ = \\frac{1}{2} m v^2',
    conditions: 'Khối lượng tính bằng kg, tốc độ tính bằng m/s. Tốc độ tăng gấp đôi thì động năng tăng gấp bốn.',
    aiHint: 'Các bài toán tính động năng của vật đang chuyển động khi biết khối lượng và tốc độ, hoặc tìm tốc độ, khối lượng khi biết động năng.',
    scene: 'motion'
  },
  {
    id: 'the-nang',
    title: 'Thế Năng Trọng Trường',
    group: 'Cơ học',
    topic: 'Năng lượng cơ học',
    target: { key: 'W', symbol: 'Wt', latex: 'W_t', label: 'Thế năng', unit: 'J', min: 0, max: 1000000, step: 1, defaultVal: 100, alt: { unit: 'kJ', factor: 0.001 } },
    coef: 10,
    factors: [
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng', unit: 'kg', min: 0.1, max: 2000, step: 0.1, defaultVal: 2, exp: 1 },
      { key: 'h', symbol: 'h', latex: 'h', label: 'Độ cao so với mốc', unit: 'm', min: 0.1, max: 500, step: 0.1, defaultVal: 5, exp: 1 }
    ],
    latex: 'W_t = P \\cdot h = 10 \\cdot m \\cdot h',
    conditions: 'Độ cao h tính từ vị trí chọn làm mốc (thường là mặt đất). Trọng lượng P = 10·m.',
    aiHint: 'Các bài toán tính thế năng của vật ở một độ cao so với mặt đất khi biết khối lượng (hoặc trọng lượng) và độ cao.',
    scene: 'incline'
  },
  {
    id: 'co-nang',
    kind: 'sum',
    power: 1,
    title: 'Cơ Năng',
    group: 'Cơ học',
    topic: 'Năng lượng cơ học',
    target: { key: 'W', symbol: 'W', latex: 'W', label: 'Cơ năng', unit: 'J', min: 0, max: 1000000, step: 1, defaultVal: 150, cue: 'cơ năng' },
    factors: [
      { key: 'Wd', symbol: 'Wđ', latex: 'W_đ', label: 'Động năng', unit: 'J', min: 0, max: 1000000, step: 1, defaultVal: 50, weight: 1, cue: 'động năng' },
      { key: 'Wt', symbol: 'Wt', latex: 'W_t', label: 'Thế năng', unit: 'J', min: 0, max: 1000000, step: 1, defaultVal: 100, weight: 1, cue: 'thế năng' }
    ],
    latex: 'W = W_đ + W_t',
    conditions: 'Khi bỏ qua ma sát và sức cản không khí, cơ năng của vật được bảo toàn: động năng tăng bao nhiêu thì thế năng giảm bấy nhiêu.',
    aiHint: 'Các bài tính cơ năng là tổng động năng và thế năng, hoặc tìm động năng (thế năng) khi biết cơ năng được bảo toàn.',
    interpret: ({ W, Wd, Wt }) => (Wd < 0 || Wt < 0 || W < 0 ? 'Năng lượng âm là vô lí: kiểm tra lại số liệu (cơ năng phải lớn hơn mỗi thành phần).' : null)
  },

  /* ---------------- Âm học ---------------- */
  {
    id: 'tan-so-dao-dong',
    title: 'Tần Số Dao Động',
    group: 'Âm học',
    topic: 'Độ cao của âm',
    target: { key: 'f', symbol: 'f', latex: 'f', label: 'Tần số', unit: 'Hz', min: 0.1, max: 100000, step: 0.1, defaultVal: 50 },
    coef: 1,
    factors: [
      { key: 'N', symbol: 'N', latex: 'N', label: 'Số dao động', unit: 'dao động', min: 1, max: 10000000, step: 1, defaultVal: 500, exp: 1 },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian', unit: 's', min: 0.01, max: 3600, step: 0.01, defaultVal: 10, exp: -1, alt: { unit: 'phút', factor: 1 / 60 } }
    ],
    latex: 'f = \\frac{N}{t}',
    conditions: 'Tần số là số dao động trong một giây, đơn vị héc (Hz). Tai người nghe được âm có tần số từ 20 Hz đến 20 000 Hz; dưới 20 Hz là hạ âm, trên 20 000 Hz là siêu âm.',
    aiHint: 'Các bài tính tần số dao động của nguồn âm (dây đàn, cánh côn trùng, con lắc, âm thoa) khi biết số dao động và thời gian, hoặc tìm số dao động khi biết tần số.',
    scene: 'wave',
    interpret: ({ f }) =>
      f < 20 ? 'Tần số dưới 20 Hz: hạ âm, tai người không nghe được.' :
      f > 20000 ? 'Tần số trên 20 000 Hz: siêu âm, tai người không nghe được.' :
      'Tần số từ 20 Hz đến 20 000 Hz: tai người nghe được. Tần số càng lớn thì âm càng cao (bổng).'
  },
  {
    id: 'tieng-vang',
    title: 'Phản Xạ Âm, Tiếng Vang',
    group: 'Âm học',
    topic: 'Phản xạ âm',
    target: { key: 'd', symbol: 'd', latex: 'd', label: 'Khoảng cách đến vật phản xạ', unit: 'm', min: 0.1, max: 20000, step: 0.1, defaultVal: 255, cue: '(cách|khoảng cách|sâu|độ sâu)' },
    coef: 0.5,
    factors: [
      { key: 'v', symbol: 'v', latex: 'v', label: 'Tốc độ truyền âm', unit: 'm/s', min: 300, max: 6100, step: 1, defaultVal: 340, exp: 1 },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian từ lúc phát đến lúc nghe âm phản xạ', unit: 's', min: 0.01, max: 60, step: 0.01, defaultVal: 1.5, exp: 1 }
    ],
    latex: 'd = \\frac{v \\cdot t}{2}',
    conditions: 'Âm đi tới vật cản rồi dội lại nên quãng đường âm đi bằng 2d. Tốc độ âm: không khí khoảng 340 m/s, nước 1500 m/s, thép 6100 m/s. Nghe rõ tiếng vang khi âm phản xạ đến tai chậm hơn âm trực tiếp ít nhất 1/15 giây.',
    aiHint: 'Các bài tiếng vang, phản xạ âm, siêu âm đo độ sâu đáy biển: biết thời gian từ lúc phát âm đến lúc nghe (thu) được âm phản xạ, tính khoảng cách đến vật cản; hoặc ngược lại.',
    scene: 'echo',
    fromText: (text) => defined({ v: /nước|biển|siêu âm/.test(text) ? 1500 : /thép|sắt|đường ray/.test(text) ? 6100 : undefined }),
    interpret: ({ t }) => (t >= 1 / 15 ? 'Âm phản xạ đến chậm hơn âm trực tiếp từ 1/15 s trở lên: nghe được tiếng vang.' : 'Thời gian ngắn hơn 1/15 s: âm phản xạ gần như trùng âm trực tiếp, không nghe được tiếng vang.')
  },

  /* ---------------- Quang học ---------------- */
  {
    id: 'chiet-suat',
    title: 'Chiết Suất Của Môi Trường',
    group: 'Quang học',
    topic: 'Khúc xạ ánh sáng',
    target: { key: 'n', symbol: 'n', latex: 'n', label: 'Chiết suất', unit: '', min: 1, max: 3, step: 0.01, defaultVal: 1.33 },
    coef: 300000,
    factors: [
      { key: 'v', symbol: 'v', latex: 'v', label: 'Tốc độ ánh sáng trong môi trường', unit: 'km/s', min: 100000, max: 300000, step: 100, defaultVal: 225564, exp: -1 }
    ],
    latex: 'n = \\frac{c}{v}, \\quad c = 300\\,000 \\text{ km/s}',
    conditions: 'c là tốc độ ánh sáng trong chân không (khoảng 300 000 km/s). Nước n ≈ 1,33; thủy tinh n ≈ 1,5; kim cương n ≈ 2,42.',
    aiHint: 'Các bài tính chiết suất của môi trường khi biết tốc độ ánh sáng trong môi trường đó, hoặc tính tốc độ ánh sáng khi biết chiết suất.'
  },
  {
    id: 'thau-kinh-hoi-tu',
    kind: 'sum',
    power: -1,
    title: 'Thấu Kính Hội Tụ: Vị Trí Ảnh',
    group: 'Quang học',
    topic: 'Thấu kính',
    target: { key: 'dp', symbol: "d'", latex: "d'", label: 'Khoảng cách từ ảnh đến thấu kính', unit: 'cm', min: -300, max: 300, step: 0.1, defaultVal: 15, cue: 'ảnh' },
    factors: [
      { key: 'f', symbol: 'f', latex: 'f', label: 'Tiêu cự', unit: 'cm', min: 1, max: 100, step: 0.5, defaultVal: 10, weight: 1, cue: '(tiêu cự|tiêu điểm)' },
      { key: 'd', symbol: 'd', latex: 'd', label: 'Khoảng cách từ vật đến thấu kính', unit: 'cm', min: 1, max: 300, step: 0.5, defaultVal: 30, weight: -1, cue: '(vật|cách thấu kính|cách kính|trước thấu kính)' }
    ],
    latex: "\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d'}",
    conditions: "d' > 0: ảnh thật ở sau thấu kính; d' < 0: ảnh ảo cùng phía với vật. Chiều cao ảnh h' = h·|d'|/d. Vật đặt đúng tiêu điểm (d = f) thì không thu được ảnh.",
    aiHint: 'Các bài vẽ và xác định ảnh của vật qua thấu kính hội tụ: cho tiêu cự và khoảng cách vật (hoặc ảnh) đến thấu kính, tính khoảng cách còn lại và nêu tính chất ảnh.',
    scene: 'lens',
    interpret: ({ dp, d }) => {
      if (!Number.isFinite(dp) || Math.abs(dp) > 1e6) return 'Vật đặt tại tiêu điểm: chùm tia ló song song, không thu được ảnh.';
      const k = Math.abs(dp) / d;
      const size = k > 1.001 ? `lớn hơn vật ${fmtPlain(k)} lần` : k < 0.999 ? `nhỏ hơn vật (bằng ${fmtPlain(k)} lần vật)` : 'bằng vật';
      return dp > 0 ? `Ảnh thật, ngược chiều với vật, ${size}.` : `Ảnh ảo, cùng chiều với vật, ${size}.`;
    }
  },
  {
    id: 'thau-kinh-phan-ki',
    kind: 'sum',
    power: -1,
    title: 'Thấu Kính Phân Kì: Vị Trí Ảnh',
    group: 'Quang học',
    topic: 'Thấu kính',
    target: { key: 'dp', symbol: "d'", latex: "d'", label: 'Khoảng cách từ ảnh ảo đến thấu kính', unit: 'cm', min: 0.1, max: 100, step: 0.1, defaultVal: 7.5, cue: 'ảnh' },
    factors: [
      { key: 'f', symbol: 'f', latex: 'f', label: 'Tiêu cự', unit: 'cm', min: 1, max: 100, step: 0.5, defaultVal: 10, weight: 1, cue: '(tiêu cự|tiêu điểm)' },
      { key: 'd', symbol: 'd', latex: 'd', label: 'Khoảng cách từ vật đến thấu kính', unit: 'cm', min: 1, max: 300, step: 0.5, defaultVal: 30, weight: 1, cue: '(vật|cách thấu kính|cách kính|trước thấu kính)' }
    ],
    latex: "\\frac{1}{f} = \\frac{1}{d'} - \\frac{1}{d}",
    conditions: "Vật thật qua thấu kính phân kì luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật, nằm trong khoảng tiêu cự. Ở đây f, d, d' đều là độ lớn.",
    aiHint: 'Các bài xác định ảnh của vật qua thấu kính phân kì: cho tiêu cự và khoảng cách vật đến thấu kính, tính khoảng cách từ ảnh đến thấu kính.',
    scene: 'lens-diverging',
    interpret: ({ dp, d }) => `Ảnh ảo, cùng chiều, nhỏ hơn vật (bằng ${fmtPlain(dp / d)} lần vật), nằm trong khoảng tiêu cự.`
  },
  {
    id: 'chieu-cao-anh',
    title: 'Chiều Cao Của Ảnh Qua Thấu Kính',
    group: 'Quang học',
    topic: 'Thấu kính',
    target: { key: 'hp', symbol: "h'", latex: "h'", label: 'Chiều cao của ảnh', unit: 'cm', min: 0.01, max: 500, step: 0.01, defaultVal: 1, cue: 'ảnh cao' },
    coef: 1,
    factors: [
      { key: 'h', symbol: 'h', latex: 'h', label: 'Chiều cao của vật', unit: 'cm', min: 0.1, max: 500, step: 0.1, defaultVal: 2, exp: 1, cue: '(vật cao|cao)' },
      { key: 'dp', symbol: "d'", latex: "d'", label: 'Khoảng cách từ ảnh đến thấu kính', unit: 'cm', min: 0.1, max: 1000, step: 0.1, defaultVal: 15, exp: 1, cue: 'ảnh' },
      { key: 'd', symbol: 'd', latex: 'd', label: 'Khoảng cách từ vật đến thấu kính', unit: 'cm', min: 0.1, max: 1000, step: 0.1, defaultVal: 30, exp: -1, cue: '(vật|cách thấu kính)' }
    ],
    latex: "\\frac{h'}{h} = \\frac{d'}{d}",
    conditions: 'Suy ra từ hai tam giác đồng dạng tạo bởi tia đi qua quang tâm. Dùng độ lớn của các khoảng cách.',
    aiHint: 'Các bài tính chiều cao của ảnh (hoặc của vật) khi đã biết khoảng cách từ vật và từ ảnh đến thấu kính.'
  },
  {
    id: 'kinh-lup',
    title: 'Số Bội Giác Của Kính Lúp',
    group: 'Quang học',
    topic: 'Kính lúp',
    target: { key: 'G', symbol: 'G', latex: 'G', label: 'Số bội giác', unit: '×', min: 1, max: 50, step: 0.1, defaultVal: 2.5 },
    coef: 25,
    factors: [
      { key: 'f', symbol: 'f', latex: 'f', label: 'Tiêu cự', unit: 'cm', min: 0.5, max: 25, step: 0.1, defaultVal: 10, exp: -1 }
    ],
    latex: 'G = \\frac{25}{f} \\quad (f \\text{ tính bằng cm})',
    conditions: 'Kính lúp là thấu kính hội tụ có tiêu cự ngắn. 25 cm là khoảng nhìn rõ ngắn nhất của mắt thường. Số bội giác càng lớn thì ảnh quan sát càng to.',
    aiHint: 'Các bài kính lúp: tính số bội giác khi biết tiêu cự, hoặc tính tiêu cự khi biết số bội giác (kính lúp ghi 2,5x, 5x...).',
    scene: 'lens'
  },

  /* ---------------- Điện học ---------------- */
  {
    id: 'dinh-luat-ohm-ct',
    title: 'Định Luật Ôm (Tính I, U hoặc R)',
    group: 'Điện học',
    topic: 'Định luật Ohm',
    target: { key: 'I', symbol: 'I', latex: 'I', label: 'Cường độ dòng điện', unit: 'A', min: 0.001, max: 100, step: 0.001, defaultVal: 0.5, alt: { unit: 'mA', factor: 1000 } },
    coef: 1,
    factors: [
      { key: 'U', symbol: 'U', latex: 'U', label: 'Hiệu điện thế', unit: 'V', min: 0.1, max: 1000, step: 0.1, defaultVal: 6, exp: 1 },
      { key: 'R', symbol: 'R', latex: 'R', label: 'Điện trở', unit: 'Ω', min: 0.1, max: 100000, step: 0.1, defaultVal: 12, exp: -1 }
    ],
    latex: 'I = \\frac{U}{R}',
    conditions: 'Cường độ dòng điện qua dây dẫn tỉ lệ thuận với hiệu điện thế giữa hai đầu dây và tỉ lệ nghịch với điện trở của dây. Đổi mA ra A khi tính.',
    aiHint: 'Các bài vận dụng định luật Ôm khi đề hỏi điện trở hoặc hiệu điện thế (biết U và I tìm R; biết I và R tìm U). Bài tính cường độ dòng điện từ U và R thì ưu tiên mẫu dinh-luat-ohm.',
    scene: 'series'
  },
  {
    id: 'dien-tro-day-dan',
    title: 'Điện Trở Của Dây Dẫn',
    group: 'Điện học',
    topic: 'Điện trở',
    target: { key: 'R', symbol: 'R', latex: 'R', label: 'Điện trở của dây', unit: 'Ω', min: 0.001, max: 100000, step: 0.001, defaultVal: 34 },
    coef: 1,
    factors: [
      { key: 'rho', symbol: 'ρ', latex: '\\rho', label: 'Điện trở suất (×10⁻⁸ Ω·m)', unit: '×10⁻⁸ Ω·m', min: 1, max: 200, step: 0.1, defaultVal: 1.7, exp: 1, scale: 1e-8, siUnit: 'Ω·m' },
      { key: 'l', symbol: 'l', latex: 'l', label: 'Chiều dài dây', unit: 'm', min: 0.01, max: 100000, step: 0.01, defaultVal: 100, exp: 1, cue: '(dài|chiều dài)' },
      { key: 'S', symbol: 'S', latex: 'S', label: 'Tiết diện dây', unit: 'mm²', min: 0.01, max: 100, step: 0.01, defaultVal: 0.05, exp: -1, scale: 1e-6, siUnit: 'm²', cue: '(tiết diện|tiết diện thẳng)' }
    ],
    latex: 'R = \\rho \\cdot \\frac{l}{S}',
    conditions: 'Điện trở suất (Ω·m): bạc 1,6·10⁻⁸; đồng 1,7·10⁻⁸; nhôm 2,8·10⁻⁸; vonfram 5,5·10⁻⁸; sắt 12·10⁻⁸; nikelin 40·10⁻⁸; constantan 50·10⁻⁸; nicrom 110·10⁻⁸. Tiết diện đổi ra m² (1 mm² = 10⁻⁶ m²).',
    aiHint: 'Các bài tính điện trở của dây dẫn theo chiều dài, tiết diện và vật liệu làm dây (đồng, nhôm, nikelin, nicrom...), hoặc tìm chiều dài, tiết diện của dây.',
    scene: 'wire',
    fromText: (text) => defined({ rho: lookup(text, RESISTIVITY) })
  },
  {
    id: 'dien-tro-noi-tiep',
    kind: 'sum',
    power: 1,
    title: 'Điện Trở Tương Đương Mắc Nối Tiếp',
    group: 'Điện học',
    topic: 'Đoạn mạch nối tiếp',
    target: { key: 'R', symbol: 'Rtđ', latex: 'R_{tđ}', label: 'Điện trở tương đương', unit: 'Ω', min: 0.1, max: 200000, step: 0.1, defaultVal: 30, cue: '(tương đương|toàn mạch|cả đoạn mạch)' },
    factors: [
      { key: 'R1', symbol: 'R1', latex: 'R_1', label: 'Điện trở R1', unit: 'Ω', min: 0.1, max: 100000, step: 0.1, defaultVal: 10, weight: 1 },
      { key: 'R2', symbol: 'R2', latex: 'R_2', label: 'Điện trở R2', unit: 'Ω', min: 0.1, max: 100000, step: 0.1, defaultVal: 20, weight: 1 }
    ],
    latex: 'R_{tđ} = R_1 + R_2',
    conditions: 'Trong đoạn mạch nối tiếp, cường độ dòng điện như nhau tại mọi điểm và hiệu điện thế hai đầu đoạn mạch bằng tổng hiệu điện thế trên từng điện trở: U = U1 + U2.',
    aiHint: 'Các bài đoạn mạch gồm hai điện trở mắc nối tiếp: tính điện trở tương đương, hoặc tìm một điện trở khi biết điện trở tương đương.',
    scene: 'series'
  },
  {
    id: 'dien-tro-song-song',
    kind: 'sum',
    power: -1,
    title: 'Điện Trở Tương Đương Mắc Song Song',
    group: 'Điện học',
    topic: 'Đoạn mạch song song',
    target: { key: 'R', symbol: 'Rtđ', latex: 'R_{tđ}', label: 'Điện trở tương đương', unit: 'Ω', min: 0.01, max: 100000, step: 0.01, defaultVal: 6.67, cue: '(tương đương|toàn mạch|cả đoạn mạch)' },
    factors: [
      { key: 'R1', symbol: 'R1', latex: 'R_1', label: 'Điện trở R1', unit: 'Ω', min: 0.1, max: 100000, step: 0.1, defaultVal: 10, weight: 1 },
      { key: 'R2', symbol: 'R2', latex: 'R_2', label: 'Điện trở R2', unit: 'Ω', min: 0.1, max: 100000, step: 0.1, defaultVal: 20, weight: 1 }
    ],
    latex: '\\frac{1}{R_{tđ}} = \\frac{1}{R_1} + \\frac{1}{R_2}',
    conditions: 'Trong đoạn mạch song song, hiệu điện thế hai đầu mỗi nhánh như nhau và cường độ dòng điện mạch chính bằng tổng cường độ các nhánh: I = I1 + I2. Điện trở tương đương nhỏ hơn mỗi điện trở thành phần.',
    aiHint: 'Các bài đoạn mạch gồm hai điện trở mắc song song: tính điện trở tương đương, hoặc tìm một điện trở khi biết điện trở tương đương.',
    scene: 'parallel',
    interpret: ({ R, R1, R2 }) => (R > 0 && (R >= R1 || R >= R2) ? 'Số liệu không hợp lí: điện trở tương đương mắc song song phải nhỏ hơn mỗi điện trở thành phần.' : null)
  },
  {
    id: 'cong-suat-dien',
    title: 'Công Suất Điện',
    group: 'Điện học',
    topic: 'Năng lượng điện',
    target: { key: 'P', symbol: '𝒫', latex: '\\mathcal{P}', label: 'Công suất điện', unit: 'W', min: 0, max: 10000, step: 1, defaultVal: 60, alt: { unit: 'kW', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'U', symbol: 'U', latex: 'U', label: 'Hiệu điện thế', unit: 'V', min: 1, max: 240, step: 0.5, defaultVal: 220, exp: 1 },
      { key: 'I', symbol: 'I', latex: 'I', label: 'Cường độ dòng điện', unit: 'A', min: 0.01, max: 50, step: 0.01, defaultVal: 0.27, exp: 1 }
    ],
    latex: '\\mathcal{P} = U \\cdot I',
    conditions: 'U là hiệu điện thế giữa hai đầu dụng cụ điện, I là cường độ dòng điện chạy qua nó.',
    aiHint: 'Các bài toán về công suất của bóng đèn, bàn là, ấm điện: cho hiệu điện thế và cường độ dòng điện, hỏi công suất; hoặc cho công suất định mức và hỏi cường độ dòng điện.',
    scene: 'series'
  },
  {
    id: 'dien-nang',
    title: 'Năng Lượng Điện Tiêu Thụ',
    group: 'Điện học',
    topic: 'Năng lượng điện',
    target: { key: 'A', symbol: 'W', latex: 'W', label: 'Năng lượng điện', unit: 'J', min: 0, max: 100000000, step: 1, defaultVal: 360000, alt: { unit: 'kW·h', factor: 1 / 3600000 } },
    coef: 1,
    factors: [
      { key: 'P', symbol: '𝒫', latex: '\\mathcal{P}', label: 'Công suất điện', unit: 'W', min: 1, max: 5000, step: 1, defaultVal: 100, exp: 1, alt: { unit: 'kW', factor: 0.001 } },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian sử dụng', unit: 's', min: 1, max: 86400, step: 1, defaultVal: 3600, exp: 1, alt: { unit: 'giờ', factor: 1 / 3600 } }
    ],
    latex: 'W = \\mathcal{P} \\cdot t',
    conditions: 'Tính bằng oát và giây thì được jun. 1 kW·h = 3 600 000 J (một "số điện").',
    aiHint: 'Các bài toán tính điện năng tiêu thụ hoặc số điện của một dụng cụ khi biết công suất và thời gian sử dụng.'
  },
  {
    id: 'nhiet-luong-toa-ra',
    title: 'Nhiệt Lượng Tỏa Ra Trên Dây Dẫn (Jun – Len-xơ)',
    group: 'Điện học',
    topic: 'Tác dụng nhiệt của dòng điện',
    target: { key: 'Q', symbol: 'Q', latex: 'Q', label: 'Nhiệt lượng tỏa ra', unit: 'J', min: 0, max: 100000000, step: 1, defaultVal: 60000, alt: { unit: 'kJ', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'I', symbol: 'I', latex: 'I', label: 'Cường độ dòng điện', unit: 'A', min: 0.01, max: 50, step: 0.01, defaultVal: 2, exp: 2 },
      { key: 'R', symbol: 'R', latex: 'R', label: 'Điện trở', unit: 'Ω', min: 0.1, max: 10000, step: 0.1, defaultVal: 25, exp: 1 },
      { key: 't', symbol: 't', latex: 't', label: 'Thời gian', unit: 's', min: 1, max: 86400, step: 1, defaultVal: 600, exp: 1, alt: { unit: 'phút', factor: 1 / 60 } }
    ],
    latex: 'Q = I^2 \\cdot R \\cdot t',
    conditions: 'Nhiệt lượng tỏa ra ở dây dẫn tỉ lệ thuận với bình phương cường độ dòng điện, với điện trở và thời gian dòng điện chạy qua. Thời gian tính bằng giây.',
    aiHint: 'Các bài tính nhiệt lượng tỏa ra trên dây dẫn, điện trở, dây đốt của bếp điện, ấm điện khi có dòng điện chạy qua (định luật Jun – Len-xơ).',
    scene: 'heat'
  },
  {
    id: 'cong-suat-hao-phi',
    title: 'Hao Phí Khi Truyền Tải Điện Năng',
    group: 'Điện học',
    topic: 'Truyền tải điện năng',
    target: { key: 'Php', symbol: '𝒫hp', latex: '\\mathcal{P}_{hp}', label: 'Công suất hao phí', unit: 'W', min: 0, max: 100000000, step: 1, defaultVal: 2000, alt: { unit: 'kW', factor: 0.001 }, cue: 'hao phí' },
    coef: 1,
    factors: [
      { key: 'R', symbol: 'R', latex: 'R', label: 'Điện trở đường dây', unit: 'Ω', min: 0.1, max: 10000, step: 0.1, defaultVal: 50, exp: 1 },
      { key: 'P', symbol: '𝒫', latex: '\\mathcal{P}', label: 'Công suất cần truyền tải', unit: 'W', min: 100, max: 1000000000, step: 100, defaultVal: 100000, exp: 2, alt: { unit: 'kW', factor: 0.001 }, cue: '(truyền|truyền tải|cần tải)' },
      { key: 'U', symbol: 'U', latex: 'U', label: 'Hiệu điện thế truyền tải', unit: 'V', min: 100, max: 1000000, step: 100, defaultVal: 10000, exp: -2, alt: { unit: 'kV', factor: 0.001 } }
    ],
    latex: '\\mathcal{P}_{hp} = \\frac{R \\cdot \\mathcal{P}^2}{U^2}',
    conditions: 'Hao phí do tỏa nhiệt trên đường dây. Tăng hiệu điện thế lên n lần thì hao phí giảm n² lần, vì vậy phải dùng máy biến áp tăng thế ở nhà máy điện.',
    aiHint: 'Các bài tính công suất hao phí do tỏa nhiệt trên đường dây tải điện khi biết điện trở đường dây, công suất và hiệu điện thế truyền tải.'
  },
  {
    id: 'may-bien-ap',
    title: 'Máy Biến Áp',
    group: 'Điện học',
    topic: 'Truyền tải điện năng',
    target: { key: 'U2', symbol: 'U2', latex: 'U_2', label: 'Hiệu điện thế cuộn thứ cấp', unit: 'V', min: 0.1, max: 1000000, step: 0.1, defaultVal: 12, cue: 'thứ cấp' },
    coef: 1,
    factors: [
      { key: 'U1', symbol: 'U1', latex: 'U_1', label: 'Hiệu điện thế cuộn sơ cấp', unit: 'V', min: 0.1, max: 1000000, step: 0.1, defaultVal: 220, exp: 1, cue: 'sơ cấp' },
      { key: 'N2', symbol: 'N2', latex: 'N_2', label: 'Số vòng cuộn thứ cấp', unit: 'vòng', min: 1, max: 1000000, step: 1, defaultVal: 120, exp: 1, cue: 'thứ cấp' },
      { key: 'N1', symbol: 'N1', latex: 'N_1', label: 'Số vòng cuộn sơ cấp', unit: 'vòng', min: 1, max: 1000000, step: 1, defaultVal: 2200, exp: -1, cue: 'sơ cấp' }
    ],
    latex: '\\frac{U_1}{U_2} = \\frac{N_1}{N_2}',
    conditions: 'Hiệu điện thế ở hai đầu mỗi cuộn dây tỉ lệ với số vòng dây. N2 > N1: máy tăng thế; N2 < N1: máy hạ thế. Máy chỉ hoạt động với dòng điện xoay chiều.',
    aiHint: 'Các bài máy biến áp (biến thế): cho số vòng dây cuộn sơ cấp, thứ cấp và một hiệu điện thế, tính hiệu điện thế hoặc số vòng còn lại.',
    interpret: ({ N1, N2 }) => (N2 > N1 ? 'N2 > N1: máy tăng thế.' : N2 < N1 ? 'N2 < N1: máy hạ thế.' : null)
  },

  /* ---------------- Nhiệt học ---------------- */
  {
    id: 'nhiet-luong',
    title: 'Nhiệt Lượng Làm Nóng Vật',
    group: 'Nhiệt học',
    topic: 'Nhiệt lượng',
    target: { key: 'Q', symbol: 'Q', latex: 'Q', label: 'Nhiệt lượng', unit: 'J', min: 0, max: 10000000, step: 1, defaultVal: 84000, alt: { unit: 'kJ', factor: 0.001 } },
    coef: 1,
    factors: [
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng', unit: 'kg', min: 0.05, max: 50, step: 0.05, defaultVal: 1, exp: 1 },
      { key: 'c', symbol: 'c', latex: 'c', label: 'Nhiệt dung riêng', unit: 'J/(kg·K)', min: 100, max: 5000, step: 10, defaultVal: 4200, exp: 1 },
      { key: 'dt', symbol: 'Δt', latex: '\\Delta t', label: 'Độ tăng nhiệt độ', unit: '°C', min: 1, max: 200, step: 1, defaultVal: 20, exp: 1 }
    ],
    latex: 'Q = m \\cdot c \\cdot \\Delta t',
    conditions: 'Δt là nhiệt độ sau trừ nhiệt độ đầu. Nhiệt dung riêng: nước 4200, nhôm 880, đồng 380, sắt 460 J/(kg·K). Bỏ qua nhiệt truyền ra môi trường.',
    aiHint: 'Các bài toán đun nóng nước hoặc kim loại: tính nhiệt lượng cần cung cấp để vật tăng nhiệt độ, hoặc tìm khối lượng, độ tăng nhiệt độ khi biết nhiệt lượng.',
    scene: 'heat',
    fromText: (text) => {
      // "từ 20°C lên 100°C": độ tăng nhiệt độ là hiệu hai nhiệt độ
      const temps = [...text.matchAll(/(-?\d+(?:[.,]\d+)?)\s*(?:°\s*c|độ\s*c|oc)(?![a-zà-ỹ])/g)].map((m) => parseFloat(m[1].replace(',', '.')));
      return defined({ c: lookup(text, SPECIFIC_HEAT), dt: temps.length === 2 ? Math.abs(temps[1] - temps[0]) : undefined });
    }
  },
  {
    id: 'can-bang-nhiet',
    kind: 'custom',
    title: 'Phương Trình Cân Bằng Nhiệt',
    group: 'Nhiệt học',
    topic: 'Truyền nhiệt',
    target: { key: 't', symbol: 't', latex: 't', label: 'Nhiệt độ khi cân bằng', unit: '°C', min: -50, max: 1000, step: 0.1, defaultVal: 24, cue: 'cân bằng' },
    factors: [
      { key: 'm1', symbol: 'm1', latex: 'm_1', label: 'Khối lượng vật tỏa nhiệt (nóng)', unit: 'kg', min: 0.01, max: 100, step: 0.01, defaultVal: 0.5 },
      { key: 'c1', symbol: 'c1', latex: 'c_1', label: 'Nhiệt dung riêng vật tỏa nhiệt', unit: 'J/(kg·K)', min: 100, max: 5000, step: 10, defaultVal: 880 },
      { key: 't1', symbol: 't1', latex: 't_1', label: 'Nhiệt độ đầu vật tỏa nhiệt', unit: '°C', min: -50, max: 1000, step: 0.1, defaultVal: 100 },
      { key: 'm2', symbol: 'm2', latex: 'm_2', label: 'Khối lượng vật thu nhiệt (lạnh)', unit: 'kg', min: 0.01, max: 100, step: 0.01, defaultVal: 2 },
      { key: 'c2', symbol: 'c2', latex: 'c_2', label: 'Nhiệt dung riêng vật thu nhiệt', unit: 'J/(kg·K)', min: 100, max: 5000, step: 10, defaultVal: 4200 },
      { key: 't2', symbol: 't2', latex: 't_2', label: 'Nhiệt độ đầu vật thu nhiệt', unit: '°C', min: -50, max: 1000, step: 0.1, defaultVal: 20 }
    ],
    solve: {
      t: ({ m1, c1, t1, m2, c2, t2 }) => (m1 * c1 * t1 + m2 * c2 * t2) / (m1 * c1 + m2 * c2),
      m1: ({ t, c1, t1, m2, c2, t2 }) => (m2 * c2 * (t - t2)) / (c1 * (t1 - t)),
      c1: ({ t, m1, t1, m2, c2, t2 }) => (m2 * c2 * (t - t2)) / (m1 * (t1 - t)),
      t1: ({ t, m1, c1, m2, c2, t2 }) => t + (m2 * c2 * (t - t2)) / (m1 * c1),
      m2: ({ t, m1, c1, t1, c2, t2 }) => (m1 * c1 * (t1 - t)) / (c2 * (t - t2)),
      c2: ({ t, m1, c1, t1, m2, t2 }) => (m1 * c1 * (t1 - t)) / (m2 * (t - t2)),
      t2: ({ t, m1, c1, t1, m2, c2 }) => t - (m1 * c1 * (t1 - t)) / (m2 * c2)
    },
    rearranged: {
      t: (s) => `\\frac{${s('m1')} \\cdot ${s('c1')} \\cdot ${s('t1')} + ${s('m2')} \\cdot ${s('c2')} \\cdot ${s('t2')}}{${s('m1')} \\cdot ${s('c1')} + ${s('m2')} \\cdot ${s('c2')}}`,
      m1: (s) => `\\frac{${s('m2')} \\cdot ${s('c2')} \\cdot (${s('t')} - ${s('t2')})}{${s('c1')} \\cdot (${s('t1')} - ${s('t')})}`,
      c1: (s) => `\\frac{${s('m2')} \\cdot ${s('c2')} \\cdot (${s('t')} - ${s('t2')})}{${s('m1')} \\cdot (${s('t1')} - ${s('t')})}`,
      t1: (s) => `${s('t')} + \\frac{${s('m2')} \\cdot ${s('c2')} \\cdot (${s('t')} - ${s('t2')})}{${s('m1')} \\cdot ${s('c1')}}`,
      m2: (s) => `\\frac{${s('m1')} \\cdot ${s('c1')} \\cdot (${s('t1')} - ${s('t')})}{${s('c2')} \\cdot (${s('t')} - ${s('t2')})}`,
      c2: (s) => `\\frac{${s('m1')} \\cdot ${s('c1')} \\cdot (${s('t1')} - ${s('t')})}{${s('m2')} \\cdot (${s('t')} - ${s('t2')})}`,
      t2: (s) => `${s('t')} - \\frac{${s('m1')} \\cdot ${s('c1')} \\cdot (${s('t1')} - ${s('t')})}{${s('m2')} \\cdot ${s('c2')}}`
    },
    latex: 'Q_{tỏa} = Q_{thu} \\;\\Leftrightarrow\\; m_1 c_1 (t_1 - t) = m_2 c_2 (t - t_2)',
    conditions: 'Nhiệt truyền từ vật nóng hơn sang vật lạnh hơn cho tới khi hai vật cùng nhiệt độ t, với t2 < t < t1. Bỏ qua nhiệt truyền cho bình chứa và môi trường.',
    aiHint: 'Các bài thả một vật nóng (quả cầu nhôm, miếng đồng...) vào nước lạnh, hoặc pha nước nóng với nước lạnh: tính nhiệt độ khi cân bằng nhiệt, hoặc tìm khối lượng, nhiệt độ ban đầu, nhiệt dung riêng.',
    scene: 'mixing',
    fromText: (text) => defined({ c1: lookup(text, SPECIFIC_HEAT, 0), c2: lookup(text, SPECIFIC_HEAT, 1) }),
    // Đề hay kể vật lạnh (nước trong bình) trước: đổi chỗ để vật 1 luôn là vật nóng hơn
    normalize: (v) => {
      if (v.t1 === undefined || v.t2 === undefined || v.t1 >= v.t2) return v;
      const out: Values = { ...v };
      for (const [a, b] of [['m1', 'm2'], ['c1', 'c2'], ['t1', 't2']]) {
        delete out[a];
        delete out[b];
        if (v[b] !== undefined) out[a] = v[b];
        if (v[a] !== undefined) out[b] = v[a];
      }
      return out;
    },
    interpret: ({ t, t1, t2 }) => (t > Math.max(t1, t2) || t < Math.min(t1, t2) ? 'Số liệu không hợp lí: nhiệt độ cân bằng phải nằm giữa nhiệt độ đầu của hai vật.' : null)
  },
  {
    id: 'nhiet-luong-nhien-lieu',
    title: 'Nhiệt Lượng Do Nhiên Liệu Bị Đốt Cháy',
    group: 'Nhiệt học',
    topic: 'Năng suất tỏa nhiệt',
    target: { key: 'Q', symbol: 'Q', latex: 'Q', label: 'Nhiệt lượng tỏa ra', unit: 'J', min: 0, max: 100000000000, step: 1, defaultVal: 46000000, alt: { unit: 'MJ', factor: 1e-6 } },
    coef: 1,
    factors: [
      { key: 'q', symbol: 'q', latex: 'q', label: 'Năng suất tỏa nhiệt (MJ/kg)', unit: 'MJ/kg', min: 1, max: 150, step: 0.1, defaultVal: 46, exp: 1, scale: 1e6, siUnit: 'J/kg' },
      { key: 'm', symbol: 'm', latex: 'm', label: 'Khối lượng nhiên liệu', unit: 'kg', min: 0.01, max: 10000, step: 0.01, defaultVal: 1, exp: 1 }
    ],
    latex: 'Q = q \\cdot m',
    conditions: 'Nhiên liệu cháy hoàn toàn. Năng suất tỏa nhiệt: củi khô 10·10⁶, than đá 27·10⁶, dầu hỏa 44·10⁶, xăng 46·10⁶, hiđrô 120·10⁶ J/kg.',
    aiHint: 'Các bài tính nhiệt lượng tỏa ra khi đốt cháy hoàn toàn nhiên liệu (xăng, dầu, than, củi), hoặc tìm khối lượng nhiên liệu cần đốt.',
    scene: 'heat',
    fromText: (text) => defined({ q: lookup(text, HEAT_OF_COMBUSTION) })
  }
];

/** Số gọn để ghép vào câu nhận xét (không dùng LaTeX). */
function fmtPlain(x: number): string {
  return String(Number(x.toPrecision(3))).replace('.', ',');
}
