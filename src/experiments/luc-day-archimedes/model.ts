import { Units } from '../../core/units';

export interface ArchimedesParams {
  V_cm3: number;     // Thể tích phần vật chìm trong chất lỏng (cm³)
  d_liquid: number;  // Trọng lượng riêng của chất lỏng (N/m³, nước: 10000, dầu: 8000)
  m_kg: number;      // Khối lượng của vật (kg)
}

export interface ArchimedesOutputs {
  F_A: number;       // Lực đẩy Ác-si-mét (N)
  P: number;         // Trọng lượng của vật ngoài không khí (N)
  P_prime: number;   // Lực kế chỉ khi nhúng trong chất lỏng (N)
  state: 'Nổi' | 'Lơ lửng' | 'Chìm';
}

export function computeArchimedes(params: ArchimedesParams): ArchimedesOutputs {
  const V_cm3 = Math.max(1, params.V_cm3);
  const d_liquid = Math.max(100, params.d_liquid);
  const m_kg = Math.max(0.01, params.m_kg);

  // V (m³) = V (cm³) / 1,000,000
  const V_m3 = Units.cm3ToM3(V_cm3);

  // F_A = d * V
  const F_A = d_liquid * V_m3;

  // P = 10 * m
  const P = Units.massToWeight(m_kg, 10);

  // P' = P - F_A (số chỉ lực kế)
  const P_prime = Math.max(0, P - F_A);

  let state: 'Nổi' | 'Lơ lửng' | 'Chìm' = 'Lơ lửng';
  if (F_A > P + 0.01) state = 'Nổi';
  else if (P > F_A + 0.01) state = 'Chìm';

  return {
    F_A: Number(F_A.toFixed(2)),
    P: Number(P.toFixed(2)),
    P_prime: Number(P_prime.toFixed(2)),
    state
  };
}
