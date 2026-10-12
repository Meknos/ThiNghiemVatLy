import { ExperimentTemplate } from '../../core/types';
import { OhmParams, computeOhm } from './model';
import { OhmView } from './View';

export const dinhLuatOhmTemplate: ExperimentTemplate<OhmParams> = {
  id: 'dinh-luat-ohm',
  title: 'Định Luật Ôm & Đo Dòng Điện, Hiệu Điện Thế',
  group: 'Điện học',
  topic: 'Định luật Ôm',
  grade: 9,
  params: {
    U: {
      label: 'Hiệu điện thế nguồn',
      symbol: 'U',
      unit: 'V',
      min: 1,
      max: 24,
      step: 0.5,
      defaultVal: 12
    },
    R: {
      label: 'Điện trở đoạn mạch',
      symbol: 'R',
      unit: 'Ω',
      min: 1,
      max: 50,
      step: 1,
      defaultVal: 10
    }
  },
  outputs: [
    { label: 'Cường độ dòng điện (Ampe kế)', symbol: 'I', unit: 'A' },
    { label: 'Công suất tiêu thụ', symbol: 'P', unit: 'W' }
  ],
  compute: (p) => {
    const res = computeOhm(p);
    return {
      I: res.I,
      P: res.P_power
    };
  },
  formulas: [
    'I = \\frac{U}{R} \\quad (\\text{Định luật Ôm})',
    'R = \\frac{U}{I} = \\text{hằng số}',
    'P = U \\cdot I = I^2 \\cdot R \\quad (\\text{Công suất tỏa nhiệt})'
  ],
  conditions: 'Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây.',
  aiHint: 'Các bài toán về định luật Ôm I = U/R; khảo sát sự phụ thuộc của cường độ dòng điện vào hiệu điện thế; số chỉ ampe kế và vôn kế.',
  View: OhmView
};
