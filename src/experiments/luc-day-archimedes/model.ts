import { Units } from '../../core/units';

export interface ArchimedesParams {
  V_cm3: number;     // Thể tích của vật (cm³)
  d_liquid: number;  // Trọng lượng riêng của chất lỏng (N/m³; nước: 10000, dầu: 8000)
  m_kg: number;      // Khối lượng của vật (kg)
  immersed?: number; // Phần thể tích vật được nhúng vào chất lỏng (%), mặc định 100
}

export type FloatState = 'Nổi' | 'Lơ lửng' | 'Chìm';

export interface ArchimedesOutputs {
  F_A: number;        // Lực đẩy Ác-si-mét đang tác dụng lên vật (N)
  P: number;          // Trọng lượng của vật (N)
  P_prime: number;    // Số chỉ lực kế khi vật ở trong chất lỏng (N)
  V_chim: number;     // Thể tích phần vật chìm trong chất lỏng (cm³)
  state: FloatState;  // Vật sẽ nổi, lơ lửng hay chìm khi thả tự do trong chất lỏng
  stringSlack: boolean; // Dây treo bị chùng vì vật đã tự nổi
}

export function computeArchimedes(params: ArchimedesParams): ArchimedesOutputs {
  const V_cm3 = Math.max(1, params.V_cm3);
  const d_liquid = Math.max(100, params.d_liquid);
  const m_kg = Math.max(0.01, params.m_kg);
  const fraction = Math.max(0, Math.min(100, params.immersed ?? 100)) / 100;

  const P = Units.massToWeight(m_kg, 10);
  const V_m3 = Units.cm3ToM3(V_cm3);

  // So sánh trọng lượng với lực đẩy lớn nhất (khi vật chìm hoàn toàn): F_A max = d·V
  const F_full = d_liquid * V_m3;
  let state: FloatState = 'Lơ lửng';
  if (F_full > P + 0.01) state = 'Nổi';
  else if (P > F_full + 0.01) state = 'Chìm';

  // Hạ vật xuống tới đâu thì chìm tới đó. Nhưng vật nhẹ hơn chất lỏng sẽ tự nổi
  // khi lực đẩy đã bằng trọng lượng, lúc đó phần chìm chỉ còn V = P/d và dây chùng.
  const V_wanted = fraction * V_m3;
  const V_floating = P / d_liquid;
  const stringSlack = V_wanted > V_floating + 1e-9;
  const V_chim_m3 = Math.min(V_wanted, V_floating);

  // F_A = d·V, với V là thể tích phần chất lỏng bị vật chiếm chỗ
  const F_A = d_liquid * V_chim_m3;
  const P_prime = Math.max(0, P - F_A);

  return {
    F_A: Number(F_A.toFixed(2)),
    P: Number(P.toFixed(2)),
    P_prime: Number(P_prime.toFixed(2)),
    V_chim: Number((V_chim_m3 * 1e6).toFixed(1)),
    state,
    stringSlack
  };
}
