export interface BanMatParams {
  i: number; // Góc tới tại mặt thứ nhất (độ)
  n: number; // Chiết suất của bản so với không khí
  e: number; // Bề dày của bản (cm)
}

export interface BanMatOutputs {
  r: number;         // Góc khúc xạ tại mặt thứ nhất (độ), cũng là góc tới tại mặt thứ hai
  iOut: number;      // Góc ló ra khỏi mặt thứ hai (độ), bằng góc tới i
  shift: number;     // Khoảng cách giữa tia ló và phương tia tới kéo dài (cm)
  pathInside: number; // Quãng đường tia sáng đi trong bản (cm)
}

const DEG = Math.PI / 180;
const round = (x: number, digits = 2) => Number(x.toFixed(digits));

/**
 * Tia sáng đi từ không khí qua bản trong suốt có hai mặt song song.
 * Mặt thứ nhất: sin i = n·sin r. Mặt thứ hai: góc tới bằng r nên n·sin r = sin i', suy ra i' = i:
 * tia ló song song với tia tới, chỉ bị dời ngang một đoạn.
 */
export function computeBanMat(params: BanMatParams): BanMatOutputs {
  const i = Math.max(0, Math.min(89, params.i)) * DEG;
  const n = Math.max(1, Math.min(3, params.n || 1.5));
  const e = Math.max(0.1, params.e);

  const r = Math.asin(Math.sin(i) / n);
  const pathInside = e / Math.cos(r);
  const shift = pathInside * Math.sin(i - r);

  return {
    r: round(r / DEG, 1),
    iOut: round(i / DEG, 1),
    shift: round(shift),
    pathInside: round(pathInside)
  };
}
