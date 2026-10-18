import { describe, it, expect } from 'vitest';
import { dispatchContextToTemplate } from '../../src/ai/dispatcher';
import { getExperimentById } from '../../src/core/registry';

/**
 * Đề bài THCS cho các mẫu công thức: mỗi đề phải chọn đúng mẫu, trích đúng số liệu
 * (đã đổi đơn vị) và đúng đại lượng cần tìm, kể cả khi không có AI.
 */
const CASES: { prompt: string; template: string; params: Record<string, number>; answer?: [string, number] }[] = [
  // Quang học
  { prompt: 'Vật sáng AB đặt vuông góc với trục chính của thấu kính hội tụ có tiêu cự 12 cm, cách thấu kính 36 cm. Xác định vị trí ảnh.', template: 'thau-kinh-hoi-tu', params: { f: 12, d: 36, find: 1 }, answer: ["d'", 18] },
  { prompt: 'Đặt vật cách thấu kính hội tụ 8 cm, tiêu cự f = 12 cm. Ảnh là ảnh gì, cách thấu kính bao nhiêu?', template: 'thau-kinh-hoi-tu', params: { f: 12, d: 8, find: 1 }, answer: ["d'", -24] },
  { prompt: 'Vật AB cách thấu kính phân kì 30 cm, tiêu cự 15 cm. Tính khoảng cách từ ảnh đến thấu kính.', template: 'thau-kinh-phan-ki', params: { f: 15, d: 30, find: 1 }, answer: ["d'", 10] },
  { prompt: 'Một kính lúp có tiêu cự 5 cm. Tính số bội giác của kính lúp.', template: 'kinh-lup', params: { f: 5, find: 1 }, answer: ['G', 5] },
  { prompt: 'Ánh sáng truyền trong thủy tinh với tốc độ 200000 km/s. Tính chiết suất của thủy tinh.', template: 'chiet-suat', params: { v: 200000, find: 1 }, answer: ['n', 1.5] },
  // Âm học
  { prompt: 'Một người đứng cách vách đá và hét to, sau 1,5 giây thì nghe thấy tiếng vang. Tính khoảng cách từ người đến vách đá, biết tốc độ âm trong không khí là 340 m/s.', template: 'tieng-vang', params: { v: 340, t: 1.5, find: 1 }, answer: ['d', 255] },
  { prompt: 'Tàu phát sóng siêu âm xuống đáy biển, sau 2 s thu được âm phản xạ. Tính độ sâu của biển.', template: 'tieng-vang', params: { v: 1500, t: 2, find: 1 }, answer: ['d', 1500] },
  { prompt: 'Một con lắc thực hiện 30 dao động trong 10 giây. Tính tần số dao động của con lắc.', template: 'tan-so-dao-dong', params: { N: 30, t: 10, find: 1 }, answer: ['f', 3] },
  // Điện học
  { prompt: 'Hai điện trở R1 = 6 Ω và R2 = 12 Ω mắc nối tiếp. Tính điện trở tương đương.', template: 'dien-tro-noi-tiep', params: { R1: 6, R2: 12, find: 1 }, answer: ['Rtđ', 18] },
  { prompt: 'Cho hai điện trở 10 Ω và 15 Ω mắc song song. Tính điện trở tương đương của đoạn mạch.', template: 'dien-tro-song-song', params: { R1: 10, R2: 15, find: 1 }, answer: ['Rtđ', 6] },
  { prompt: 'Một dây dẫn bằng đồng dài 100 m, tiết diện 0,5 mm². Tính điện trở của dây.', template: 'dien-tro-day-dan', params: { rho: 1.7, l: 100, S: 0.5, find: 1 }, answer: ['R', 3.4] },
  { prompt: 'Một dây nicrom dài 2 m có tiết diện 0,2 mm², điện trở suất 1,1.10^-6 Ωm. Tính điện trở của dây.', template: 'dien-tro-day-dan', params: { rho: 110, l: 2, S: 0.2, find: 1 }, answer: ['R', 11] },
  { prompt: 'Một bếp điện có điện trở 40 Ω, cường độ dòng điện 5 A chạy qua trong 10 phút. Tính nhiệt lượng tỏa ra.', template: 'nhiet-luong-toa-ra', params: { I: 5, R: 40, t: 600, find: 1 }, answer: ['Q', 600000] },
  { prompt: 'Đặt hiệu điện thế 12 V vào hai đầu một dây dẫn thì cường độ dòng điện là 0,5 A. Tính điện trở của dây.', template: 'dinh-luat-ohm-ct', params: { I: 0.5, U: 12, find: 3 }, answer: ['R', 24] },
  { prompt: 'Cuộn sơ cấp của máy biến áp có 4400 vòng, cuộn thứ cấp có 240 vòng. Đặt vào cuộn sơ cấp hiệu điện thế 220 V. Tính hiệu điện thế ở cuộn thứ cấp.', template: 'may-bien-ap', params: { U1: 220, N1: 4400, N2: 240, find: 1 }, answer: ['U2', 12] },
  { prompt: 'Truyền tải công suất 100 kW bằng dây có điện trở 5 Ω dưới hiệu điện thế 10 kV. Tính công suất hao phí.', template: 'cong-suat-hao-phi', params: { R: 5, P: 100000, U: 10000, find: 1 }, answer: ['𝒫hp', 500] },
  { prompt: 'Một bóng đèn 100 W dùng 5 giờ. Tính điện năng tiêu thụ.', template: 'dien-nang', params: { P: 100, t: 18000, find: 1 }, answer: ['W', 1800000] },
  { prompt: 'Ấm điện ghi 220V - 1000W. Tính cường độ dòng điện định mức.', template: 'cong-suat-dien', params: { U: 220, P: 1000, find: 3 } },
  // Nhiệt học
  { prompt: 'Thả một quả cầu nhôm khối lượng 0,2 kg đã được nung nóng tới 100°C vào một cốc nước 0,5 kg ở 20°C. Tính nhiệt độ khi cân bằng nhiệt.', template: 'can-bang-nhiet', params: { m1: 0.2, c1: 880, t1: 100, m2: 0.5, c2: 4200, t2: 20, find: 1 } },
  { prompt: 'Một ấm chứa 2 kg nước ở 25°C, thả vào đó miếng đồng 0,5 kg ở 120°C. Tính nhiệt độ cân bằng.', template: 'can-bang-nhiet', params: { m1: 0.5, c1: 380, t1: 120, m2: 2, c2: 4200, t2: 25, find: 1 } },
  { prompt: 'Tính nhiệt lượng cần thiết để đun nóng 2 kg nước từ 20°C lên 100°C.', template: 'nhiet-luong', params: { m: 2, c: 4200, dt: 80, find: 1 }, answer: ['Q', 672000] },
  { prompt: 'Tính nhiệt lượng tỏa ra khi đốt cháy hoàn toàn 2 kg xăng.', template: 'nhiet-luong-nhien-lieu', params: { q: 46, m: 2, find: 1 }, answer: ['Q', 92000000] },
  { prompt: 'Đổi 25°C sang độ F.', template: 'doi-nhiet-do', params: { t: 25, find: 1 }, answer: ['t(°F)', 77] },
  { prompt: 'Nhiệt độ 300 K bằng bao nhiêu độ C?', template: 'nhiet-do-kelvin', params: { T: 300, find: 2 }, answer: ['t', 27] },
  // Cơ học
  { prompt: 'Máy nén thủy lực có pít-tông nhỏ diện tích 2,5 cm², pít-tông lớn diện tích 200 cm². Tác dụng lên pít-tông nhỏ lực 100 N thì lực nâng ở pít-tông lớn là bao nhiêu?', template: 'may-nen-thuy-luc', params: { f: 100, S: 200, s: 2.5, find: 1 }, answer: ['F', 8000] },
  { prompt: 'Kéo vật nặng 500 N lên cao 1,2 m bằng mặt phẳng nghiêng dài 4 m. Bỏ qua ma sát, tính lực kéo.', template: 'mat-phang-nghieng', params: { P: 500, h: 1.2, l: 4, find: 1 }, answer: ['F', 150] },
  { prompt: 'Một động cơ có công có ích 3600 J, công toàn phần 4500 J. Tính hiệu suất.', template: 'hieu-suat', params: { Aci: 3600, Atp: 4500, find: 1 }, answer: ['H', 80] },
  { prompt: 'Một vật có động năng 20 J và thế năng 30 J. Tính cơ năng của vật.', template: 'co-nang', params: { Wd: 20, Wt: 30, find: 1 }, answer: ['W', 50] },
  { prompt: 'Treo vật vào lò xo có độ cứng 100 N/m thì lò xo giãn 5 cm. Tính lực đàn hồi.', template: 'luc-dan-hoi', params: { k: 100, dl: 5, find: 1 }, answer: ['Fđh', 5] },
  { prompt: 'Đòn bẩy có điểm tựa O, đầu A treo vật nặng 200 N cách O 20 cm. Đầu B cách O 80 cm. Tính lực tác dụng ở B để đòn bẩy cân bằng.', template: 'don-bay', params: { F2: 200, d2: 20, d1: 80, find: 1 }, answer: ['F1', 50] },
  { prompt: 'Một người đi xe đạp lên dốc dài 1,2 km hết 10 phút, xuống dốc dài 1,8 km hết 5 phút. Tính tốc độ trung bình trên cả hai đoạn.', template: 'toc-do-trung-binh', params: { s1: 1200, t1: 600, s2: 1800, t2: 300, find: 1 } },
  { prompt: 'Ô tô có lực kéo 2000 N chuyển động đều với tốc độ 36 km/h. Tính công suất của động cơ.', template: 'cong-suat-keo', params: { F: 2000, v: 10, find: 1 }, answer: ['𝒫', 20000] },
  { prompt: 'Tính khối lượng của 2 lít dầu biết khối lượng riêng của dầu là 800 kg/m3.', template: 'khoi-luong-rieng-ct', params: { D: 800, V: 2, find: 2 }, answer: ['m', 1.6] },
  { prompt: 'Một khối sắt có khối lượng riêng 7800 kg/m3. Tính trọng lượng riêng của sắt.', template: 'trong-luong-rieng', params: { D: 7800, find: 1 }, answer: ['d', 78000] },
  { prompt: 'Một vật nhúng chìm trong nước chịu lực đẩy Ác-si-mét 2 N. Tính thể tích của vật.', template: 'luc-day-ac-si-met-ct', params: { FA: 2, d: 10000, find: 3 }, answer: ['V', 200] },
  { prompt: 'Áp suất tác dụng lên thợ lặn là 206000 Pa. Biết trọng lượng riêng nước biển 10300 N/m3, tính độ sâu của thợ lặn.', template: 'ap-suat-chat-long-ct', params: { p: 206000, d: 10300, find: 3 }, answer: ['h', 20] },
  { prompt: 'Một người nặng 50 kg đứng trên sàn gây áp suất 12500 Pa. Tính diện tích tiếp xúc của hai bàn chân.', template: 'ap-suat', params: { p: 12500, F: 500, find: 3 }, answer: ['S', 400] },
  { prompt: 'Một người đi bộ 1,5 km trong 20 phút. Tính tốc độ.', template: 'toc-do', params: { s: 1500, t: 1200, find: 1 }, answer: ['v', 1.25] },
  { prompt: 'Kéo thùng hàng với lực 200 N đi được 15 m. Tính công của lực kéo.', template: 'cong-co-hoc', params: { F: 200, s: 15, find: 1 }, answer: ['A', 3000] },
  { prompt: 'Vật có khối lượng 2 kg đang chuyển động với tốc độ 5 m/s. Tính động năng.', template: 'dong-nang', params: { m: 2, v: 5, find: 1 }, answer: ['Wđ', 25] },
  { prompt: 'Vật khối lượng 3 kg ở độ cao 10 m. Tính thế năng.', template: 'the-nang', params: { m: 3, h: 10, find: 1 }, answer: ['Wt', 300] }
];

describe('Đề bài → mẫu công thức, số liệu và đáp số', () => {
  for (const c of CASES) {
    it(c.prompt.slice(0, 70), () => {
      const res = dispatchContextToTemplate(c.prompt);
      expect(res.templateId).toBe(c.template);
      expect(res.extractedParams).toEqual(c.params);
      if (c.answer) {
        const template = getExperimentById(c.template)!;
        const full: Record<string, number> = {};
        for (const [key, def] of Object.entries(template.params)) full[key] = res.extractedParams![key] ?? def.defaultVal;
        expect(template.compute(full)[c.answer[0]]).toBeCloseTo(c.answer[1], 4);
      }
    });
  }
});
