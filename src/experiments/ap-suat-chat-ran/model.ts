import { Units } from '../../core/units';

export interface ApSuatParams {
  m: number;   // Khối lượng khối kim loại (kg)
  S: number;   // Diện tích mặt tiếp xúc (cm²)
}

export interface ApSuatOutputs {
  F: number;   // Áp lực tác dụng vuông góc lên mặt bị ép (N)
  p: number;   // Áp suất (N/m² hoặc Pa)
  depth: number; // Độ lún minh họa trên bề mặt mút/cát (mm)
}

export function computeApSuat(params: ApSuatParams): ApSuatOutputs {
  const m = Math.max(0.01, params.m);
  const S_cm2 = Math.max(0.1, params.S);

  // F = 10 * m theo SGK THCS
  const F = Units.massToWeight(m, 10);

  // S (m²) = S (cm²) / 10,000
  const S_m2 = Units.cm2ToM2(S_cm2);

  // p = F / S (Pa)
  const p = F / S_m2;

  // Độ lún giả lập trên đệm mút xốp: tỉ lệ với áp suất
  // 1000 Pa ~ 5 mm lún
  const depth = Math.min(60, (p / 1000) * 5);

  return {
    F,
    p,
    depth
  };
}
