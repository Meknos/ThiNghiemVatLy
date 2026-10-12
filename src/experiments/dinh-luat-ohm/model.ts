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
