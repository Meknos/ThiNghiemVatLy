import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { BanMatParams, computeBanMat } from './model';

const DEG = Math.PI / 180;
const IX = 220; // điểm tới I trên mặt thứ nhất
const CY = 200; // đường giữa của bản
const RAY_IN = 150;
const RAY_OUT = 150;

type P = { x: number; y: number };

/** Đánh dấu góc giữa hai hướng (rad, hệ SVG) tại đỉnh c, nhãn đặt trên đường phân giác. */
const AngleMark: React.FC<{ c: P; a1: number; a2: number; r: number; color: string; text: string; anchor?: 'start' | 'end' }> = ({ c, a1, a2, r, color, text, anchor = 'start' }) => {
  const p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  const p2 = { x: c.x + r * Math.cos(a2), y: c.y + r * Math.sin(a2) };
  const cross = Math.cos(a1) * Math.sin(a2) - Math.sin(a1) * Math.cos(a2);
  const bx = Math.cos(a1) + Math.cos(a2), by = Math.sin(a1) + Math.sin(a2);
  const len = Math.hypot(bx, by) || 1;
  return (
    <g>
      <path d={`M ${c.x} ${c.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${p2.x} ${p2.y} Z`} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
      <text x={c.x + (bx / len) * (r + 14)} y={c.y + (by / len) * (r + 14) + 5} fill={color} fontSize="13" fontWeight="bold" textAnchor={anchor}>{text}</text>
    </g>
  );
};

const ArrowHead: React.FC<{ a: P; b: P; color: string }> = ({ a, b, color }) => (
  <polygon
    points="-9,-6 7,0 -9,6"
    fill={color}
    transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) / DEG})`}
  />
);

export const BanMatView: React.FC<ViewProps<BanMatParams>> = ({ params, onParamChange }) => {
  const exact = computeBanMat(params);
  const t = useAnimationTime();

  const i = useSpring(params.i, { stiffness: 170, damping: 24 });
  const n = useSpring(params.n, { stiffness: 170, damping: 24 });
  const e = useSpring(params.e, { stiffness: 170, damping: 24 });
  const live = computeBanMat({ i, n, e });

  // Bề dày vẽ tỉ lệ với e (1–20 cm ứng với 40–200 px)
  const T = 40 + ((Math.min(20, Math.max(1, e)) - 1) * 160) / 19;
  const top = CY - T / 2;
  const bottom = CY + T / 2;
  const pxPerCm = T / Math.max(1, e);

  const u = { x: Math.sin(i * DEG), y: Math.cos(i * DEG) }; // phương tia tới
  const I = { x: IX, y: top };
  const S = { x: I.x - RAY_IN * u.x, y: I.y - RAY_IN * u.y };
  const J = { x: I.x + T * Math.tan(live.r * DEG), y: bottom };
  const R = { x: J.x + RAY_OUT * u.x, y: J.y + RAY_OUT * u.y };
  // Phương tia tới kéo dài và chân đường vuông góc hạ từ J xuống nó (đo độ dời ngang)
  const ext = { x: I.x + (T / u.y) * u.x * 1.9, y: I.y + T * 1.9 };
  const along = (J.x - I.x) * u.x + (J.y - I.y) * u.y;
  const H = { x: I.x + along * u.x, y: I.y + along * u.y };

  const dragSource = useSvgDrag(({ x, y }) => {
    if (y >= top - 4) return;
    const deg = Math.atan2(IX - x, top - y) / DEG;
    onParamChange('i', Math.max(0, Math.min(85, Math.round(deg))));
  });

  const up = -Math.PI / 2, down = Math.PI / 2;
  const dir = (a: P, b: P) => Math.atan2(b.y - a.y, b.x - a.x);

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Tia sáng qua bản mặt song song</h3>
        <div className="stage-badges">
          <span className="badge-tag">i = {vn(params.i, 0)}°, n = {vn(params.n, 2)}</span>
          <span className="badge-tag">r = {vn(exact.r, 1)}°</span>
          <span className="badge-tag tag-success">Tia ló song song tia tới (i′ = {vn(exact.iOut, 0)}°)</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="slabGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#115e59" stopOpacity="0.75" />
            </linearGradient>
            <filter id="slabGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Bản trong suốt */}
          <rect x="30" y={top} width="540" height={T} fill="url(#slabGrad)" />
          <line x1="30" y1={top} x2="570" y2={top} stroke="#7dd3fc" strokeWidth="2.5" />
          <line x1="30" y1={bottom} x2="570" y2={bottom} stroke="#7dd3fc" strokeWidth="2.5" />
          <text x="40" y={top - 10} fill="#cbd5e1" fontSize="12" fontWeight="bold">Không khí (n = 1)</text>
          <text x="40" y={CY + 5} fill="#f0fdfa" fontSize="12" fontWeight="bold">Bản trong suốt n = {vn(params.n, 2)}</text>
          <text x="40" y={bottom + 20} fill="#cbd5e1" fontSize="12" fontWeight="bold">Không khí</text>

          {/* Bề dày e */}
          <line x1="548" y1={top} x2="548" y2={bottom} stroke="#e2e8f0" strokeWidth="1.2" />
          <line x1="542" y1={top} x2="554" y2={top} stroke="#e2e8f0" strokeWidth="1.2" />
          <line x1="542" y1={bottom} x2="554" y2={bottom} stroke="#e2e8f0" strokeWidth="1.2" />
          <text x="540" y={CY + 5} fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="end">e = {vn(params.e, 1)} cm</text>

          {/* Pháp tuyến tại I và J */}
          <line x1={I.x} y1={top - 110} x2={I.x} y2={top + T * 0.9} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1={J.x} y1={bottom - T * 0.9} x2={J.x} y2={bottom + 110} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* Góc tại hai mặt */}
          {i > 2 && (
            <>
              <AngleMark c={I} a1={dir(I, S)} a2={up} r={42} color="#f87171" text={`i = ${vn(params.i, 0)}°`} anchor="end" />
              <AngleMark c={I} a1={down} a2={dir(I, J)} r={Math.min(46, T * 0.7)} color="#34d399" text={`r = ${vn(exact.r, 1)}°`} />
              <AngleMark c={J} a1={up} a2={dir(J, I)} r={Math.min(40, T * 0.6)} color="#34d399" text={`r`} anchor="end" />
              <AngleMark c={J} a1={down} a2={dir(J, R)} r={42} color="#f87171" text={`i′ = ${vn(exact.iOut, 0)}°`} />
            </>
          )}

          {/* Phương tia tới kéo dài và độ dời ngang */}
          {i > 3 && (
            <>
              <line x1={I.x} y1={I.y} x2={ext.x} y2={ext.y} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
              <line x1={J.x} y1={J.y} x2={H.x} y2={H.y} stroke="#e879f9" strokeWidth="2" />
              <text x={(J.x + H.x) / 2 + 8} y={(J.y + H.y) / 2 + 14} fill="#e879f9" fontSize="12" fontWeight="bold">
                d = {vn(exact.shift, 2)} cm
              </text>
            </>
          )}

          {/* Tia sáng */}
          <g filter="url(#slabGlow)">
            <line x1={S.x} y1={S.y} x2={I.x} y2={I.y} stroke="#ef4444" strokeWidth="3.2" />
            <line x1={I.x} y1={I.y} x2={J.x} y2={J.y} stroke="#34d399" strokeWidth="3.2" />
            <line x1={J.x} y1={J.y} x2={R.x} y2={R.y} stroke="#ef4444" strokeWidth="3.2" />
          </g>
          <polyline
            points={`${S.x},${S.y} ${I.x},${I.y} ${J.x},${J.y} ${R.x},${R.y}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="5 32"
            strokeDashoffset={-t * 170}
            opacity="0.9"
          />
          <ArrowHead a={S} b={I} color="#ef4444" />
          <ArrowHead a={I} b={J} color="#34d399" />
          <ArrowHead a={J} b={R} color="#ef4444" />

          <circle cx={I.x} cy={I.y} r="4" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
          <text x={I.x + 8} y={I.y - 8} fill="#ffffff" fontSize="13" fontWeight="bold">I</text>
          <circle cx={J.x} cy={J.y} r="4" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
          <text x={J.x - 16} y={J.y + 18} fill="#ffffff" fontSize="13" fontWeight="bold">J</text>

          {/* Đèn S, kéo để đổi góc tới */}
          <g transform={`translate(${S.x} ${S.y}) rotate(${dir(I, S) / DEG})`}>
            <rect x="-2" y="-9" width="34" height="18" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            <circle cx="-2" cy="0" r="3.5" fill="#ef4444" />
          </g>
          <text x={S.x} y={S.y - 16} fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="middle">S</text>
          <circle cx={S.x} cy={S.y} r="24" fill="transparent" {...dragSource} />

          <text x="16" y="24" fill="#94a3b8" fontSize="11">1 cm ≈ {vn(pxPerCm, 0)} điểm ảnh trên hình</text>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Góc tới:</span>
        {[30, 45, 60].map((deg) => (
          <button key={deg} className={`quick-pill ${params.i === deg ? 'active' : ''}`} onClick={() => onParamChange('i', deg)}>
            {deg}°
          </button>
        ))}
        <span>Chiết suất:</span>
        {[
          { label: 'Thủy tinh 1,5', n: 1.5 },
          { label: '√3 ≈ 1,73', n: 1.73 },
          { label: 'Kim cương 2,42', n: 2.42 }
        ].map((m) => (
          <button key={m.label} className={`quick-pill ${Math.abs(params.n - m.n) < 0.005 ? 'active' : ''}`} onClick={() => onParamChange('n', m.n)}>
            {m.label}
          </button>
        ))}
        <span className="stage-note">Kéo đèn S để đổi góc tới. Tia ló luôn song song với tia tới, chỉ bị dời ngang một đoạn d.</span>
      </div>
    </div>
  );
};
