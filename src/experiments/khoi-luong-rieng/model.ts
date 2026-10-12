export interface KhoiLuongRiengParams {
  m_g: number;    // Khối lượng đo trên cân (g)
  V1_cm3: number; // Mực nước ban đầu (cm³)
  V2_cm3: number; // Mực nước sau khi thả chìm vật (cm³)
}

export interface KhoiLuongRiengOutputs {
  V_obj: number;     // Thể tích vật V = V2 - V1 (cm³)
  D_g_cm3: number;   // Khối lượng riêng (g/cm³)
  D_kg_m3: number;   // Khối lượng riêng (kg/m³)
  d_N_m3: number;    // Trọng lượng riêng (N/m³)
  material: string;  // Nhận diện kim loại/chất liệu
}

export function computeKhoiLuongRieng(params: KhoiLuongRiengParams): KhoiLuongRiengOutputs {
  const m_g = Math.max(1, params.m_g);
  const V1 = Math.max(10, params.V1_cm3);
  const V2 = Math.max(V1 + 1, params.V2_cm3);

  const V_obj = V2 - V1;

  // D = m / V (g/cm³)
  const D_g_cm3 = m_g / V_obj;

  // 1 g/cm³ = 1000 kg/m³
  const D_kg_m3 = Math.round(D_g_cm3 * 1000);

  // d = 10 * D
  const d_N_m3 = D_kg_m3 * 10;

  // Nhận diện chất liệu
  let material = 'Hợp kim khác';
  if (Math.abs(D_kg_m3 - 2700) < 300) material = 'Nhôm (Al)';
  else if (Math.abs(D_kg_m3 - 7800) < 500) material = 'Sắt / Thép (Fe)';
  else if (Math.abs(D_kg_m3 - 8900) < 500) material = 'Đồng (Cu)';
  else if (Math.abs(D_kg_m3 - 11300) < 600) material = 'Chì (Pb)';
  else if (D_kg_m3 < 1000) material = 'Gỗ nhẹ / Nhựa nổi';

  return {
    V_obj,
    D_g_cm3: Number(D_g_cm3.toFixed(2)),
    D_kg_m3,
    d_N_m3,
    material
  };
}
