import { describe, it, expect } from 'vitest';
import { computeHaiGuong } from './model';

describe('Thí nghiệm Hệ hai gương phẳng', () => {
  it('hai gương vuông góc, góc tới 40°: i1\' = 40°, i2 = 50°, tia ló song song ngược chiều tia tới', () => {
    const res = computeHaiGuong({ i: 40, theta: 90 });
    expect(res.i1Prime).toBe(40);
    expect(res.i2).toBe(50);
    expect(res.i2Prime).toBe(50);
    expect(res.reflections).toBe(2);
    expect(res.angleBetween).toBe(180);
  });

  it('đổi góc tới thành 55° vẫn song song ngược chiều (i2 = 35°)', () => {
    const res = computeHaiGuong({ i: 55, theta: 90 });
    expect(res.i2).toBe(35);
    expect(res.reflections).toBe(2);
    expect(res.angleBetween).toBe(180);
  });

  it('hai gương hợp góc 60°: tia ló lệch 2θ = 120° so với tia tới', () => {
    const res = computeHaiGuong({ i: 20, theta: 60 });
    expect(res.i2).toBe(40);
    expect(res.reflections).toBe(2);
    expect(res.angleBetween).toBe(120);
  });

  it('gương hợp góc 60°, góc tới 50°: sau G2 tia quay lại G1 lần nữa', () => {
    const res = computeHaiGuong({ i: 50, theta: 60 });
    expect(res.i2).toBe(10);
    expect(res.reflections).toBe(3);
  });

  it('gương hợp góc nhọn và tia tới gần pháp tuyến: phản xạ nhiều hơn hai lần', () => {
    const res = computeHaiGuong({ i: 10, theta: 30 });
    expect(res.reflections).toBeGreaterThan(2);
  });

  it('gương hợp góc tù và góc tới nhỏ: tia không tới G2', () => {
    const res = computeHaiGuong({ i: 10, theta: 120 });
    expect(res.reflections).toBe(1);
    expect(Number.isNaN(res.i2)).toBe(true);
  });
});
