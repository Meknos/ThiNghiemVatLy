import { describe, expect, it } from 'vitest';
import { formulaMissing, keywordMissing, keywordParts, resolvePartParams, splitSubQuestions, suggestValue, ProblemPart } from './parts';
import { getExperimentById } from './registry';
import { ParamDef } from './types';

const tpl = (id: string) => getExperimentById(id)!;

describe('Đề nhiều câu: câu sau lấy kết quả câu trước', () => {
  // VĐ 1: kéo vật từ giếng sâu 8 m trong 30 s bằng lực 180 N; hỏi công và công suất
  const parts: ProblemPart[] = [
    { templateId: 'cong-co-hoc', title: 'Tính công A', params: { F: 180, s: 8, find: 1 }, links: {}, missing: [], asks: ['công A'] },
    { templateId: 'cong-suat', title: 'Tính công suất', params: { t: 30, find: 1 }, links: { A: { from: 0, quantity: 'A' } }, missing: [], asks: ['công suất'] }
  ];

  it('công suất dùng công A = 1440 J của câu 1', () => {
    const p = resolvePartParams(parts, [], 1);
    expect(p).toMatchObject({ A: 1440, t: 30, find: 1 });
    expect(tpl('cong-suat').compute(p)['𝒫']).toBeCloseTo(48);
  });

  it('giáo viên chỉnh số liệu câu 1 thì câu 2 cập nhật theo', () => {
    const p = resolvePartParams(parts, [{ F: 200, s: 8, find: 1, A: 0 }], 1);
    expect(p.A).toBe(1600);
  });

  it('đổi đơn vị khi hai mẫu dùng đơn vị khác nhau (dm³ → cm³)', () => {
    // Câu 1 tìm thể tích 2 kg nước (tính bằng dm³), câu 2 tính lực đẩy với thể tích tính bằng cm³
    const chain: ProblemPart[] = [
      { templateId: 'khoi-luong-rieng-ct', title: '', params: { D: 1000, m: 2, find: 3 }, links: {}, missing: [], asks: [] },
      { templateId: 'luc-day-ac-si-met-ct', title: '', params: { d: 10000, find: 1 }, links: { V: { from: 0, quantity: 'V' } }, missing: [], asks: [] }
    ];
    expect(resolvePartParams(chain, [], 1).V).toBeCloseTo(2000);
  });
});

describe('Số liệu còn thiếu', () => {
  it('mẫu công thức: mọi đại lượng trừ đại lượng cần tìm, đã cho và lấy từ câu trước', () => {
    expect(formulaMissing(tpl('cong-suat'), { find: 1 })).toEqual(['A', 't']);
    expect(formulaMissing(tpl('cong-suat'), { t: 30, find: 1 }, ['A'])).toEqual([]);
    expect(formulaMissing(tpl('cong-suat'), { P: 100, find: 3 })).toEqual(['A']);
  });

  it('dò từ khóa ở mẫu trực quan: hỏi đại lượng đo, không hỏi tham số lựa chọn', () => {
    // VĐ 3: chiếu laze vào khối thủy tinh, đề không cho góc tới
    expect(keywordMissing(tpl('khuc-xa-anh-sang'), { n: 1.5 })).toEqual(['i']);
    expect(keywordMissing(tpl('luc-va-chuyen-dong'), { scene: 1 })).toEqual([]);
  });
});

describe('Giá trị gợi ý ngẫu nhiên', () => {
  const def: ParamDef = { label: 'Thời gian', symbol: 't', unit: 's', min: 1, max: 3600, step: 1, defaultVal: 30 };

  it('nằm trong khoảng cho phép, là bội của bước, gọn 2 chữ số', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      const v = suggestValue(def, () => r);
      expect(v).toBeGreaterThanOrEqual(15);
      expect(v).toBeLessThanOrEqual(60);
      expect(Number.isInteger(v)).toBe(true);
      expect(Number(v.toPrecision(2))).toBe(v);
    }
  });

  it('đại lượng lẻ thập phân và bị chặn bởi giới hạn', () => {
    const n: ParamDef = { label: 'Chiết suất', symbol: 'n', unit: '', min: 1, max: 2.5, step: 0.01, defaultVal: 1.5 };
    expect(suggestValue(n, () => 0.999)).toBe(2.5);
    expect(suggestValue(n, () => 0)).toBe(1);
    const angle: ParamDef = { label: 'Góc tới', symbol: 'i', unit: '°', min: 0, max: 85, step: 1, defaultVal: 45 };
    expect(suggestValue(angle, () => 0.5)).toBe(45);
  });

  it('tham số lựa chọn chỉ nhận số trong danh sách', () => {
    const choice: ParamDef = { label: 'Chiều truyền', symbol: 'Chiều', unit: '', min: 1, max: 2, step: 1, defaultVal: 1 };
    expect(suggestValue(choice, () => 0)).toBe(1);
    expect(suggestValue(choice, () => 0.99)).toBe(2);
  });
});

describe('Dò từ khóa (không có AI) với đề nhiều câu', () => {
  it('VĐ 1: "công và công suất" tách thành hai câu nối nhau', () => {
    const { parts } = keywordParts('Một người kéo đều một vật từ giếng sâu 8 m trong 30 giây. Người ấy phải dùng một lực F = 180 N. Công và công suất của người kéo là bao nhiêu?');
    expect(parts.map((p) => p.templateId)).toEqual(['cong-co-hoc', 'cong-suat']);
    expect(parts[0]).toMatchObject({ params: { F: 180, s: 8, find: 1 }, missing: [] });
    expect(parts[1]).toMatchObject({ params: { t: 30, find: 1 }, missing: [] });
    expect(resolvePartParams(parts, [], 1).A).toBe(1440);
  });

  it('đề chỉ hỏi công suất vẫn là một câu', () => {
    expect(keywordParts('Một người thực hiện công 3000 J trong 1 phút. Tính công suất.').parts).toHaveLength(1);
    expect(keywordParts('Một người thực hiện công 3000 J trong 1 phút, tính công suất của người đó.').parts).toHaveLength(1);
    expect(keywordParts('Tính công và công suất của động cơ.').parts).toHaveLength(2);
  });

  it('VĐ 3: laze song song với bề mặt khối thủy tinh: dựng khúc xạ, góc tới sát 90° (85°)', () => {
    const { parts } = keywordParts('Chiếu một tia laze (laser) từ không khí song song với bề mặt một khối thủy tinh dày, trong suốt. Hiện tượng xảy ra là gì?');
    expect(parts[0]).toMatchObject({ templateId: 'khuc-xa-anh-sang', params: { n: 1.5, i: 85 }, missing: [] });
  });

  it('tia sáng vuông góc với mặt nước: góc tới 0; không nêu góc thì hỏi góc tới', () => {
    expect(keywordParts('Chiếu một tia sáng vuông góc với mặt nước. Tia sáng truyền như thế nào?').parts[0]).toMatchObject({ templateId: 'khuc-xa-anh-sang', params: { i: 0, n: 1.33 }, missing: [] });
    expect(keywordParts('Chiếu tia laze vào một khối thủy tinh. Quan sát đường đi của tia sáng.').parts[0]).toMatchObject({ templateId: 'khuc-xa-anh-sang', missing: ['i'] });
  });
});

describe('Dò từ khóa: vật chìm hoàn toàn', () => {
  it('không hỏi lại phần thể tích nhúng khi đề nói chìm hoàn toàn', () => {
    const { parts } = keywordParts('Một vật được thả chìm hoàn toàn trong nước. Tính lực đẩy Ác-si-mét tác dụng lên vật.');
    expect(parts[0]).toMatchObject({ templateId: 'luc-day-archimedes', params: { immersed: 100, d_liquid: 10000 } });
    expect(parts[0].missing).not.toContain('immersed');
  });
});

describe('Dò từ khóa: đề có câu a), b), c)', () => {
  it('tách câu con theo đúng thứ tự, bỏ qua chữ cái lẻ', () => {
    const s = splitSubQuestions('Ấm điện 220V - 1000W. a) Tính I. b) Tính R. c) Tính điện năng trong 30 phút.');
    expect(s?.stem).toBe('Ấm điện 220V - 1000W.');
    expect(s?.questions.map((q) => q.label)).toEqual(['a', 'b', 'c']);
    expect(s?.questions[2].text).toBe('Tính điện năng trong 30 phút.');
    expect(splitSubQuestions('Tính áp suất của khối sắt 2 kg trên diện tích 10 cm².')).toBeNull();
    expect(splitSubQuestions('Câu 1) Tính công. Câu 2) Tính công suất.')?.questions.length).toBe(2);
  });

  it('ấm điện: I ở câu a, R lấy I từ câu a, điện năng ở câu c', () => {
    const { parts } = keywordParts('Một ấm điện có ghi 220V - 1000W được sử dụng ở hiệu điện thế 220 V. a) Tính cường độ dòng điện chạy qua ấm. b) Tính điện trở của ấm. c) Tính điện năng ấm tiêu thụ trong 30 phút.');
    expect(parts.map((p) => p.templateId)).toEqual(['cong-suat-dien', 'dinh-luat-ohm-ct', 'dien-nang']);
    expect(parts[1].links).toEqual({ I: { from: 0, quantity: 'I' } });
    expect(parts.every((p) => p.missing.length === 0)).toBe(true);
    // I = 1000/220 ≈ 4,545 A; R = U/I = 48,4 Ω; W = 1000 W × 1800 s
    const ohm = resolvePartParams(parts, [], 1);
    expect(ohm.I).toBeCloseTo(4.545, 2);
    expect(getExperimentById('dinh-luat-ohm-ct')!.compute(ohm).R).toBeCloseTo(48.4, 1);
    expect(parts[2].params).toMatchObject({ P: 1000, t: 1800 });
  });

  it('khúc xạ hai câu: góc khúc xạ rồi góc tới giới hạn', () => {
    const { parts } = keywordParts('Chiếu một tia sáng từ không khí vào nước với góc tới 60°, chiết suất của nước là 1,33. a) Tính góc khúc xạ. b) Nếu chiếu tia sáng từ nước ra không khí thì góc tới giới hạn bằng bao nhiêu?');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({ templateId: 'khuc-xa-anh-sang', params: { i: 60, n: 1.33 } });
    expect(parts[1]).toMatchObject({ templateId: 'khuc-xa-anh-sang', params: { direction: 2 } });
    expect(parts[0].title).toBe('Câu a: Tính góc khúc xạ');
  });
});

describe('Dò từ khóa: chủ đề chưa có thí nghiệm', () => {
  it('nam châm, hóa học, sinh học thì báo chưa hỗ trợ', () => {
    for (const q of ['Vì sao nam châm hút được sắt?', 'Viết phương trình phản ứng hóa học khi đốt sắt.', 'Quang hợp diễn ra ở bộ phận nào của cây?']) {
      const r = keywordParts(q);
      expect(r.parts).toEqual([]);
      expect(r.message).toContain('chưa có thí nghiệm');
    }
  });

  it('không bắt nhầm đề vật lý có chữ gần giống', () => {
    expect(keywordParts('Nhà máy phát điện truyền tải công suất 100 kW bằng dây có điện trở 5 Ω dưới hiệu điện thế 10 kV. Tính công suất hao phí.').parts[0].templateId).toBe('cong-suat-hao-phi');
    expect(keywordParts('Thả một vật vào nước muối, tính lực đẩy Ác-si-mét biết thể tích vật 200 cm3.').parts[0].templateId).toBe('luc-day-archimedes');
  });
});

describe('Đề công, công suất có số liệu lớn', () => {
  it('cần cẩu 5000 N, ô tô đi 3 km: không bị cắt số', () => {
    const crane = keywordParts('Một cần cẩu nâng thùng hàng nặng 5000 N lên cao 12 m trong 20 giây. Tính công suất và công của cần cẩu.').parts;
    expect(crane[0].params).toMatchObject({ F: 5000, s: 12 });
    expect(getExperimentById('cong-suat')!.compute(resolvePartParams(crane, [], 1))['𝒫']).toBe(3000);
    const car = keywordParts('Một ô tô chuyển động đều với lực kéo 2000 N, đi quãng đường 3 km trong 5 phút. 1) Tính công của lực kéo. 2) Tính công suất của động cơ.').parts;
    expect(car[0].params).toMatchObject({ F: 2000, s: 3000 });
    expect(getExperimentById('cong-suat')!.compute(resolvePartParams(car, [], 1))['𝒫']).toBe(20000);
  });
});
