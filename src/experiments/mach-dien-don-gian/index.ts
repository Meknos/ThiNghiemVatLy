import { ExperimentTemplate } from '../../core/types';
import { MachDienParams, computeMachDien } from './model';
import { MachDienView } from './View';

export const machDienDonGianTemplate: ExperimentTemplate<MachDienParams> = {
  id: 'mach-dien-don-gian',
  title: 'Mạch Điện Đơn Giản & Tác Dụng Dòng Điện',
  group: 'Điện học',
  topic: 'Dòng điện & Mạch điện',
  grade: 8,
  params: {
    voltage: {
      label: 'Hiệu điện thế nguồn',
      symbol: 'U',
      unit: 'V',
      min: 1.5,
      max: 24,
      step: 1.5,
      defaultVal: 6
    },
    switchClosed: {
      label: 'Trạng thái công tắc K (1: Đóng, 0: Mở)',
      symbol: 'K',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      defaultVal: 1
    },
    topology: {
      label: 'Cách mắc (1: một đèn, 2: nối tiếp, 3: song song, 4: đoản mạch)',
      symbol: 'Mắc',
      unit: '',
      min: 1,
      max: 4,
      step: 1,
      defaultVal: 1
    },
    wireBroken: {
      label: 'Đứt dây dẫn (1: Có, 0: Không)',
      symbol: 'Đứt',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      defaultVal: 0
    },
    bulb1Out: {
      label: 'Tháo đèn Đ₁ khỏi đui (1: Có, 0: Không)',
      symbol: 'Tháo Đ₁',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      defaultVal: 0
    },
    bulb2Out: {
      label: 'Tháo đèn Đ₂ khỏi đui (1: Có, 0: Không)',
      symbol: 'Tháo Đ₂',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      defaultVal: 0
    }
  },
  outputs: [
    { label: 'Mạch kín (1) hay hở (0)', symbol: 'Kín', unit: '' },
    { label: 'Cường độ dòng điện qua nguồn', symbol: 'I', unit: 'A' },
    { label: 'Hiệu điện thế hai đầu mỗi đèn', symbol: 'U_đ', unit: 'V' },
    { label: 'Cường độ dòng điện qua mỗi đèn', symbol: 'I_đ', unit: 'A' }
  ],
  compute: (p) => {
    const res = computeMachDien(p);
    return {
      'Kín': res.isClosed,
      'I': res.currentEst,
      'U_đ': res.bulbVoltage,
      'I_đ': res.bulbCurrent
    };
  },
  formulas: [
    '\\text{Dòng điện chỉ chạy trong mạch kín: cực dương} \\to \\text{dây dẫn, đèn} \\to \\text{cực âm}',
    '\\text{Nối tiếp: } I = I_1 = I_2; \\quad U = U_1 + U_2',
    '\\text{Song song: } I = I_1 + I_2; \\quad U = U_1 = U_2',
    '\\text{Đoản mạch: dòng điện rất lớn, làm nóng dây dẫn và nguồn điện}'
  ],
  conditions: 'Mỗi bóng đèn trong mô phỏng là đèn 6 V, điện trở 10 Ω coi như không đổi. Độ sáng vẽ theo công suất so với định mức. Khi đoản mạch, dòng điện tính với điện trở 0,5 Ω của dây và nguồn, chỉ để minh họa rằng dòng điện rất lớn.',
  aiHint: 'Các bài toán về lắp ráp mạch điện với pin, bóng đèn, công tắc; kiểm tra mạch hở, mạch kín; hiện tượng đoản mạch; mắc bóng đèn nối tiếp hoặc song song.',
  View: MachDienView
};
