import { describe, it, expect } from 'vitest';

describe('Vật lý cơ học THCS (M2 Mechanics Tests)', () => {
  const g = 10; // N/kg theo SGK THCS KHTN

  it('Rơi tự do 1s từ trạng thái nghỉ: s = 1/2 * g * t^2 = 5m (sai số 0%)', () => {
    const t = 1.0;
    const s = 0.5 * g * t * t;
    expect(s).toBe(5.0);
    const v = g * t;
    expect(v).toBe(10.0);
  });

  it('Lò xo đàn hồi: độ dãn tỉ lệ thuận với khối lượng quả nặng treo (Hooke)', () => {
    const k = 100; // N/m
    const m1 = 0.2; // 200g -> P1 = 2N -> delta_l = 2 / 100 = 0.02m = 2cm
    const m2 = 0.4; // 400g -> P2 = 4N -> delta_l = 4 / 100 = 0.04m = 4cm
    const delta_l1 = (m1 * g) / k;
    const delta_l2 = (m2 * g) / k;

    expect(delta_l1).toBeCloseTo(0.02, 5);
    expect(delta_l2).toBeCloseTo(0.04, 5);
    expect(delta_l2 / delta_l1).toBeCloseTo(2.0, 5);
  });

  it('Đòn bẩy cân bằng: F1 * d1 = F2 * d2', () => {
    const m1 = 2; // 2kg -> F1 = 20N
    const d1 = 0.12; // 12cm
    const m2 = 4; // 4kg -> F2 = 40N
    const d2 = 0.06; // 6cm

    const moment1 = (m1 * g) * d1;
    const moment2 = (m2 * g) * d2;

    expect(moment1).toBe(moment2);
    expect(moment1).toBeCloseTo(2.4, 5);
  });

  it('Bảo toàn cơ năng không ma sát: W = W_đ + W_t = const', () => {
    const m = 0.5; // kg
    const h0 = 2.0; // m
    const W_initial = m * g * h0; // 0.5 * 10 * 2 = 10 J

    // Khi vật rơi xuống độ cao h = 0.5m:
    const h = 0.5;
    const v = Math.sqrt(2 * g * (h0 - h)); // v = sqrt(2 * 10 * 1.5) = sqrt(30)
    const W_t = m * g * h;
    const W_d = 0.5 * m * v * v;
    const W_total = W_t + W_d;

    expect(W_total).toBeCloseTo(W_initial, 5);
  });
});
