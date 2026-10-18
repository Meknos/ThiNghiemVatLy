import { ExperimentTemplate } from '../../core/types';
import { KhucXaParams, computeKhucXa } from './model';
import { KhucXaView } from './View';

export const khucXaAnhSangTemplate: ExperimentTemplate<KhucXaParams> = {
  id: 'khuc-xa-anh-sang',
  title: 'Khúc Xạ Ánh Sáng & Phản Xạ Toàn Phần',
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
    n: {
      label: 'Chiết suất của môi trường (nước 1,33; thủy tinh 1,5; kim cương 2,42)',
      symbol: 'n',
      unit: '',
      min: 1,
      max: 2.5,
      step: 0.01,
      defaultVal: 1.33
    },
    direction: {
      label: 'Chiều truyền (1: không khí → môi trường, 2: môi trường → không khí)',
      symbol: 'Chiều',
      unit: '',
      min: 1,
      max: 2,
      step: 1,
      defaultVal: 1
    }
  },
  outputs: [
    { label: 'Góc khúc xạ', symbol: 'r', unit: '°' },
    { label: 'Góc lệch của tia sáng', symbol: 'D', unit: '°' },
    { label: 'Góc tới giới hạn', symbol: 'i_gh', unit: '°' }
  ],
  compute: (p) => {
    const res = computeKhucXa(p);
    return {
      r: res.r,
      D: res.deviation,
      'i_gh': res.criticalAngle
    };
  },
  formulas: [
    'n_1 \\sin i = n_2 \\sin r \\quad (\\text{Định luật khúc xạ})',
    '\\text{Không khí} \\to \\text{nước, thủy tinh: } r < i; \\quad \\text{chiều ngược lại: } r > i',
    '\\sin i_{gh} = \\frac{n_2}{n_1} \\quad (n_1 > n_2); \\quad i > i_{gh} \\Rightarrow \\text{phản xạ toàn phần}'
  ],
  conditions: 'Tia khúc xạ nằm trong mặt phẳng tới và ở bên kia pháp tuyến so với tia tới. Phản xạ toàn phần chỉ xảy ra khi ánh sáng đi từ môi trường chiết suất lớn sang môi trường chiết suất nhỏ hơn và góc tới lớn hơn góc giới hạn. Dấu "—" ở kết quả nghĩa là không có giá trị trong trường hợp đang xét.',
  aiHint: 'Các bài toán chiếu tia sáng qua MỘT mặt phân cách, từ không khí vào nước, thủy tinh hoặc ngược lại; tính góc khúc xạ r; hiện tượng tia sáng bị gãy khúc; phản xạ toàn phần và góc tới giới hạn. Đề cho chiết suất thì điền đúng số đó vào n (n = √3 thì điền 1.73); đề chỉ nói tên môi trường thì nước 1.33, thủy tinh 1.5, kim cương 2.42. Bản thủy tinh hai mặt song song thì dùng mẫu ban-mat-song-song.',
  View: KhucXaView
};
