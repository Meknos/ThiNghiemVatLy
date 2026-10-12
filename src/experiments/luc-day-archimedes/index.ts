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
      label: 'Thể tích chìm của vật',
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
    }
  },
  outputs: [
    { label: 'Lực đẩy Ác-si-mét', symbol: 'F_A', unit: 'N' },
    { label: 'Trọng lượng vật', symbol: 'P', unit: 'N' },
    { label: 'Số chỉ lực kế', symbol: "P'", unit: 'N' }
  ],
  compute: (p) => {
    const res = computeArchimedes(p);
    return {
      'F_A': res.F_A,
      'P': res.P,
      "P'": res.P_prime
    };
  },
  formulas: [
    'F_A = d \\cdot V',
    "P' = P - F_A \\quad (\\text{Lực kế khi nhúng trong chất lỏng})",
    'F_A > P \\implies \\text{Vật nổi}; \\quad F_A = P \\implies \\text{Lơ lửng}; \\quad F_A < P \\implies \\text{Vật chìm}'
  ],
  conditions: 'V là thể tích của phần chất lỏng bị vật chiếm chỗ (tính bằng m³). d là trọng lượng riêng của chất lỏng (N/m³).',
  aiHint: 'Các bài toán nhúng vật vào trong nước, dầu; tính lực đẩy Ác-si-mét F_A, độ giảm trọng lượng trên lực kế, hoặc xét vật nổi/lơ lửng/chìm.',
  View: ArchimedesView
};
