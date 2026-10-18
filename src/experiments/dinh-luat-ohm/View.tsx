import React, { useEffect, useRef, useState } from 'react';
import { ViewProps } from '../../core/types';
import { dotsAlong, useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { OhmParams, ammeterRange, computeOhm, voltmeterRange } from './model';

type Pt = [number, number];

const LOOP = { left: 70, right: 530, top: 112, bottom: 204 };
const PLUS_Y = 148;
const MINUS_Y = 168;
const AM = { x: 190, y: LOOP.top };
const RES = { x1: 330, x2: 430 };
const VM = { x: 380, y: 44 };
const GRAPH = { x: 62, y: 374, w: 210, h: 118 };

const LOOP_PATH: Pt[] = [
  [LOOP.left, PLUS_Y], [LOOP.left, LOOP.top], [LOOP.right, LOOP.top],
  [LOOP.right, LOOP.bottom], [LOOP.left, LOOP.bottom], [LOOP.left, MINUS_Y]
];

/** Mặt đồng hồ kim: kim lệch từ -55° đến +55° theo giá trị đo. */
const Dial: React.FC<{ x: number; y: number; r: number; value: number; max: number; unit: string; color: string }> = ({
  x, y, r, value, max, unit, color
}) => {
  const pivotY = r * 0.42;
  const len = r * 1.05;
  const angle = -55 + 110 * Math.max(0, Math.min(1, value / max));
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#f8fafc" stroke={color} strokeWidth="3" />
      {Array.from({ length: 11 }, (_, k) => {
        const a = ((-55 + 11 * k - 90) * Math.PI) / 180;
        const r1 = len - (k % 5 === 0 ? 7 : 4);
        return (
          <line
            key={k}
            x1={r1 * Math.cos(a)} y1={pivotY + r1 * Math.sin(a)}
            x2={len * Math.cos(a)} y2={pivotY + len * Math.sin(a)}
            stroke="#334155" strokeWidth={k % 5 === 0 ? 1.4 : 0.8}
          />
        );
      })}
      {[0, 0.5, 1].map((f) => {
        const a = ((-55 + 110 * f - 90) * Math.PI) / 180;
        return (
          <text key={f} x={(len - 13) * Math.cos(a)} y={pivotY + (len - 13) * Math.sin(a) + 3} fill="#334155" fontSize={r * 0.24} textAnchor="middle">
            {vn(max * f, 1)}
          </text>
        );
      })}
      <line x1="0" y1={pivotY} x2="0" y2={pivotY - len + 3} stroke="#dc2626" strokeWidth="2" transform={`rotate(${angle} 0 ${pivotY})`} />
      <circle cy={pivotY} r="3" fill="#1e293b" />
      <text y={r - 4} fill={color} fontSize={r * 0.36} fontWeight="bold" textAnchor="middle">{unit}</text>
    </g>
  );
};

export const OhmView: React.FC<ViewProps<OhmParams>> = ({ params, onParamChange }) => {
  const { U, R } = params;
  const { I, P_power } = computeOhm(params);
  const t = useAnimationTime();

  const range = ammeterRange(I);
  const U_MAX = voltmeterRange(U); // thang vôn kế, cũng là độ dài trục U của đồ thị
  const needleI = useSpring(I, { stiffness: 90, damping: 13 });
  const needleU = useSpring(U, { stiffness: 90, damping: 13 });

  // Bảng số liệu: mỗi lần đổi U là một lần đo; đổi điện trở thì đo lại từ đầu
  const [points, setPoints] = useState<{ U: number; I: number }[]>([]);
  const lastR = useRef(R);
  useEffect(() => {
    setPoints((prev) => {
      const base = lastR.current === R ? prev.filter((p) => p.U !== U) : [];
      lastR.current = R;
      return [...base, { U, I: U / R }].slice(-6);
    });
  }, [U, R]);

  const gx = (u: number) => GRAPH.x + (u / U_MAX) * GRAPH.w;
  const gy = (i: number) => GRAPH.y - Math.min(1, i / range) * GRAPH.h;
  const lineEndU = Math.min(U_MAX, range * R);
  const heat = Math.min(1, P_power / 60);

  // Kéo điểm đo dọc theo trục U trên đồ thị để đổi hiệu điện thế
  const dragPoint = useSvgDrag(({ x }) => {
    const u = ((x - GRAPH.x) / GRAPH.w) * U_MAX;
    onParamChange('U', Math.max(1, Math.min(U_MAX, Math.round(u * 2) / 2)));
  });

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Định luật Ôm: I tỉ lệ thuận với U, tỉ lệ nghịch với R</h3>
        <div className="stage-badges">
          <span className="badge-tag">U = {vn(U, 1)} V</span>
          <span className="badge-tag">R = {vn(R, 0)} Ω</span>
          <span className="badge-tag tag-success">I = {vn(I)} A</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <radialGradient id="resHeat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* MẠCH CHÍNH: nguồn — ampe kế — điện trở, mắc nối tiếp */}
          <polyline
            points={LOOP_PATH.map((p) => p.join(',')).join(' ')}
            fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinejoin="round"
          />
          {dotsAlong(LOOP_PATH, t * Math.min(260, 24 + 70 * I), 26).map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r="3.2" fill="#fde047" />
          ))}
          <polygon points={`270,${LOOP.top - 7} 284,${LOOP.top} 270,${LOOP.top + 7}`} fill="#fde047" />

          {/* Vôn kế mắc song song với điện trở */}
          <polyline points={`305,${LOOP.top} 305,${VM.y} ${VM.x - 26},${VM.y}`} fill="none" stroke="#fbbf24" strokeWidth="2" />
          <polyline points={`455,${LOOP.top} 455,${VM.y} ${VM.x + 26},${VM.y}`} fill="none" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="305" cy={LOOP.top} r="4" fill="#fbbf24" />
          <circle cx="455" cy={LOOP.top} r="4" fill="#fbbf24" />
          <Dial x={VM.x} y={VM.y} r={26} value={needleU} max={U_MAX} unit="V" color="#f59e0b" />
          <text x={VM.x + 86} y={VM.y - 4} fill="#fbbf24" fontSize="11">Vôn kế</text>
          <text x={VM.x + 86} y={VM.y + 12} fill="#fbbf24" fontSize="13" fontWeight="bold">{vn(U, 1)} V</text>

          {/* Ampe kế mắc nối tiếp */}
          <Dial x={AM.x} y={AM.y} r={30} value={needleI} max={range} unit="A" color="#0ea5e9" />
          <text x={AM.x} y={AM.y - 40} fill="#7dd3fc" fontSize="11" textAnchor="middle">Ampe kế, thang {vn(range, 1)} A</text>
          <text x={AM.x} y={AM.y + 48} fill="#7dd3fc" fontSize="13" fontWeight="bold" textAnchor="middle">{vn(I)} A</text>

          {/* Điện trở: nóng lên khi công suất lớn */}
          {heat > 0.05 && <ellipse cx={(RES.x1 + RES.x2) / 2} cy={LOOP.top} rx={62 + 4 * Math.sin(t * 5)} ry="34" fill="url(#resHeat)" opacity={heat} />}
          <rect x={RES.x1} y={LOOP.top - 17} width={RES.x2 - RES.x1} height="34" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
          <text x={(RES.x1 + RES.x2) / 2} y={LOOP.top + 5} fill="#facc15" fontSize="13" fontWeight="bold" textAnchor="middle">R = {vn(R, 0)} Ω</text>
          <text x={(RES.x1 + RES.x2) / 2} y={LOOP.top + 34} fill="#fdba74" fontSize="10" textAnchor="middle">tỏa nhiệt {vn(P_power, 1)} W</text>

          {/* Nguồn điện */}
          <line x1={LOOP.left - 22} y1={PLUS_Y} x2={LOOP.left + 22} y2={PLUS_Y} stroke="#ef4444" strokeWidth="3" />
          <line x1={LOOP.left - 12} y1={MINUS_Y} x2={LOOP.left + 12} y2={MINUS_Y} stroke="#38bdf8" strokeWidth="7" />
          <text x={LOOP.left - 32} y={PLUS_Y + 5} fill="#ef4444" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>
          <text x={LOOP.left - 32} y={MINUS_Y + 6} fill="#38bdf8" fontSize="16" fontWeight="bold" textAnchor="middle">−</text>
          <text x={LOOP.left + 30} y="162" fill="#f8fafc" fontSize="11">Nguồn {vn(U, 1)} V</text>

          {/* ĐỒ THỊ I THEO U */}
          <text x={GRAPH.x + 34} y={GRAPH.y - GRAPH.h - 12} fill="#cbd5e1" fontSize="11" fontWeight="bold">Đồ thị I theo U (R = {vn(R, 0)} Ω)</text>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={GRAPH.x} y1={GRAPH.y - f * GRAPH.h} x2={GRAPH.x + GRAPH.w} y2={GRAPH.y - f * GRAPH.h} stroke="#1e293b" />
              <text x={GRAPH.x - 5} y={GRAPH.y - f * GRAPH.h + 3} fill="#94a3b8" fontSize="9" textAnchor="end">{vn(range * f, 1)}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => f * U_MAX).map((u) => (
            <text key={u} x={gx(u)} y={GRAPH.y + 12} fill="#94a3b8" fontSize="9" textAnchor="middle">{u}</text>
          ))}
          <line x1={GRAPH.x} y1={GRAPH.y} x2={GRAPH.x + GRAPH.w + 8} y2={GRAPH.y} stroke="#94a3b8" strokeWidth="1.3" />
          <line x1={GRAPH.x} y1={GRAPH.y} x2={GRAPH.x} y2={GRAPH.y - GRAPH.h - 8} stroke="#94a3b8" strokeWidth="1.3" />
          <text x={GRAPH.x + GRAPH.w + 12} y={GRAPH.y + 4} fill="#94a3b8" fontSize="10">U (V)</text>
          <text x={GRAPH.x - 4} y={GRAPH.y - GRAPH.h - 12} fill="#94a3b8" fontSize="10" textAnchor="end">I (A)</text>
          <line x1={gx(0)} y1={gy(0)} x2={gx(lineEndU)} y2={gy(lineEndU / R)} stroke="#34d399" strokeWidth="2" />
          {points.map((pt) => (
            <circle key={pt.U} cx={gx(pt.U)} cy={gy(pt.I)} r="3" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
          ))}
          <line x1={gx(U)} y1={GRAPH.y} x2={gx(U)} y2={gy(I)} stroke="#facc15" strokeDasharray="3 3" strokeWidth="1" />
          <line x1={GRAPH.x} y1={gy(I)} x2={gx(U)} y2={gy(I)} stroke="#facc15" strokeDasharray="3 3" strokeWidth="1" />
          <circle cx={gx(U)} cy={gy(I)} r={5 + Math.sin(t * 4)} fill="#facc15" stroke="#ffffff" strokeWidth="1.5" pointerEvents="none" />
          <rect x={GRAPH.x} y={GRAPH.y - GRAPH.h} width={GRAPH.w} height={GRAPH.h + 16} fill="transparent" {...dragPoint} style={{ cursor: 'ew-resize', touchAction: 'none' }} />

          {/* BẢNG SỐ LIỆU */}
          <g transform="translate(330, 238)">
            <rect x="0" y="0" width="248" height="148" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="42" y="20" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">U (V)</text>
            <text x="124" y="20" fill="#7dd3fc" fontSize="11" fontWeight="bold" textAnchor="middle">I (A)</text>
            <text x="206" y="20" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">U / I (Ω)</text>
            <line x1="10" y1="27" x2="238" y2="27" stroke="#334155" />
            {points.map((pt, k) => (
              <g key={pt.U} opacity={pt.U === U ? 1 : 0.7}>
                <text x="42" y={44 + k * 18} fill="#f8fafc" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{vn(pt.U, 1)}</text>
                <text x="124" y={44 + k * 18} fill="#f8fafc" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{vn(pt.I)}</text>
                <text x="206" y={44 + k * 18} fill="#f8fafc" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{vn(pt.U / pt.I, 1)}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Hiệu điện thế:</span>
        {[3, 6, 9, 12].map((u) => (
          <button key={u} className={`quick-pill ${U === u ? 'active' : ''}`} onClick={() => onParamChange('U', u)}>{u} V</button>
        ))}
        <span>Điện trở:</span>
        {[5, 10, 20].map((r) => (
          <button key={r} className={`quick-pill ${R === r ? 'active' : ''}`} onClick={() => onParamChange('R', r)}>{r} Ω</button>
        ))}
        <span className="stage-note">Kéo trên đồ thị để đổi U: các điểm đo nằm trên một đường thẳng qua gốc tọa độ.</span>
      </div>
    </div>
  );
};
