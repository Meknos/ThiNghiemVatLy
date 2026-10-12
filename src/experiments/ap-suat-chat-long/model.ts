import { Units } from '../../core/units';

export interface ApSuatChatLongParams {
  h_cm: number;     // Độ sâu của điểm xét tính từ mặt thoáng (cm)
  d_liquid: number; // Trọng lượng riêng chất lỏng (N/m³)
}

export interface ApSuatChatLongOutputs {
  p: number;        // Áp suất chất lỏng tại độ sâu h (N/m² hoặc Pa)
  jetRange: number; // Tầm xa tia nước phụt ra từ lỗ thành bình (cm)
}

export function computeApSuatChatLong(params: ApSuatChatLongParams): ApSuatChatLongOutputs {
  const h_cm = Math.max(1, params.h_cm);
  const d_liquid = Math.max(100, params.d_liquid);

  // h (m) = h (cm) / 100
  const h_m = Units.cmToM(h_cm);

  // p = d * h
  const p = d_liquid * h_m;

  // Giả sử cột nước tổng cao H = 80 cm
  // Tầm xa tia nước từ định luật Torricelli: x = 2 * sqrt(h * (H - h))
  const H_cm = 80;
  const clamped_h = Math.min(H_cm - 1, h_cm);
  const jetRange = 2 * Math.sqrt(clamped_h * (H_cm - clamped_h));

  return {
    p: Math.round(p),
    jetRange: Number(jetRange.toFixed(1))
  };
}
