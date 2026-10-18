import { describe, it, expect } from 'vitest';
import { computeArchimedes } from './model';

describe('Thí nghiệm Lực đẩy Ác-si-mét', () => {
  it('vật chìm hoàn toàn: V = 500 cm³ trong nước → F_A = 5 N, lực kế giảm còn 3 N', () => {
    // V = 500 cm³ = 0,0005 m³; F_A = 10000 × 0,0005 = 5 N; P = 10 × 0,8 = 8 N
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.8 });
    expect(res.F_A).toBe(5);
    expect(res.P).toBe(8);
    expect(res.P_prime).toBe(3);
    expect(res.V_chim).toBe(500);
    expect(res.state).toBe('Chìm');
    expect(res.stringSlack).toBe(false);
  });

  it('chưa nhúng vào chất lỏng thì không có lực đẩy, lực kế chỉ đúng trọng lượng', () => {
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.8, immersed: 0 });
    expect(res.F_A).toBe(0);
    expect(res.P_prime).toBe(8);
  });

  it('lực đẩy tỉ lệ với thể tích phần chìm: nhúng một nửa thì F_A còn một nửa', () => {
    const half = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.8, immersed: 50 });
    expect(half.V_chim).toBe(250);
    expect(half.F_A).toBe(2.5);
    expect(half.P_prime).toBe(5.5);
  });

  it('lực đẩy tỉ lệ với trọng lượng riêng chất lỏng: trong dầu nhỏ hơn trong nước', () => {
    const oil = computeArchimedes({ V_cm3: 500, d_liquid: 8000, m_kg: 0.8 });
    expect(oil.F_A).toBe(4);
  });

  it('vật nhẹ hơn chất lỏng thì nổi: phần chìm vừa đủ để F_A = P, dây treo chùng', () => {
    // P = 3 N; nổi khi V chìm = 3 / 10000 m³ = 300 cm³ (trong tổng 500 cm³)
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.3 });
    expect(res.state).toBe('Nổi');
    expect(res.V_chim).toBe(300);
    expect(res.F_A).toBe(3);
    expect(res.P_prime).toBe(0);
    expect(res.stringSlack).toBe(true);
  });

  it('vật lơ lửng khi lực đẩy lúc chìm hoàn toàn đúng bằng trọng lượng', () => {
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.5 });
    expect(res.state).toBe('Lơ lửng');
    expect(res.P_prime).toBe(0);
  });
});
