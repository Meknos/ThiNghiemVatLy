export interface HaiGuongParams {
  i: number;     // Góc tới tại gương G1 (độ, so với pháp tuyến)
  theta: number; // Góc hợp bởi hai gương G1 và G2 (độ)
}

export interface Point {
  x: number;
  y: number;
}

export interface HaiGuongOutputs {
  i1Prime: number;     // Góc phản xạ tại G1
  i2: number;          // Góc tới tại G2 (NaN nếu tia không tới G2)
  i2Prime: number;     // Góc phản xạ tại G2
  angleBetween: number; // Góc giữa phương tia tới ban đầu và tia ló cuối cùng (180° = song song ngược chiều)
  reflections: number; // Tổng số lần phản xạ trước khi tia ló ra ngoài
  /** Đường đi của tia sáng: điểm vào, các điểm phản xạ, điểm ra. Đơn vị: OI1 = 1. */
  path: Point[];
}

const DEG = Math.PI / 180;
const MAX_REFLECTIONS = 12;
const EXIT_LENGTH = 2.2;
const ENTRY_LENGTH = 1.6;

const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;

/** Giao của tia (p + t·v, t > 0) với nửa đường thẳng gương (s·u, s ≥ 0) xuất phát từ giao tuyến O. */
function hitMirror(p: Point, v: Point, u: Point): { t: number; s: number } | null {
  const det = v.x * -u.y - v.y * -u.x;
  if (Math.abs(det) < 1e-12) return null;
  const t = (-p.x * -u.y - -p.y * -u.x) / det;
  const s = (v.x * -p.y - v.y * -p.x) / det;
  return t > 1e-9 && s >= 0 ? { t, s } : null;
}

/**
 * Dò đường tia sáng trong hệ hai gương phẳng có chung giao tuyến O.
 * G1 nằm trên nửa trục Ox, G2 hợp với G1 góc θ. Tia tới gặp G1 tại I1 (OI1 = 1) với góc tới i,
 * phản xạ về phía G2, rồi cứ thế phản xạ cho tới khi ló ra ngoài.
 */
export function computeHaiGuong(params: HaiGuongParams): HaiGuongOutputs {
  const i = Math.max(0, Math.min(89, params.i)) * DEG;
  const theta = Math.max(1, Math.min(179, params.theta)) * DEG;

  const mirrors = [
    { u: { x: 1, y: 0 }, n: { x: 0, y: 1 } },
    { u: { x: Math.cos(theta), y: Math.sin(theta) }, n: { x: Math.sin(theta), y: -Math.cos(theta) } }
  ];

  const incoming = { x: -Math.sin(i), y: -Math.cos(i) };
  let p: Point = { x: 1, y: 0 };
  const path: Point[] = [{ x: p.x - incoming.x * ENTRY_LENGTH, y: p.y - incoming.y * ENTRY_LENGTH }, p];
  const incidences: number[] = [i / DEG];

  // Phản xạ tại G1: đổi chiều thành phần pháp tuyến
  let v: Point = { x: incoming.x, y: -incoming.y };
  let last = 0;

  for (let k = 0; k < MAX_REFLECTIONS; k++) {
    let best: { t: number; index: number } | null = null;
    mirrors.forEach((m, index) => {
      if (index === last) return;
      const hit = hitMirror(p, v, m.u);
      if (hit && (!best || hit.t < best.t)) best = { t: hit.t, index };
    });
    if (!best) break;
    const { t, index } = best as { t: number; index: number };
    p = { x: p.x + v.x * t, y: p.y + v.y * t };
    path.push(p);
    const n = mirrors[index].n;
    const cos = dot(v, n);
    incidences.push(Math.acos(Math.min(1, Math.abs(cos))) / DEG);
    v = { x: v.x - 2 * cos * n.x, y: v.y - 2 * cos * n.y };
    last = index;
  }

  path.push({ x: p.x + v.x * EXIT_LENGTH, y: p.y + v.y * EXIT_LENGTH });

  const round = (x: number) => Math.round(x * 100) / 100;
  const angleBetween = Math.acos(Math.max(-1, Math.min(1, dot(incoming, v)))) / DEG;

  return {
    i1Prime: round(incidences[0]),
    i2: incidences.length > 1 ? round(incidences[1]) : NaN,
    i2Prime: incidences.length > 1 ? round(incidences[1]) : NaN,
    angleBetween: round(angleBetween),
    reflections: incidences.length,
    path
  };
}
