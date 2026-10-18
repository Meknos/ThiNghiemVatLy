import { ExperimentTemplate } from '../../core/types';
import { HaiGuongParams, computeHaiGuong } from './model';
import { HaiGuongView } from './View';

export const haiGuongPhangTemplate: ExperimentTemplate<HaiGuongParams> = {
  id: 'hai-guong-phang',
  title: 'Hệ Hai Gương Phẳng',
  group: 'Quang học',
  topic: 'Ánh sáng',
  grade: 7,
  params: {
    i: {
      label: 'Góc tới tại gương G1',
      symbol: 'i',
      unit: '°',
      min: 0,
      max: 89,
      step: 1,
      defaultVal: 40
    },
    theta: {
      label: 'Góc hợp bởi hai gương',
      symbol: 'θ',
      unit: '°',
      min: 30,
      max: 150,
      step: 1,
      defaultVal: 90
    }
  },
  outputs: [
    { label: 'Góc phản xạ tại G1', symbol: "i'", unit: '°' },
    { label: 'Góc tới tại G2', symbol: 'i₂', unit: '°' },
    { label: 'Góc phản xạ tại G2', symbol: "i₂'", unit: '°' },
    { label: 'Góc giữa tia tới đầu và tia ló cuối (180° là song song ngược chiều)', symbol: 'γ', unit: '°' },
    { label: 'Số lần phản xạ', symbol: 'n', unit: 'lần' }
  ],
  compute: (p) => {
    const res = computeHaiGuong(p);
    return {
      "i'": res.i1Prime,
      'i₂': res.i2,
      "i₂'": res.i2Prime,
      'γ': res.angleBetween,
      n: res.reflections
    };
  },
  formulas: [
    "i' = i",
    'i_2 = \\theta - i \\quad (\\theta = 90^\\circ \\Rightarrow i_2 = 90^\\circ - i)',
    "i_2' = i_2",
    '\\theta = 90^\\circ \\Rightarrow \\text{tia ló song song, ngược chiều tia tới}'
  ],
  conditions:
    'Tia tới nằm trong mặt phẳng vuông góc với giao tuyến hai gương. Công thức i₂ = θ − i đúng khi tia phản xạ ở G₁ tới được G₂; với hai gương vuông góc, mọi góc tới từ 0° đến 90° đều cho tia ló song song ngược chiều tia tới.',
  aiHint:
    'Các bài toán có HAI gương phẳng đặt vuông góc hoặc hợp với nhau một góc θ (60°, 90°, 120°...): tia sáng phản xạ lần lượt trên G1 rồi G2; tính góc phản xạ ở mỗi gương, góc tới ở gương thứ hai, chứng minh tia ló song song ngược chiều tia tới, vẽ đường truyền tia sáng qua hai gương.',
  View: HaiGuongView
};
