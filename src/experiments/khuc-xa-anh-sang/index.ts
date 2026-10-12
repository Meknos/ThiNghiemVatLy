import { ExperimentTemplate } from '../../core/types';
import { KhucXaParams, computeKhucXa } from './model';
import { KhucXaView } from './View';

export const khucXaAnhSangTemplate: ExperimentTemplate<KhucXaParams> = {
  id: 'khuc-xa-anh-sang',
  title: 'Hiện Tượng Khúc Xạ Ánh Sáng',
  group: 'Quang học',
  topic: 'Khúc xạ ánh sáng',
  grade: 9,
  params: {
    i: {
      label: 'Góc tới',
      symbol: 'i',
      unit: '°',
      min: 0,
      max: 85,
      step: 1,
      defaultVal: 45
    },
    medium: {
      label: 'Môi trường (1: Nước, 2: Thủy tinh, 3: Kim cương)',
      symbol: 'n₂',
      unit: '',
      min: 1,
      max: 3,
      step: 1,
      defaultVal: 1
    }
  },
  outputs: [
    { label: 'Góc khúc xạ', symbol: 'r', unit: '°' },
    { label: 'Góc lệch tia sáng', symbol: 'D', unit: '°' }
  ],
  compute: (p) => {
    const res = computeKhucXa(p);
    return {
      r: res.r,
      D: res.deviation
    };
  },
  formulas: [
    'n_1 \\sin i = n_2 \\sin r \\quad (\\text{Định luật khúc xạ})',
    '\\text{Từ không khí vào nước/thủy tinh: } r < i',
    'D = |i - r| \\quad (\\text{Góc lệch})'
  ],
  conditions: 'Tia khúc xạ nằm trong mặt phẳng tới và ở phía bên kia pháp tuyến so với tia tới.',
  aiHint: 'Các bài toán chiếu tia sáng từ không khí vào nước hoặc thủy tinh; tính góc khúc xạ r, hiện tượng bẻ gãy khúc của tia sáng tại mặt phân cách.',
  View: KhucXaView
};
