import { Units } from '../../core/units';

export interface ApSuatParams {
  m: number;   // Khối lượng khối kim loại (kg)
  S: number;   // Diện tích mặt tiếp xúc (cm²)
}

export interface ApSuatOutputs {
  F: number;         // Áp lực tác dụng vuông góc lên mặt bị ép (N)
  p: number;         // Áp suất (N/m² hay Pa)
  sinkRatio: number; // Mức lún minh họa trên đệm mút, từ 0 đến 1 (không phải số đo)
}

export function computeApSuat(params: ApSuatParams): ApSuatOutputs {
  const m = Math.max(0.01, params.m);
  const S_cm2 = Math.max(0.1, params.S);

  // F = P = 10·m theo SGK THCS
  const F = Units.massToWeight(m, 10);

  // S (m²) = S (cm²) / 10 000
  const S_m2 = Units.cm2ToM2(S_cm2);

  // p = F / S
  const p = F / S_m2;

  // Đệm mút lún nhiều hơn khi áp suất lớn hơn, nhưng không lún mãi được.
  // Hàm bão hòa này chỉ để vẽ hình: tăng đều theo p và tiến dần tới 1.
  const sinkRatio = p / (p + 20000);

  return { F, p, sinkRatio };
}
