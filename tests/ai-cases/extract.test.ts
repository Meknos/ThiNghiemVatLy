import { describe, it, expect } from 'vitest';
import { dispatchContextToTemplate } from '../../src/ai/dispatcher';

const extract = (prompt: string) => dispatchContextToTemplate(prompt).extractedParams ?? {};

describe('Trích số liệu từ đề bài', () => {
  it('áp suất chất rắn: khối lượng và diện tích', () => {
    expect(extract('Một khối sắt m = 2kg đặt trên đệm xốp với diện tích tiếp xúc 10cm2')).toMatchObject({ m: 2, S: 10 });
  });

  it('áp suất chất rắn: đề cho áp lực thay vì khối lượng', () => {
    expect(extract('Áp lực 20N tác dụng lên diện tích 25cm2')).toMatchObject({ m: 2, S: 25 });
  });

  it('phản xạ: góc hợp với mặt gương được đổi sang góc tới', () => {
    expect(extract('Xác định góc phản xạ khi góc hợp bởi tia tới và mặt gương là 30 độ')).toMatchObject({ i: 60 });
    expect(extract('Chiếu tia sáng tới gương phẳng với góc tới i = 30 độ, tính góc phản xạ')).toMatchObject({ i: 30 });
  });

  it('hai gương phẳng vuông góc, đề chép kèm ký hiệu LaTeX', () => {
    const prompt = String.raw`Hai gương phẳng \(G_1\) và \(G_2\) đặt vuông góc với nhau. Một tia sáng chiếu tới gương \(G_1\) với góc tới \(40^\circ\), sau đó phản xạ tới gương \(G_2\). d) Nếu thay đổi góc tới tại \(G_1\) thành \(55^\circ\)...`;
    const res = dispatchContextToTemplate(prompt);
    expect(res.templateId).toBe('hai-guong-phang');
    expect(res.extractedParams).toEqual({ theta: 90, i: 40 });
  });

  it('bản mặt song song: góc tới và chiết suất √3', () => {
    const res = dispatchContextToTemplate('Một tia sáng truyền từ không khí vào một bản thủy tinh có hai mặt song song. Góc tới tại mặt thứ nhất là 60°. Chiết suất của thủy tinh đối với ánh sáng đang xét là n = √3. Coi chiết suất của không khí bằng 1.');
    expect(res.templateId).toBe('ban-mat-song-song');
    expect(res.extractedParams).toEqual({ i: 60, n: 1.73 });
  });

  it('bản mặt song song: LaTeX \\sqrt và bề dày', () => {
    expect(extract(String.raw`Tia sáng chiếu tới bản mặt song song dày 6 cm với góc tới \(45^\circ\), chiết suất \(n=\sqrt{2}\)`)).toEqual({ i: 45, n: 1.41, e: 6 });
  });

  it('khúc xạ một mặt: đề cho chiết suất thì dùng đúng chiết suất đó', () => {
    expect(extract('Chiếu tia sáng từ không khí vào thủy tinh có chiết suất n = 1,6 với góc tới 30 độ, tính góc khúc xạ')).toMatchObject({ i: 30, n: 1.6 });
  });

  it('hai gương hợp góc cho trước', () => {
    expect(extract('Hai gương phẳng hợp với nhau một góc 60°. Chiếu tia sáng tới gương thứ nhất với góc tới 30°')).toEqual({ theta: 60, i: 30 });
  });

  it('một gương: đề có ký hiệu LaTeX vẫn đọc được góc', () => {
    const res = dispatchContextToTemplate(String.raw`Chiếu tia sáng tới gương phẳng với góc tới \(i = 35^{\circ}\)`);
    expect(res.templateId).toBe('phan-xa-anh-sang');
    expect(res.extractedParams).toMatchObject({ i: 35 });
  });

  it('mạch điện: cách mắc và hiệu điện thế nguồn', () => {
    expect(extract('Mắc 2 bóng đèn song song vào nguồn điện 12V')).toMatchObject({ topology: 3, voltage: 12 });
    expect(extract('Mắc hai bóng đèn nối tiếp và kiểm tra độ sáng')).toMatchObject({ topology: 2 });
    expect(extract('Hiện tượng đoản mạch khi nối tắt hai cực của nguồn điện')).toMatchObject({ topology: 4 });
    expect(extract('Mạch điện gồm 1 pin 6V nối tiếp với 1 bóng đèn và công tắc đóng')).toMatchObject({ topology: 1, voltage: 6 });
  });

  it('lực đẩy Ác-si-mét: thể tích, khối lượng, chất lỏng', () => {
    expect(extract('Một quả cầu kim loại nhúng chìm trong dầu có thể tích 200cm3')).toMatchObject({ V_cm3: 200, d_liquid: 8000 });
    expect(extract('Vật nặng 0.8kg nhúng chìm trong nước, tìm số chỉ lực kế')).toMatchObject({ m_kg: 0.8, d_liquid: 10000 });
  });

  it('áp suất chất lỏng: độ sâu', () => {
    expect(extract('Tính áp suất chất lỏng ở độ sâu h = 50cm trong nước')).toMatchObject({ h_cm: 50, d_liquid: 10000 });
  });

  it('khối lượng riêng: khối lượng và thể tích vật', () => {
    expect(extract('Một khối kim loại nặng 156g, thể tích đo bằng ống đong là 20cm3')).toMatchObject({ m_g: 156, V1_cm3: 50, V2_cm3: 70 });
  });

  it('định luật Ôm: U và R', () => {
    expect(extract('Đoạn mạch có hiệu điện thế U = 12V và điện trở R = 6 ôm theo định luật Ôm')).toMatchObject({ U: 12, R: 6 });
    expect(extract('Tính cường độ dòng điện chạy qua điện trở 10 ohm khi đặt vào hiệu điện thế 6V')).toMatchObject({ U: 6, R: 10 });
  });

  it('khúc xạ: góc tới và môi trường', () => {
    expect(extract('Chiếu tia sáng từ không khí vào nước với góc tới 45 độ')).toMatchObject({ i: 45, n: 1.33 });
    expect(extract('Hiện tượng khúc xạ ánh sáng khi tia sáng truyền vào khối thủy tinh')).toMatchObject({ n: 1.5 });
  });

  it('lực và chuyển động: chọn đúng bài', () => {
    expect(extract('Treo quả nặng vào lò xo và đo độ dãn của lò xo')).toMatchObject({ scene: 1 });
    expect(extract('Khảo sát điều kiện cân bằng của đòn bẩy quanh điểm tựa')).toMatchObject({ scene: 4 });
  });
});
