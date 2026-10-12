/**
 * AIPLab Studio - Đổi đơn vị chuẩn THCS
 */

export const Units = {
  // Diện tích
  cm2ToM2: (cm2: number) => cm2 / 10000,
  m2ToCm2: (m2: number) => m2 * 10000,
  dm2ToM2: (dm2: number) => dm2 / 100,

  // Khối lượng
  gToKg: (g: number) => g / 1000,
  kgToG: (kg: number) => kg * 1000,
  tonToKg: (ton: number) => ton * 1000,

  // Chiều dài
  mmToM: (mm: number) => mm / 1000,
  cmToM: (cm: number) => cm / 100,
  dmToM: (dm: number) => dm / 10,
  kmToM: (km: number) => km * 1000,

  // Thể tích
  mlToM3: (ml: number) => ml / 1_000_000,
  lToM3: (lit: number) => lit / 1000,
  cm3ToM3: (cm3: number) => cm3 / 1_000_000,
  dm3ToM3: (dm3: number) => dm3 / 1000,

  // Tốc độ
  kmhToMs: (kmh: number) => kmh / 3.6,
  msToKmh: (ms: number) => ms * 3.6,

  // Trọng lực P = 10m (quy ước SGK THCS KHTN)
  massToWeight: (kg: number, g = 10) => kg * g
};
