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
