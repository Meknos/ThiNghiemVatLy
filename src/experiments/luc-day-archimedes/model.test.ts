import { describe, it, expect } from 'vitest';
import { computeArchimedes } from './model';

describe('Thí nghiệm Lực đẩy Ác-si-mét', () => {
  it('tính chính xác F_A với V = 500cm³, nước d = 10000 N/m³', () => {
    // V = 500 cm³ = 0.0005 m³
    // F_A = 10000 * 0.0005 = 5 N
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.8 });
    expect(res.F_A).toBe(5);
    expect(res.P).toBe(8); // P = 10 * 0.8 = 8N
    expect(res.P_prime).toBe(3); // 8 - 5 = 3N
    expect(res.state).toBe('Chìm');
  });

  it('xác định vật nổi khi F_A > P', () => {
    // m = 0.3kg -> P = 3N. F_A = 5N -> Nổi
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.3 });
    expect(res.state).toBe('Nổi');
  });

  it('xác định vật lơ lửng khi F_A = P', () => {
    // m = 0.5kg -> P = 5N. F_A = 5N -> Lơ lửng
    const res = computeArchimedes({ V_cm3: 500, d_liquid: 10000, m_kg: 0.5 });
    expect(res.state).toBe('Lơ lửng');
  });
});
