import { describe, it, expect } from 'vitest';
import { computeKhoiLuongRieng } from './model';

describe('Thí nghiệm Xác định Khối lượng riêng', () => {
  it('tính chính xác khối lượng riêng của khối nhôm: m = 54g, V = 20cm³ -> D = 2.7 g/cm³ = 2700 kg/m³', () => {
    // V1 = 60, V2 = 80 -> V = 20
    const res = computeKhoiLuongRieng({ m_g: 54, V1_cm3: 60, V2_cm3: 80 });
    expect(res.V_obj).toBe(20);
    expect(res.D_g_cm3).toBe(2.7);
    expect(res.D_kg_m3).toBe(2700);
    expect(res.d_N_m3).toBe(27000);
    expect(res.material).toContain('Nhôm');
  });

  it('nhận diện chính xác khối sắt: m = 156g, V = 20cm³ -> D = 7.8 g/cm³ = 7800 kg/m³', () => {
    const res = computeKhoiLuongRieng({ m_g: 156, V1_cm3: 50, V2_cm3: 70 });
    expect(res.D_kg_m3).toBe(7800);
    expect(res.material).toContain('Sắt');
  });
});

describe('Số liệu đo vô lý', () => {
  it('báo không hợp lệ khi mực nước lúc sau không cao hơn lúc đầu', () => {
    const res = computeKhoiLuongRieng({ m_g: 54, V1_cm3: 60, V2_cm3: 55 });
    expect(res.valid).toBe(false);
    expect(Number.isFinite(res.D_kg_m3)).toBe(true);
  });

  it('vật có D nhỏ hơn 1000 kg/m³ được báo là nhẹ hơn nước', () => {
    const res = computeKhoiLuongRieng({ m_g: 12, V1_cm3: 50, V2_cm3: 70 }); // 0,6 g/cm³
    expect(res.material).toContain('Nhẹ hơn nước');
  });
});
