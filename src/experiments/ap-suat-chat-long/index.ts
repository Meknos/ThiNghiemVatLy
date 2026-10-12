import { ExperimentTemplate } from '../../core/types';
import { ApSuatChatLongParams, computeApSuatChatLong } from './model';
import { ApSuatChatLongView } from './View';

export const apSuatChatLongTemplate: ExperimentTemplate<ApSuatChatLongParams> = {
  id: 'ap-suat-chat-long',
  title: 'Áp Suất Chất Lỏng & Độ Sâu',
  group: 'Cơ học',
  topic: 'Áp suất chất lỏng',
  grade: 8,
  params: {
    h_cm: {
      label: 'Độ sâu tính từ mặt thoáng',
      symbol: 'h',
      unit: 'cm',
      min: 5,
      max: 80,
      step: 1,
      defaultVal: 40
    },
    d_liquid: {
      label: 'Trọng lượng riêng chất lỏng',
      symbol: 'd',
      unit: 'N/m³',
      min: 6000,
      max: 15000,
      step: 100,
      defaultVal: 10000
    }
  },
  outputs: [
    { label: 'Áp suất chất lỏng', symbol: 'p', unit: 'N/m² (Pa)' },
    { label: 'Tầm xa tia nước phụt ra', symbol: 'x', unit: 'cm' }
  ],
  compute: (p) => {
    const res = computeApSuatChatLong(p);
    return {
      p: res.p,
      x: res.jetRange
    };
  },
  formulas: [
    'p = d \\cdot h',
    '\\text{Càng xuống sâu } h \\uparrow \\implies p \\uparrow \\implies \\text{Tia nước phụt càng xa}'
  ],
  conditions: 'Chất lỏng đứng yên, h là độ sâu thẳng đứng từ mặt thoáng tới điểm xét (tính bằng m). Áp suất chất lỏng tác dụng theo mọi phương lên đáy bình, thành bình và các vật trong nó.',
  aiHint: 'Các bài toán tính áp suất ở đáy bình hoặc ở độ sâu h trong cột nước/dầu; so sánh tia nước phụt ra từ các lỗ ở thành bình.',
  View: ApSuatChatLongView
};
