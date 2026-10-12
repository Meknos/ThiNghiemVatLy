import { ExperimentTemplate } from '../../core/types';
import { LucVaChuyenDongParams, LucVaChuyenDongView } from './View';

export const lucVaChuyenDongTemplate: ExperimentTemplate<LucVaChuyenDongParams> = {
  id: 'luc-va-chuyen-dong',
  title: 'Lực, Chuyển Động & Tương Tác Vật Thể',
  group: 'Cơ học',
  topic: 'Chuyển động & Lực',
  grade: 8,
  params: {
    gravity: {
      label: 'Gia tốc trọng trường',
      symbol: 'g',
      unit: 'm/s²',
      min: 0,
      max: 25,
      step: 0.1,
      defaultVal: 10 // g = 10 N/kg (khớp P ≈ 10m theo PLAN.md)
    },
    airDrag: {
      label: 'Hệ số cản không khí',
      symbol: 'k_drag',
      unit: '',
      min: 0,
      max: 0.05,
      step: 0.002,
      defaultVal: 0
    }
  },
  outputs: [
    { label: 'Trọng trường chuẩn', symbol: 'g', unit: 'N/kg' },
    { label: 'Hệ số ma sát sàn', symbol: 'μ', unit: '' }
  ],
  compute: (p) => {
    return {
      g: p.gravity,
      'μ': 0.6
    };
  },
  formulas: [
    'P = 10 \\cdot m \\quad (\\text{Trọng lực})',
    'v = \\frac{s}{t} \\quad (\\text{Tốc độ trung bình})',
    'W_c = W_đ + W_t \\quad (\\text{Cơ năng bảo toàn})'
  ],
  conditions: 'Tương tác vật rắn 2D theo thời gian thực (Matter.js), hỗ trợ va chạm, mặt phẳng nghiêng, lò xo, con lắc và cổng quang đo đạc.',
  aiHint: 'Các bài toán cơ học chuyển động, rơi tự do, xe trượt mặt nghiêng, va chạm giữa các vật, con lắc đơn, lò xo dao động.',
  View: LucVaChuyenDongView
};
