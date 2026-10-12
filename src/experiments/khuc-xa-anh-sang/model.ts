export interface KhucXaParams {
  i: number;      // Góc tới (độ, 0 -> 89)
  medium: number; // 1: Nước (n=1.33), 2: Thủy tinh (n=1.5), 3: Kim cương (n=2.42)
}

export interface KhucXaOutputs {
  r: number;        // Góc khúc xạ (độ)
  deviation: number; // Góc lệch D = |i - r| (độ)
  mediumName: string;
}

export function computeKhucXa(params: KhucXaParams): KhucXaOutputs {
  const i_deg = Math.max(0, Math.min(89, params.i));
  let n2 = 1.33;
  let mediumName = 'Nước (n=1.33)';

  if (params.medium === 2) {
    n2 = 1.5;
    mediumName = 'Thủy tinh (n=1.5)';
  } else if (params.medium === 3) {
    n2 = 2.42;
    mediumName = 'Kim cương (n=2.42)';
  }

  const n1 = 1.0; // Không khí

  // sin(r) = (n1 / n2) * sin(i)
  const i_rad = (i_deg * Math.PI) / 180;
  const sin_r = (n1 / n2) * Math.sin(i_rad);
  const r_rad = Math.asin(Math.min(1.0, sin_r));
  const r_deg = (r_rad * 180) / Math.PI;

  const deviation = Math.abs(i_deg - r_deg);

  return {
    r: Number(r_deg.toFixed(1)),
    deviation: Number(deviation.toFixed(1)),
    mediumName
  };
}
