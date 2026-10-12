import { describe, it, expect } from 'vitest';
import { computeKhucXa } from './model';

describe('Thí nghiệm Khúc xạ ánh sáng', () => {
  it('khi truyền từ không khí vào nước với i = 0° thì r = 0° (truyền thẳng)', () => {
    const res = computeKhucXa({ i: 0, medium: 1 });
    expect(res.r).toBe(0);
    expect(res.deviation).toBe(0);
  });

  it('khi truyền từ không khí vào nước với i > 0 thì góc khúc xạ r < i', () => {
    const res = computeKhucXa({ i: 45, medium: 1 });
    expect(res.r).toBeLessThan(45);
    expect(res.r).toBeCloseTo(32.1, 1);
  });

  it('vào thủy tinh (n=1.5) tia khúc xạ bị bẻ cong nhiều hơn nước (n=1.33)', () => {
    const water = computeKhucXa({ i: 60, medium: 1 });
    const glass = computeKhucXa({ i: 60, medium: 2 });
    expect(glass.r).toBeLessThan(water.r);
  });
});
