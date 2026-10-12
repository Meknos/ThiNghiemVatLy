import { describe, it, expect } from 'vitest';
import { computePhanXa } from './model';

describe('Thí nghiệm Phản xạ ánh sáng', () => {
  it('định luật phản xạ: i = i_prime', () => {
    const res = computePhanXa({ i: 30, mirrorAngle: 0 });
    expect(res.i_prime).toBe(30);
    expect(res.angleBetweenRays).toBe(60);
    expect(res.angleWithMirror).toBe(60);
  });

  it('xử lý góc tới 0° (chiếu vuông góc mặt gương)', () => {
    const res = computePhanXa({ i: 0, mirrorAngle: 0 });
    expect(res.i_prime).toBe(0);
    expect(res.angleBetweenRays).toBe(0);
    expect(res.angleWithMirror).toBe(90);
  });

  it('xử lý góc tới lớn (89.5°)', () => {
    const res = computePhanXa({ i: 85, mirrorAngle: 0 });
    expect(res.i_prime).toBe(85);
    expect(res.angleBetweenRays).toBe(170);
    expect(res.angleWithMirror).toBe(5);
  });
});
