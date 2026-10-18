import { describe, it, expect } from 'vitest';
import { ammeterRange, computeOhm } from './model';

describe('Thí nghiệm Định luật Ôm', () => {
  it('tính chính xác dòng điện I = U / R: U = 12V, R = 6Ω -> I = 2A, P = 24W', () => {
    const res = computeOhm({ U: 12, R: 6 });
    expect(res.I).toBe(2);
    expect(res.P_power).toBe(24);
  });

  it('dòng điện tỉ lệ thuận với U và tỉ lệ nghịch với R', () => {
    const res1 = computeOhm({ U: 6, R: 10 }); // 0.6A
    const res2 = computeOhm({ U: 12, R: 10 }); // 1.2A
    expect(res2.I).toBe(res1.I * 2);

    const res3 = computeOhm({ U: 12, R: 20 }); // 0.6A
    expect(res3.I).toBe(res2.I / 2);
  });
});

describe('Chọn thang đo ampe kế', () => {
  it('chọn thang nhỏ nhất còn đo được dòng điện', () => {
    expect(ammeterRange(0.4)).toBe(0.6);
    expect(ammeterRange(1.2)).toBe(3);
    expect(ammeterRange(12)).toBe(30);
  });
});
