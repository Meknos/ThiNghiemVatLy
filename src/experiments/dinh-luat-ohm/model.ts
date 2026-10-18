export interface OhmParams {
  U: number; // Hiệu điện thế đặt vào 2 đầu điện trở (V)
  R: number; // Điện trở (Ω)
}

export interface OhmOutputs {
  I: number;       // Cường độ dòng điện (A)
  P_power: number; // Công suất tỏa nhiệt (W)
}

export function computeOhm(params: OhmParams): OhmOutputs {
  const U = Math.max(0, params.U);
  const R = Math.max(0.5, params.R);

  // I = U / R
  const I = U / R;

  // P = U * I
  const P_power = U * I;

  return {
    I: Number(I.toFixed(2)),
    P_power: Number(P_power.toFixed(2))
  };
}

/** Thang đo nhỏ nhất của ampe kế còn chứa được cường độ dòng điện I. */
export function ammeterRange(I: number): number {
  return [0.06, 0.6, 3, 30, 300].find((max) => I <= max) ?? 300;
}

/** Thang đo nhỏ nhất của vôn kế còn chứa được hiệu điện thế U. */
export function voltmeterRange(U: number): number {
  return [6, 12, 24, 60, 120, 240].find((max) => U <= max) ?? 240;
}
