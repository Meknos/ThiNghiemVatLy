import { describe, it, expect } from 'vitest';
import { computeApSuat } from './model';

describe('Thí nghiệm Áp suất chất rắn', () => {
  it('tính chính xác áp suất với m = 2kg, S = 20cm²', () => {
    // F = 2 * 10 = 20 N
    // S = 20 cm² = 0.002 m²
    // p = 20 / 0.002 = 10,000 Pa
    const res = computeApSuat({ m: 2, S: 20 });
    expect(res.F).toBe(20);
    expect(res.p).toBe(10000);
  });

  it('tính chính xác áp suất khi diện tích tiếp xúc giảm đi 2 lần thì p tăng 2 lần', () => {
    const res1 = computeApSuat({ m: 4, S: 40 });
    const res2 = computeApSuat({ m: 4, S: 20 });
    expect(res2.p).toBe(res1.p * 2);
  });

  it('chặn an toàn khi S ≤ 0 hoặc quá nhỏ', () => {
    const res = computeApSuat({ m: 1, S: 0 });
    expect(res.p).toBeGreaterThan(0);
    expect(Number.isFinite(res.p)).toBe(true);
  });
});

describe('Mức lún minh họa', () => {
  it('tăng theo áp suất và luôn nằm trong khoảng 0–1', () => {
    const small = computeApSuat({ m: 2, S: 60 });
    const large = computeApSuat({ m: 2, S: 10 });
    expect(large.sinkRatio).toBeGreaterThan(small.sinkRatio);
    expect(computeApSuat({ m: 10, S: 5 }).sinkRatio).toBeLessThan(1);
    expect(computeApSuat({ m: 0.2, S: 100 }).sinkRatio).toBeGreaterThan(0);
  });
});
