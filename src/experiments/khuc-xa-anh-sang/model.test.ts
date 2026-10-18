import { describe, it, expect } from 'vitest';
import { computeKhucXa } from './model';

describe('Thí nghiệm Khúc xạ ánh sáng', () => {
  it('khi truyền từ không khí vào nước với i = 0° thì r = 0° (truyền thẳng)', () => {
    const res = computeKhucXa({ i: 0, n: 1.33 });
    expect(res.r).toBe(0);
    expect(res.deviation).toBe(0);
  });

  it('khi truyền từ không khí vào nước với i > 0 thì góc khúc xạ r < i', () => {
    const res = computeKhucXa({ i: 45, n: 1.33 });
    expect(res.r).toBeLessThan(45);
    expect(res.r).toBeCloseTo(32.1, 1);
  });

  it('vào thủy tinh (n=1.5) tia khúc xạ bị bẻ cong nhiều hơn nước (n=1.33)', () => {
    const water = computeKhucXa({ i: 60, n: 1.33 });
    const glass = computeKhucXa({ i: 60, n: 1.5 });
    expect(glass.r).toBeLessThan(water.r);
  });
});

describe('Chiết suất do đề cho', () => {
  it('thủy tinh n = √3, góc tới 60°: góc khúc xạ 30°', () => {
    const res = computeKhucXa({ i: 60, n: Math.sqrt(3) });
    expect(res.r).toBe(30);
    expect(res.mediumName).toContain('Môi trường trong suốt');
  });
});

describe('Truyền từ môi trường trong suốt ra không khí', () => {
  it('góc khúc xạ lớn hơn góc tới', () => {
    const res = computeKhucXa({ i: 30, n: 1.33, direction: 2 });
    expect(res.r).toBeGreaterThan(30);
    expect(res.r).toBeCloseTo(41.7, 1); // sin r = 1,33 × sin 30°
    expect(res.totalReflection).toBe(false);
  });

  it('góc tới giới hạn của nước khoảng 48,8°, của thủy tinh khoảng 41,8°', () => {
    expect(computeKhucXa({ i: 10, n: 1.33, direction: 2 }).criticalAngle).toBeCloseTo(48.8, 1);
    expect(computeKhucXa({ i: 10, n: 1.5, direction: 2 }).criticalAngle).toBeCloseTo(41.8, 1);
  });

  it('vượt góc giới hạn thì phản xạ toàn phần, không còn tia khúc xạ', () => {
    const res = computeKhucXa({ i: 60, n: 1.33, direction: 2 });
    expect(res.totalReflection).toBe(true);
    expect(Number.isNaN(res.r)).toBe(true);
    expect(res.reflectance).toBe(1);
  });

  it('từ không khí vào môi trường thì không bao giờ phản xạ toàn phần', () => {
    const res = computeKhucXa({ i: 89, n: 2.42 });
    expect(res.totalReflection).toBe(false);
    expect(Number.isNaN(res.criticalAngle)).toBe(true);
  });

  it('tia phản xạ mờ khi chiếu gần vuông góc, sáng dần khi góc tới lớn', () => {
    const near = computeKhucXa({ i: 5, n: 1.33 });
    const far = computeKhucXa({ i: 80, n: 1.33 });
    expect(near.reflectance).toBeCloseTo(0.02, 2);
    expect(far.reflectance).toBeGreaterThan(near.reflectance * 5);
  });
});
