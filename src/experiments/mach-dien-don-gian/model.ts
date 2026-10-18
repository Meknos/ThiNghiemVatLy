export interface MachDienParams {
  voltage: number;         // Hiệu điện thế nguồn U (V)
  switchClosed: number;    // 1: Công tắc đóng, 0: Công tắc mở
  topology: number;        // 1: 1 đèn, 2: 2 đèn nối tiếp, 3: 2 đèn song song, 4: đoản mạch
  wireBroken: number;      // 0: Bình thường, 1: Đứt dây / hở mạch
  bulb1Out?: number;       // 1: đèn Đ₁ bị tháo khỏi đui
  bulb2Out?: number;       // 1: đèn Đ₂ bị tháo khỏi đui
}

export interface MachDienOutputs {
  isClosed: number;        // 1: Kín, 0: Hở
  isShortCircuit: number;  // 1: Đoản mạch, 0: An toàn
  bulb1Lit: number;        // 1: Đèn 1 sáng, 0: Tắt
  bulb2Lit: number;        // 1: Đèn 2 sáng, 0: Tắt
  currentEst: number;      // Cường độ dòng điện qua nguồn (A)
  bulbVoltage: number;     // Hiệu điện thế giữa hai đầu mỗi đèn (V)
  bulbCurrent: number;     // Cường độ dòng điện qua mỗi đèn (A)
  brightness: number;      // Độ sáng của đèn đang sáng so với sáng bình thường (1 = sáng bình thường)
  overVoltage: number;     // 1: đèn bị đặt hiệu điện thế cao hơn nhiều so với định mức
}

/** Bóng đèn 6 V có điện trở 10 Ω (coi như không đổi). */
export const BULB_RESISTANCE = 10;
export const BULB_RATED_VOLTAGE = 6;
/** Khi đoản mạch chỉ còn điện trở rất nhỏ của dây và nguồn cản dòng điện. */
export const SHORT_RESISTANCE = 0.5;

const OPEN: MachDienOutputs = {
  isClosed: 0, isShortCircuit: 0, bulb1Lit: 0, bulb2Lit: 0,
  currentEst: 0, bulbVoltage: 0, bulbCurrent: 0, brightness: 0, overVoltage: 0
};

export function computeMachDien(params: MachDienParams): MachDienOutputs {
  const { voltage, switchClosed, topology, wireBroken } = params;

  // Dòng điện chỉ chạy trong mạch kín
  if (wireBroken === 1 || switchClosed === 0) return { ...OPEN };

  // Tháo một bóng đèn là làm hở nhánh chứa đèn đó
  const out1 = params.bulb1Out === 1;
  const out2 = params.bulb2Out === 1;
  if (topology === 1 && out1) return { ...OPEN };
  if (topology === 2 && (out1 || out2)) return { ...OPEN }; // nối tiếp: hở một chỗ là hở cả mạch
  if (topology === 3 && out1 && out2) return { ...OPEN };

  // Đoản mạch: hai cực của nguồn bị nối tắt bằng dây dẫn, không qua bóng đèn
  if (topology === 4) {
    return {
      ...OPEN,
      isClosed: 1,
      isShortCircuit: 1,
      currentEst: Number((voltage / SHORT_RESISTANCE).toFixed(2))
    };
  }

  // Nối tiếp: hiệu điện thế chia đều cho hai đèn. Song song: mỗi đèn nhận đủ U.
  const bulbVoltage = topology === 2 ? voltage / 2 : voltage;
  const bulbCurrent = bulbVoltage / BULB_RESISTANCE;
  // Song song: mỗi nhánh còn đèn góp một dòng điện; nhánh bị tháo đèn không có dòng
  const litBranches = topology === 3 ? (out1 ? 0 : 1) + (out2 ? 0 : 1) : 1;
  const total = litBranches * bulbCurrent;

  // Độ sáng theo công suất so với công suất định mức: (U/U_đm)²
  const brightness = Math.pow(bulbVoltage / BULB_RATED_VOLTAGE, 2);

  return {
    isClosed: 1,
    isShortCircuit: 0,
    bulb1Lit: out1 ? 0 : 1,
    bulb2Lit: topology === 1 || out2 ? 0 : 1,
    currentEst: Number(total.toFixed(2)),
    bulbVoltage: Number(bulbVoltage.toFixed(2)),
    bulbCurrent: Number(bulbCurrent.toFixed(2)),
    brightness,
    overVoltage: bulbVoltage > BULB_RATED_VOLTAGE * 1.5 ? 1 : 0
  };
}
