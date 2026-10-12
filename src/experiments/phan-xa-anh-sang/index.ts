import { ExperimentTemplate } from '../../core/types';
import { PhanXaParams, computePhanXa } from './model';
import { PhanXaView } from './View';

export const phanXaAnhSangTemplate: ExperimentTemplate<PhanXaParams> = {
  id: 'phan-xa-anh-sang',
  title: 'Định Luật Phản Xạ Ánh Sáng',
  group: 'Quang học',
  topic: 'Ánh sáng',
  grade: 7,
  params: {
    i: {
      label: 'Góc tới',
      symbol: 'i',
      unit: '°',
      min: 0,
      max: 89,
      step: 1,
      defaultVal: 45
    },
    mirrorAngle: {
      label: 'Góc nghiêng gương phẳng',
      symbol: 'α',
      unit: '°',
      min: -45,
      max: 45,
      step: 1,
      defaultVal: 0
    }
  },
  outputs: [
    { label: 'Góc phản xạ', symbol: "i'", unit: '°' },
    { label: 'Góc giữa tia tới & phản xạ', symbol: '2i', unit: '°' },
    { label: 'Góc hợp với mặt gương', symbol: 'β', unit: '°' }
  ],
  compute: (p) => {
    const res = computePhanXa(p);
    return {
      "i'": res.i_prime,
      '2i': res.angleBetweenRays,
      'β': res.angleWithMirror
    };
  },
  formulas: [
    "i' = i",
    "\\text{Góc giữa 2 tia} = i + i' = 2i",
    "\\text{Góc hợp với mặt gương} = 90^\\circ - i"
  ],
  conditions: 'Tia phản xạ nằm trong mặt phẳng tới và ở phía bên kia pháp tuyến so với tia tới. Góc đo luôn tính so với pháp tuyến.',
  aiHint: 'Các bài toán chiếu tia sáng tới gương phẳng với góc tới i, hoặc góc hợp bởi tia tới và mặt gương; yêu cầu tính góc phản xạ hoặc góc tạo bởi 2 tia.',
  View: PhanXaView
};
