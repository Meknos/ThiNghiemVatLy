import { ExperimentTemplate } from '../../core/types';
import { BanMatParams, computeBanMat } from './model';
import { BanMatView } from './View';

export const banMatSongSongTemplate: ExperimentTemplate<BanMatParams> = {
  id: 'ban-mat-song-song',
  title: 'Tia Sáng Qua Bản Mặt Song Song',
  group: 'Quang học',
  topic: 'Khúc xạ ánh sáng',
  grade: 9,
  params: {
    i: {
      label: 'Góc tới tại mặt thứ nhất',
      symbol: 'i',
      unit: '°',
      min: 0,
      max: 85,
      step: 1,
      defaultVal: 60
    },
    n: {
      label: 'Chiết suất của bản',
      symbol: 'n',
      unit: '',
      min: 1,
      max: 2.5,
      step: 0.01,
      defaultVal: 1.5
    },
    e: {
      label: 'Bề dày của bản',
      symbol: 'e',
      unit: 'cm',
      min: 1,
      max: 20,
      step: 0.5,
      defaultVal: 5
    }
  },
  outputs: [
    { label: 'Góc khúc xạ tại mặt thứ nhất (cũng là góc tới mặt thứ hai)', symbol: 'r', unit: '°' },
    { label: 'Góc ló ra khỏi mặt thứ hai', symbol: "i'", unit: '°' },
    { label: 'Độ dời ngang của tia ló so với tia tới', symbol: 'd', unit: 'cm' },
    { label: 'Quãng đường tia sáng đi trong bản', symbol: 'IJ', unit: 'cm' }
  ],
  compute: (p) => {
    const res = computeBanMat(p);
    return { r: res.r, "i'": res.iOut, d: res.shift, IJ: res.pathInside };
  },
  formulas: [
    '\\sin i = n \\sin r \\quad (\\text{mặt thứ nhất})',
    "n \\sin r = \\sin i' \\Rightarrow i' = i \\quad (\\text{mặt thứ hai})",
    '\\text{Tia ló song song với tia tới}',
    'd = \\frac{e \\sin(i - r)}{\\cos r}'
  ],
  conditions:
    'Hai mặt của bản song song với nhau và bản đặt trong không khí (n = 1). Góc tới ở mặt thứ hai bằng góc khúc xạ r ở mặt thứ nhất nên không xảy ra phản xạ toàn phần; tia ló luôn song song với tia tới.',
  aiHint:
    'Các bài toán tia sáng đi qua bản (tấm, khối) thủy tinh hoặc chất trong suốt có HAI MẶT SONG SONG: tính góc khúc xạ ở mặt thứ nhất, góc ló ở mặt thứ hai, chứng minh tia ló song song tia tới, độ dời ngang của tia sáng theo bề dày bản. Đề cho chiết suất thì điền đúng số đó (n = √3 điền 1.73).',
  View: BanMatView
};
