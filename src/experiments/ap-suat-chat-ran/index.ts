import { ExperimentTemplate } from '../../core/types';
import { ApSuatParams, computeApSuat } from './model';
import { ApSuatView } from './View';

export const apSuatChatRanTemplate: ExperimentTemplate<ApSuatParams> = {
  id: 'ap-suat-chat-ran',
  title: 'Áp Suất Chất Rắn & Diện Tích Bị Ép',
  group: 'Cơ học',
  topic: 'Áp suất',
  grade: 8,
  params: {
    m: {
      label: 'Khối lượng vật',
      symbol: 'm',
      unit: 'kg',
      min: 0.2,
      max: 100,
      step: 0.2,
      defaultVal: 2
    },
    S: {
      label: 'Diện tích tiếp xúc',
      symbol: 'S',
      unit: 'cm²',
      min: 5,
      max: 1000,
      step: 1,
      defaultVal: 20
    }
  },
  outputs: [
    { label: 'Áp lực tác dụng', symbol: 'F', unit: 'N' },
    { label: 'Áp suất', symbol: 'p', unit: 'N/m² (Pa)' }
  ],
  compute: (p) => {
    const res = computeApSuat(p);
    return {
      F: res.F,
      p: res.p
    };
  },
  formulas: [
    'p = \\frac{F}{S}',
    'F = P = 10 \\cdot m',
    '1\\,\\text{cm}^2 = 0{,}0001\\,\\text{m}^2'
  ],
  conditions: 'Lực F là áp lực vuông góc với mặt bị ép. Đơn vị diện tích S phải quy đổi ra mét vuông (m²). Độ lún trên hình chỉ minh họa tác dụng của áp suất, không phải số đo.',
  aiHint: 'Các bài toán về khối kim loại/viên gạch đặt trên mặt bàn, đệm mút, cát; tính áp lực F hoặc áp suất p khi thay đổi mặt tiếp xúc.',
  View: ApSuatView
};
