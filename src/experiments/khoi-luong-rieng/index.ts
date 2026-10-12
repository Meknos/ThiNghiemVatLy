import { ExperimentTemplate } from '../../core/types';
import { KhoiLuongRiengParams, computeKhoiLuongRieng } from './model';
import { KhoiLuongRiengView } from './View';

export const khoiLuongRiengTemplate: ExperimentTemplate<KhoiLuongRiengParams> = {
  id: 'khoi-luong-rieng',
  title: 'Khối Lượng Riêng & Trọng Lượng Riêng',
  group: 'Mở đầu & Đo lường',
  topic: 'Khối lượng riêng',
  grade: 8,
  params: {
    m_g: {
      label: 'Khối lượng vật trên cân',
      symbol: 'm',
      unit: 'g',
      min: 10,
      max: 500,
      step: 1,
      defaultVal: 54
    },
    V1_cm3: {
      label: 'Mực nước ban đầu',
      symbol: 'V₁',
      unit: 'cm³ (mL)',
      min: 20,
      max: 80,
      step: 1,
      defaultVal: 50
    },
    V2_cm3: {
      label: 'Mực nước sau khi thả chìm',
      symbol: 'V₂',
      unit: 'cm³ (mL)',
      min: 25,
      max: 100,
      step: 1,
      defaultVal: 70
    }
  },
  outputs: [
    { label: 'Thể tích vật chiếm chỗ', symbol: 'V', unit: 'cm³' },
    { label: 'Khối lượng riêng', symbol: 'D', unit: 'kg/m³' },
    { label: 'Trọng lượng riêng', symbol: 'd', unit: 'N/m³' }
  ],
  compute: (p) => {
    const res = computeKhoiLuongRieng(p);
    return {
      V: res.V_obj,
      D: res.D_kg_m3,
      d: res.d_N_m3
    };
  },
  formulas: [
    'V = V_2 - V_1',
    'D = \\frac{m}{V} \\quad (1\\,\\text{g/cm}^3 = 1000\\,\\text{kg/m}^3)',
    'd = 10 \\cdot D \\quad (\\text{Trọng lượng riêng})'
  ],
  conditions: 'Vật không thấm nước, chìm hoàn toàn trong lòng chất lỏng của bình chia độ.',
  aiHint: 'Các bài toán đo thể tích vật rắn không thấm nước bằng bình chia độ; cân khối lượng m rồi tính khối lượng riêng D và nhận diện chất liệu kim loại.',
  View: KhoiLuongRiengView
};
