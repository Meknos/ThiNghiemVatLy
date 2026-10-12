export type CircuitTopology = 'single' | 'series' | 'parallel' | 'short';

export interface MachDienParams {
  voltage: number;         // Hiệu điện thế nguồn U (V)
  switchClosed: number;    // 1: Công tắc đóng, 0: Công tắc mở
  topology: number;        // 1: 1 Đèn, 2: 2 Đèn nối tiếp, 3: 2 Đèn song song, 4: Đoản mạch
  wireBroken: number;      // 0: Bình thường, 1: Đứt dây / hở mạch
}

export interface MachDienOutputs {
  isClosed: number;        // 1: Kín, 0: Hở
  isShortCircuit: number;  // 1: Nguy hiểm đoản mạch! 0: An toàn
  bulb1Lit: number;        // 1: Đèn 1 sáng, 0: Tắt
  bulb2Lit: number;        // 1: Đèn 2 sáng, 0: Tắt
  currentEst: number;      // Dòng điện ước tính (A) (giả định R đèn = 10 Ohm)
}

export function computeMachDien(params: MachDienParams): MachDienOutputs {
  const { voltage, switchClosed, topology, wireBroken } = params;

  if (wireBroken === 1 || switchClosed === 0) {
    return {
      isClosed: 0,
      isShortCircuit: 0,
      bulb1Lit: 0,
      bulb2Lit: 0,
      currentEst: 0
    };
  }

  // Đoản mạch (nối trực tiếp 2 cực nguồn không qua tải)
  if (topology === 4) {
    return {
      isClosed: 1,
      isShortCircuit: 1,
      bulb1Lit: 0,
      bulb2Lit: 0,
      currentEst: 99.9 // Cực lớn
    };
  }

  const R_bulb = 10; // Giả định điện trở định mức bóng đèn là 10 Ω

  if (topology === 1) {
    // 1 bóng đèn duy nhất
    const current = voltage / R_bulb;
    return {
      isClosed: 1,
      isShortCircuit: 0,
      bulb1Lit: 1,
      bulb2Lit: 0,
      currentEst: Number(current.toFixed(2))
    };
  }

  if (topology === 2) {
    // 2 bóng đèn nối tiếp (R_td = 20 Ω)
    const current = voltage / (2 * R_bulb);
    return {
      isClosed: 1,
      isShortCircuit: 0,
      bulb1Lit: 1,
      bulb2Lit: 1,
      currentEst: Number(current.toFixed(2))
    };
  }

  // 2 bóng đèn song song (R_td = 5 Ω)
  const current = voltage / (R_bulb / 2);
  return {
    isClosed: 1,
    isShortCircuit: 0,
    bulb1Lit: 1,
    bulb2Lit: 1,
    currentEst: Number(current.toFixed(2))
  };
}
