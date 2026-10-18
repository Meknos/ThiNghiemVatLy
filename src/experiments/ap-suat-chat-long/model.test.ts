import { describe, it, expect } from 'vitest';
import { computeApSuatChatLong } from './model';

describe('Thí nghiệm Áp suất chất lỏng', () => {
  it('tính chính xác áp suất với h = 50cm = 0.5m, nước d = 10000 N/m³', () => {
    // p = 10000 * 0.5 = 5000 Pa
    const res = computeApSuatChatLong({ h_cm: 50, d_liquid: 10000 });
    expect(res.p).toBe(5000);
    expect(res.jetRange).toBeGreaterThan(0);
  });

  it('áp suất tỉ lệ thuận với độ sâu h', () => {
    const res1 = computeApSuatChatLong({ h_cm: 20, d_liquid: 10000 });
    const res2 = computeApSuatChatLong({ h_cm: 40, d_liquid: 10000 });
    expect(res2.p).toBe(res1.p * 2);
  });
});

describe('Tia nước phun ra từ thành bình', () => {
  it('lỗ càng sâu thì tia nước càng đi xa (bình đặt trên giá cao)', () => {
    const ranges = [10, 20, 40, 60, 80].map((h) => computeApSuatChatLong({ h_cm: h, d_liquid: 10000 }).jetRange);
    for (let i = 1; i < ranges.length; i++) expect(ranges[i]).toBeGreaterThan(ranges[i - 1]);
  });

  it('tầm xa bằng 2√(h·y): h = 40 cm, lỗ cao 120 cm so với sàn → khoảng 138,6 cm', () => {
    expect(computeApSuatChatLong({ h_cm: 40, d_liquid: 10000 }).jetRange).toBeCloseTo(138.6, 1);
  });

  it('tầm xa không phụ thuộc loại chất lỏng', () => {
    const water = computeApSuatChatLong({ h_cm: 40, d_liquid: 10000 });
    const oil = computeApSuatChatLong({ h_cm: 40, d_liquid: 8000 });
    expect(oil.jetRange).toBe(water.jetRange);
    expect(oil.p).toBeLessThan(water.p);
  });
});
