import { describe, it, expect } from 'vitest';
import { computeBanMat } from './model';

describe('Thí nghiệm Bản mặt song song', () => {
  it('thủy tinh n = √3, góc tới 60°: r = 30°, tia ló ra với góc 60° (song song tia tới)', () => {
    const res = computeBanMat({ i: 60, n: Math.sqrt(3), e: 5 });
    expect(res.r).toBe(30);
    expect(res.iOut).toBe(60);
  });

  it('độ dời ngang: e = 5 cm, i = 60°, r = 30° thì d = e·sin(i − r)/cos r ≈ 2,89 cm', () => {
    const res = computeBanMat({ i: 60, n: Math.sqrt(3), e: 5 });
    expect(res.shift).toBeCloseTo(2.89, 2);
    expect(res.pathInside).toBeCloseTo(5.77, 2);
  });

  it('chiếu vuông góc thì tia đi thẳng, không bị dời', () => {
    const res = computeBanMat({ i: 0, n: 1.5, e: 5 });
    expect(res.r).toBe(0);
    expect(res.shift).toBe(0);
  });

  it('bản dày gấp đôi thì độ dời gấp đôi', () => {
    const thin = computeBanMat({ i: 45, n: 1.5, e: 3 });
    const thick = computeBanMat({ i: 45, n: 1.5, e: 6 });
    expect(thick.shift).toBeCloseTo(thin.shift * 2, 1);
  });
});
