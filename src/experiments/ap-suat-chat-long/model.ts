import { Units } from '../../core/units';

export interface ApSuatChatLongParams {
  h_cm: number;     // Độ sâu của điểm xét tính từ mặt thoáng (cm)
  d_liquid: number; // Trọng lượng riêng chất lỏng (N/m³)
}

export interface ApSuatChatLongOutputs {
  p: number;        // Áp suất chất lỏng tại độ sâu h (N/m² hay Pa)
  jetRange: number; // Tầm xa tia nước phun ra từ lỗ ở độ sâu h (cm)
}

/** Cột chất lỏng cao 80 cm, bình đặt trên giá cao 80 cm so với mặt sàn. */
export const COLUMN_HEIGHT_CM = 80;
export const STAND_HEIGHT_CM = 80;

/**
 * Tầm xa của tia nước phun ngang từ lỗ ở độ sâu h, rơi xuống sàn.
 * Tốc độ phun v = √(2gh), thời gian rơi t = √(2y/g) với y là độ cao của lỗ so với sàn,
 * nên x = v·t = 2√(h·y). Vì bình đặt trên giá cao, lỗ càng sâu tia nước càng đi xa.
 */
export function jetRangeCm(h_cm: number): number {
  const h = Math.max(0, Math.min(COLUMN_HEIGHT_CM, h_cm));
  const dropHeight = COLUMN_HEIGHT_CM - h + STAND_HEIGHT_CM;
  return 2 * Math.sqrt(h * dropHeight);
}

export function computeApSuatChatLong(params: ApSuatChatLongParams): ApSuatChatLongOutputs {
  const h_cm = Math.max(1, params.h_cm);
  const d_liquid = Math.max(100, params.d_liquid);

  // p = d·h, với h tính bằng mét
  const p = d_liquid * Units.cmToM(h_cm);

  return {
    p: Math.round(p),
    jetRange: Number(jetRangeCm(h_cm).toFixed(1))
  };
}
