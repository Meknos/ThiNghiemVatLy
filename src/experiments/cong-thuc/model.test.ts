import { describe, it, expect } from 'vitest';
import { FORMULAS } from './formulas';
import { expressionLatex, fmt, fmtLatex, interpretSolution, solveFormula, variablesOf } from './model';
import { FORMULA_TEMPLATES } from './index';

const get = (id: string) => FORMULAS.find((f) => f.id === id)!;

describe('Thư viện công thức', () => {
  it('tốc độ: v = s / t, và tìm ngược lại s, t', () => {
    const def = get('toc-do');
    expect(solveFormula(def, { v: 0, s: 100, t: 20 }, 1).values.v).toBeCloseTo(5);
    expect(solveFormula(def, { v: 5, s: 0, t: 20 }, 2).values.s).toBeCloseTo(100);
    expect(solveFormula(def, { v: 5, s: 100, t: 0 }, 3).values.t).toBeCloseTo(20);
  });

  it('tốc độ: nhận được đề đường dài (ô tô 120 km, tàu hỏa 1726 km trong 30 giờ)', () => {
    const template = FORMULA_TEMPLATES.find((t) => t.id === 'toc-do')!;
    for (const params of [{ s: 120000, t: 9000 }, { s: 1726000, t: 108000 }]) {
      for (const [key, value] of Object.entries(params)) {
        expect(value).toBeLessThanOrEqual(template.params[key].max);
      }
    }
    expect(solveFormula(get('toc-do'), { v: 0, s: 120000, t: 9000 }, 1).values.v * 3.6).toBeCloseTo(48);
  });

  it('trọng lượng: P = 10·m, và m = P / 10', () => {
    const def = get('trong-luong');
    expect(solveFormula(def, { P: 0, m: 2.5 }, 1).values.P).toBeCloseTo(25);
    expect(solveFormula(def, { P: 500, m: 0 }, 2).values.m).toBeCloseTo(50);
  });

  it('công và công suất', () => {
    expect(solveFormula(get('cong-co-hoc'), { A: 0, F: 200, s: 15 }, 1).values.A).toBeCloseTo(3000);
    expect(solveFormula(get('cong-suat'), { P: 0, A: 3000, t: 30 }, 1).values.P).toBeCloseTo(100);
    expect(solveFormula(get('cong-suat'), { P: 100, A: 3000, t: 0 }, 3).values.t).toBeCloseTo(30);
  });

  it('động năng: Wđ = ½·m·v², tìm v cần khai căn', () => {
    const def = get('dong-nang');
    expect(solveFormula(def, { W: 0, m: 2, v: 10 }, 1).values.W).toBeCloseTo(100);
    expect(solveFormula(def, { W: 100, m: 2, v: 0 }, 3).values.v).toBeCloseTo(10);
    expect(solveFormula(def, { W: 100, m: 0, v: 10 }, 2).values.m).toBeCloseTo(2);
  });

  it('thế năng, nhiệt lượng, điện năng', () => {
    expect(solveFormula(get('the-nang'), { W: 0, m: 2, h: 5 }, 1).values.W).toBeCloseTo(100);
    expect(solveFormula(get('nhiet-luong'), { Q: 0, m: 2, c: 4200, dt: 80 }, 1).values.Q).toBeCloseTo(672000);
    expect(solveFormula(get('nhiet-luong'), { Q: 672000, m: 2, c: 4200, dt: 0 }, 4).values.dt).toBeCloseTo(80);
    expect(solveFormula(get('cong-suat-dien'), { P: 1100, U: 220, I: 0 }, 3).values.I).toBeCloseTo(5);
    expect(solveFormula(get('dien-nang'), { A: 0, P: 100, t: 3600 }, 1).values.A).toBeCloseTo(360000);
  });

  it('mọi công thức đều nhất quán: tính xuôi rồi tính ngược ra lại số ban đầu', () => {
    for (const def of FORMULAS) {
      const vars = variablesOf(def);
      const start: Record<string, number> = {};
      for (const v of vars) start[v.key] = v.defaultVal;
      const forward = solveFormula(def, start, 1).values;
      for (let k = 2; k <= vars.length; k++) {
        const back = solveFormula(def, forward, k).values[vars[k - 1].key];
        expect(back).toBeCloseTo(start[vars[k - 1].key], 6);
      }
    }
  });
});

describe('Viết lời giải', () => {
  it('biểu thức đã chuyển vế: t = s / v', () => {
    const sol = solveFormula(get('toc-do'), { v: 5, s: 100, t: 0 }, 3);
    expect(expressionLatex(sol, (v) => v.latex)).toBe('\\frac{s}{v}');
    expect(expressionLatex(sol, (v) => fmt(sol.values[v.key]))).toBe('\\frac{100}{5}');
  });

  it('hằng số nằm đúng chỗ: m = P / 10, và Wđ = 0,5·m·v²', () => {
    const m = solveFormula(get('trong-luong'), { P: 500, m: 0 }, 2);
    expect(expressionLatex(m, (v) => v.latex)).toBe('\\frac{P}{10}');
    const w = solveFormula(get('dong-nang'), { W: 0, m: 2, v: 10 }, 1);
    expect(expressionLatex(w, (v) => v.latex)).toBe('\\frac{m \\cdot v^{2}}{2}');
  });

  it('tìm tốc độ từ động năng: v = √(2·Wđ / m)', () => {
    const sol = solveFormula(get('dong-nang'), { W: 100, m: 2, v: 0 }, 3);
    expect(expressionLatex(sol, (v) => v.latex)).toBe('\\sqrt{\\frac{2 \\cdot W_đ}{m}}');
  });
});

describe('Dạng tổng, dạng riêng và đơn vị quy đổi', () => {
  const sym = (sol: ReturnType<typeof solveFormula>) => expressionLatex(sol, (v) => v.latex);

  it('điện trở song song: Rtđ = R1·R2 / (R1 + R2), tìm R2 = Rtđ·R1 / (R1 − Rtđ)', () => {
    const def = get('dien-tro-song-song');
    const sol = solveFormula(def, { R: 0, R1: 10, R2: 15 }, 1);
    expect(sol.values.R).toBeCloseTo(6);
    expect(sym(sol)).toBe('\\frac{R_1 \\cdot R_2}{R_2 + R_1}');
    const back = solveFormula(def, { R: 6, R1: 10, R2: 0 }, 3);
    expect(back.values.R2).toBeCloseTo(15);
    expect(sym(back)).toBe('\\frac{R_{tđ} \\cdot R_1}{R_1 - R_{tđ}}');
  });

  it("thấu kính hội tụ: d' = f·d / (d − f), ảnh ảo khi vật trong khoảng tiêu cự", () => {
    const def = get('thau-kinh-hoi-tu');
    const real = solveFormula(def, { dp: 0, f: 10, d: 30 }, 1);
    expect(real.values.dp).toBeCloseTo(15);
    expect(sym(real)).toBe("\\frac{f \\cdot d}{d - f}");
    expect(def.interpret!(real.values)).toMatch(/^Ảnh thật/);
    const virtual = solveFormula(def, { dp: 0, f: 12, d: 8 }, 1);
    expect(virtual.values.dp).toBeCloseTo(-24);
    expect(def.interpret!(virtual.values)).toMatch(/^Ảnh ảo/);
    expect(solveFormula(def, { dp: 15, f: 0, d: 30 }, 2).values.f).toBeCloseTo(10);
  });

  it('đổi nhiệt độ: tìm °C từ °F chia cho hệ số 1,8', () => {
    const sol = solveFormula(get('doi-nhiet-do'), { F: 212, t: 0 }, 2);
    expect(sol.values.t).toBeCloseTo(100);
    expect(sym(sol)).toBe('\\frac{t_{°F} - 32}{1{,}8}');
  });

  it('cân bằng nhiệt: tính t và tìm ngược lại từng đại lượng', () => {
    const def = get('can-bang-nhiet');
    const start = { t: 0, m1: 0.2, c1: 880, t1: 100, m2: 0.5, c2: 4200, t2: 20 };
    const t = solveFormula(def, start, 1).values.t;
    expect(0.2 * 880 * (100 - t)).toBeCloseTo(0.5 * 4200 * (t - 20), 6);
    expect(solveFormula(def, { ...start, t, m2: 0 }, 5).values.m2).toBeCloseTo(0.5);
  });

  it('điện trở dây dẫn: thanh trượt theo mm² và 10⁻⁸ Ω·m, thay số theo SI', () => {
    const sol = solveFormula(get('dien-tro-day-dan'), { R: 0, rho: 1.7, l: 100, S: 0.5 }, 1);
    expect(sol.values.R).toBeCloseTo(3.4);
    expect(sol.si.S).toBeCloseTo(5e-7);
    expect(expressionLatex(sol, (v) => fmtLatex(sol.si[v.key]))).toBe('\\frac{1{,}7 \\cdot 10^{-8} \\cdot 100}{5 \\cdot 10^{-7}}');
  });

  it('cảnh báo đáp số âm hoặc không tính được', () => {
    const bad = solveFormula(get('co-nang'), { W: 10, Wd: 0, Wt: 30 }, 2);
    expect(interpretSolution(bad)).toMatch(/vô lí/);
  });
});

describe('Mẫu thí nghiệm sinh từ công thức', () => {
  it('mỗi công thức có một mẫu với tham số "find" và tính ra đủ các đại lượng', () => {
    expect(FORMULA_TEMPLATES).toHaveLength(FORMULAS.length);
    const speed = FORMULA_TEMPLATES.find((t) => t.id === 'toc-do')!;
    expect(speed.params.find.max).toBe(3);
    expect(speed.compute({ v: 0, s: 1500, t: 300, find: 1 })).toMatchObject({ v: 5, s: 1500, t: 300 });
  });
});
