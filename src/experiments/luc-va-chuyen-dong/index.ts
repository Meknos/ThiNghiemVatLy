import { ExperimentTemplate } from '../../core/types';
import { LucVaChuyenDongParams, LucVaChuyenDongView } from './View';

export const lucVaChuyenDongTemplate: ExperimentTemplate<LucVaChuyenDongParams> = {
  id: 'luc-va-chuyen-dong',
  title: 'Lực, Chuyển Động & Tương Tác Vật Thể',
  group: 'Cơ học',
  topic: 'Chuyển động & Lực',
  grade: null, // gồm các bài của lớp 6, 7, 8, 9; xem nhãn từng bài
  params: {
    scene: {
      label: 'Bài thí nghiệm (1: lò xo, 2: ma sát, 3: đo tốc độ, 4: đòn bẩy, 5: cơ năng)',
      symbol: 'Bài',
      unit: '',
      min: 1,
      max: 5,
      step: 1,
      defaultVal: 1
    },
    gravity: {
      label: 'Trọng lượng của mỗi kg',
      symbol: 'g',
      unit: 'N/kg',
      min: 0,
      max: 25,
      step: 0.1,
      defaultVal: 10 // P = 10·m theo SGK THCS
    },
    airDrag: {
      label: 'Lực cản không khí (minh họa)',
      symbol: 'k',
      unit: '',
      min: 0,
      max: 0.05,
      step: 0.002,
      defaultVal: 0
    }
  },
  outputs: [
    { label: 'Trọng lượng của vật 1 kg', symbol: 'P', unit: 'N' }
  ],
  compute: (p) => {
    return {
      P: p.gravity
    };
  },
  formulas: [
    'P = 10 \\cdot m \\quad (\\text{Trọng lượng})',
    'v = \\frac{s}{t} \\quad (\\text{Tốc độ})',
    'M = F \\cdot d \\quad (\\text{Mô men lực})',
    'W = W_đ + W_t \\quad (\\text{Cơ năng})'
  ],
  conditions: 'Mô phỏng vật rắn trong mặt phẳng: 1 m = 100 px, khối lượng tính bằng kg, g = 10 N/kg. Lò xo tuân theo F = k·Δl, ma sát trượt F = μ·N. Lực cản không khí chỉ mang tính minh họa.',
  aiHint: 'Các bài cơ học: lò xo treo quả nặng và độ giãn; lực ma sát trên các bề mặt; đo tốc độ bằng cổng quang; đòn bẩy và mô men lực; chuyển hóa động năng và thế năng.',
  View: LucVaChuyenDongView
};
