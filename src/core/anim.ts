import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Thời gian chạy liên tục (giây), tăng dần theo từng khung hình. Dùng cho chuyển động lặp. */
export function useAnimationTime(running = true): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running || prefersReducedMotion()) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Máy chậm vẫn chạy đúng tốc độ; chỉ chặn bước nhảy lớn khi tab bị tạm ngưng
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      setT((prev) => prev + dt);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  return t;
}

/** Giá trị bám theo `target` như một lò xo tắt dần, để vật và kim đo chuyển động mượt. */
export function useSpring(
  target: number,
  opts: { stiffness?: number; damping?: number; jump?: { key: number; value: number } } = {}
): number {
  const { stiffness = 120, damping = 20, jump } = opts;
  const [value, setValue] = useState(target);
  const state = useRef({ x: target, v: 0, target });
  state.current.target = target;

  // `jump`: đặt ngay giá trị hiện tại (ví dụ sau khi người dùng thả vật ở một vị trí khác)
  const jumpKey = jump?.key;
  useEffect(() => {
    if (jump === undefined) return;
    state.current.x = jump.value;
    state.current.v = 0;
    setValue(jump.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpKey]);

  useEffect(() => {
    const st = state.current;
    if (prefersReducedMotion()) {
      st.x = target;
      st.v = 0;
      setValue(target);
      return;
    }
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Tích phân theo thời gian thật, chia thành các bước nhỏ để ổn định cả khi khung hình thưa
      const elapsed = Math.min(0.25, (now - last) / 1000);
      last = now;
      const steps = Math.max(1, Math.ceil(elapsed / 0.008));
      const dt = elapsed / steps;
      for (let i = 0; i < steps; i++) {
        st.v += (stiffness * (st.target - st.x) - damping * st.v) * dt;
        st.x += st.v * dt;
      }
      const tol = 1e-3 * (1 + Math.abs(st.target));
      if (Math.abs(st.target - st.x) < tol && Math.abs(st.v) < tol * 10) {
        st.x = st.target;
        st.v = 0;
        setValue(st.x);
        return;
      }
      setValue(st.x);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, stiffness, damping, jumpKey]);

  return value;
}

/** Đổi tọa độ con trỏ sang tọa độ viewBox của SVG (đúng cả khi SVG bị co giãn, canh giữa). */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/** Kéo một phần tử SVG bằng chuột hoặc cảm ứng; `onDrag` nhận tọa độ viewBox, `onEnd` gọi khi thả tay. */
export function useSvgDrag(
  onDrag: (p: { x: number; y: number }) => void,
  onEnd?: (p: { x: number; y: number }) => void
) {
  const cb = useRef(onDrag);
  cb.current = onDrag;
  const endCb = useRef(onEnd);
  endCb.current = onEnd;
  const end = (e: React.PointerEvent<SVGElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (svg && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      endCb.current?.(svgPoint(svg, e.clientX, e.clientY));
    }
  };
  const move = (e: React.PointerEvent<SVGElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (svg) cb.current(svgPoint(svg, e.clientX, e.clientY));
  };
  return {
    style: { cursor: 'grab', touchAction: 'none' as const },
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      move(e);
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
    },
    onPointerUp: end,
    onPointerCancel: end
  };
}

/** Số theo cách viết của Việt Nam: dấu phẩy thập phân, bỏ số 0 thừa. */
export function vn(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '—';
  return String(Number(x.toFixed(digits))).replace('.', ',');
}

/** Các hạt chạy dọc một đường gấp khúc, cách đều `gap`, dịch dần theo `offset` (px). */
export function dotsAlong(points: [number, number][], offset: number, gap: number): [number, number][] {
  const segs: { x: number; y: number; dx: number; dy: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const dx = points[i + 1][0] - x;
    const dy = points[i + 1][1] - y;
    const len = Math.hypot(dx, dy);
    segs.push({ x, y, dx, dy, len });
    total += len;
  }
  const out: [number, number][] = [];
  for (let s = ((offset % gap) + gap) % gap; s < total; s += gap) {
    let rest = s;
    for (const seg of segs) {
      if (rest <= seg.len) {
        out.push([seg.x + (seg.dx * rest) / seg.len, seg.y + (seg.dy * rest) / seg.len]);
        break;
      }
      rest -= seg.len;
    }
  }
  return out;
}
