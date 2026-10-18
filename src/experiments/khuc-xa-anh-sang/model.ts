export interface KhucXaParams {
  i: number;          // Góc tới (độ)
  n: number;          // Chiết suất của môi trường trong suốt (nước 1,33; thủy tinh 1,5; kim cương 2,42)
  direction?: number; // 1: từ không khí vào môi trường (mặc định), 2: từ môi trường ra không khí
}

export interface KhucXaOutputs {
  r: number;            // Góc khúc xạ (độ); NaN khi xảy ra phản xạ toàn phần
  deviation: number;    // Góc lệch giữa tia khúc xạ và phương tia tới |i − r| (độ)
  mediumName: string;
  n: number;            // Chiết suất của môi trường trong suốt
  n1: number;           // Chiết suất môi trường chứa tia tới
  n2: number;           // Chiết suất môi trường chứa tia khúc xạ
  totalReflection: boolean; // true: phản xạ toàn phần, không có tia khúc xạ
  criticalAngle: number;    // Góc tới giới hạn i_gh (độ); NaN khi đi vào môi trường chiết suất lớn hơn
  reflectance: number;      // Phần ánh sáng bị phản xạ tại mặt phân cách (0–1)
}

/** Một số môi trường quen thuộc, dùng để gọi tên môi trường theo chiết suất. */
export const MEDIA = [
  { n: 1.33, name: 'Nước' },
  { n: 1.5, name: 'Thủy tinh' },
  { n: 2.42, name: 'Kim cương' }
];

/** Tên môi trường ứng với chiết suất n; không khớp môi trường quen thuộc nào thì gọi chung. */
export function mediumName(n: number): string {
  return MEDIA.find((m) => Math.abs(m.n - n) < 0.005)?.name ?? 'Môi trường trong suốt';
}

const toDeg = (rad: number) => (rad * 180) / Math.PI;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function computeKhucXa(params: KhucXaParams): KhucXaOutputs {
  const i_deg = Math.max(0, Math.min(89, params.i));
  const n = Math.max(1, Math.min(3, params.n || 1.33));
  const medium = { n, name: mediumName(n) };
  const outward = params.direction === 2;

  const n1 = outward ? medium.n : 1.0;
  const n2 = outward ? 1.0 : medium.n;

  // Định luật khúc xạ: n1·sin i = n2·sin r
  const i_rad = toRad(i_deg);
  const sin_r = (n1 / n2) * Math.sin(i_rad);
  const criticalAngle = n1 > n2 ? toDeg(Math.asin(n2 / n1)) : NaN;

  if (sin_r >= 1) {
    // Từ môi trường chiết suất lớn sang nhỏ, góc tới vượt góc giới hạn: toàn bộ ánh sáng phản xạ lại
    return {
      r: NaN,
      deviation: NaN,
      mediumName: `${medium.name} (n=${medium.n})`,
      n: medium.n,
      n1,
      n2,
      totalReflection: true,
      criticalAngle: Number(criticalAngle.toFixed(1)),
      reflectance: 1
    };
  }

  const r_rad = Math.asin(sin_r);
  const r_deg = toDeg(r_rad);

  // Công thức Fresnel cho ánh sáng không phân cực: cho biết tia phản xạ sáng hay mờ
  const cos_i = Math.cos(i_rad), cos_r = Math.cos(r_rad);
  const rs = (n1 * cos_i - n2 * cos_r) / (n1 * cos_i + n2 * cos_r);
  const rp = (n2 * cos_i - n1 * cos_r) / (n2 * cos_i + n1 * cos_r);
  const reflectance = (rs * rs + rp * rp) / 2;

  return {
    r: Number(r_deg.toFixed(1)),
    deviation: Number(Math.abs(i_deg - r_deg).toFixed(1)),
    mediumName: `${medium.name} (n=${medium.n})`,
    n: medium.n,
    n1,
    n2,
    totalReflection: false,
    criticalAngle: Number.isNaN(criticalAngle) ? NaN : Number(criticalAngle.toFixed(1)),
    reflectance
  };
}
