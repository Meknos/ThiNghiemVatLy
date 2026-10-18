import { ExperimentTemplate } from '../../core/types';
import { ArchimedesParams, computeArchimedes } from './model';
import { ArchimedesView } from './View';

export const archimedesTemplate: ExperimentTemplate<ArchimedesParams> = {
  id: 'luc-day-archimedes',
  title: 'Lực Đẩy Ác-si-mét & Điều Kiện Chìm Nổi',
  group: 'Cơ học',
  topic: 'Lực đẩy Ác-si-mét',
  grade: 8,
  params: {
    V_cm3: {
      label: 'Thể tích của vật',
      symbol: 'V',
      unit: 'cm³',
      min: 50,
      max: 1500,
      step: 50,
      defaultVal: 500
    },
    d_liquid: {
      label: 'Trọng lượng riêng chất lỏng',
      symbol: 'd',
      unit: 'N/m³',
      min: 6000,
      max: 15000,
      step: 100,
      defaultVal: 10000
    },
    m_kg: {
      label: 'Khối lượng vật',
      symbol: 'm',
      unit: 'kg',
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultVal: 0.8
    },
    immersed: {
      label: 'Phần thể tích vật nhúng vào chất lỏng',
      symbol: '%V',
      unit: '%',
      min: 0,
      max: 100,
      step: 5,
      defaultVal: 100
    }
  },
  outputs: [
    { label: 'Lực đẩy Ác-si-mét', symbol: 'F_A', unit: 'N' },
    { label: 'Trọng lượng vật', symbol: 'P', unit: 'N' },
    { label: 'Số chỉ lực kế', symbol: "P'", unit: 'N' },
    { label: 'Thể tích phần chìm', symbol: 'V_c', unit: 'cm³' }
  ],
  compute: (p) => {
    const res = computeArchimedes(p);
    return {
      'F_A': res.F_A,
      'P': res.P,
      "P'": res.P_prime,
      'V_c': res.V_chim
    };
  },
  formulas: [
    'F_A = d \\cdot V',
    "P' = P - F_A \\quad (\\text{Lực kế khi nhúng trong chất lỏng})",
    '\\text{Khi vật chìm hoàn toàn: } F_A > P \\Rightarrow \\text{nổi lên}; \\quad F_A = P \\Rightarrow \\text{lơ lửng}; \\quad F_A < P \\Rightarrow \\text{chìm xuống}'
  ],
  conditions: 'V trong công thức là thể tích phần chất lỏng bị vật chiếm chỗ, tức phần vật chìm trong chất lỏng (tính bằng m³), không phải lúc nào cũng là cả thể tích vật. d là trọng lượng riêng của chất lỏng (N/m³). Vật nổi khi trọng lượng nhỏ hơn lực đẩy lúc chìm hoàn toàn.',
  aiHint: 'Các bài toán nhúng vật vào trong nước, dầu; tính lực đẩy Ác-si-mét F_A, độ giảm trọng lượng trên lực kế, hoặc xét vật nổi/lơ lửng/chìm.',
  View: ArchimedesView
};
