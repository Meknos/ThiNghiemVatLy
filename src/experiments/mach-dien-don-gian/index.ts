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
      label: 'Cấu hình mạch (1: 1 Đèn, 2: Nối tiếp, 3: Song song, 4: Đoản mạch)',
      symbol: 'Mode',
      unit: '',
      min: 1,
      max: 4,
      step: 1,
      defaultVal: 1
    },
    wireBroken: {
      label: 'Đứt dây dẫn (1: Có, 0: Không)',
      symbol: 'Break',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      defaultVal: 0
    }
  },
  outputs: [
    { label: 'Trạng thái mạch', symbol: 'Kín/Hở', unit: '' },
    { label: 'Cảnh báo đoản mạch', symbol: 'Short', unit: '' },
    { label: 'Đèn 1 phát sáng', symbol: 'Đ₁', unit: '' },
    { label: 'Đèn 2 phát sáng', symbol: 'Đ₂', unit: '' },
    { label: 'Cường độ dòng điện ước tính', symbol: 'I', unit: 'A' }
  ],
  compute: (p) => {
    const res = computeMachDien(p);
    return {
      'Kín/Hở': res.isClosed,
      'Short': res.isShortCircuit,
      'Đ₁': res.bulb1Lit,
      'Đ₂': res.bulb2Lit,
      'I': res.currentEst
    };
  },
  formulas: [
    '\\text{Mạch kín khi có dòng điện chạy từ cực dương qua tải về cực âm}',
    'I = \\frac{U}{R} \\quad (\\text{Định luật Ôm})',
    '\\text{Đoản mạch: nối tắt 2 cực nguồn điện, } I \\to \\infty'
  ],
  conditions: 'Dòng điện chỉ chạy trong mạch điện kín gồm các vật dẫn nối liền từ cực dương sang cực âm của nguồn điện.',
  aiHint: 'Các bài toán về lắp ráp mạch điện với pin, bóng đèn, công tắc; kiểm tra mạch hở, mạch kín; hiện tượng đoản mạch; mắc bóng đèn nối tiếp hoặc song song.',
  View: MachDienView
};
