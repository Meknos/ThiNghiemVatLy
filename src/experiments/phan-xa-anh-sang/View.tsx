import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { PhanXaParams, computePhanXa } from './model';

const IX = 300;
const IY = 290;
const RAY = 200;
const DEG = Math.PI / 180;

const polar = (angle: number, r: number) => ({ x: IX + r * Math.cos(angle), y: IY + r * Math.sin(angle) });

/** Hình quạt đánh dấu góc giữa hai phương a1 và a2 (rad), đỉnh tại điểm tới I. */
function sector(a1: number, a2: number, r: number) {
  const p1 = polar(a1, r), p2 = polar(a2, r);
  return `M ${IX} ${IY} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${a2 > a1 ? 1 : 0} ${p2.x} ${p2.y} Z`;
}

const ArrowHead: React.FC<{ x: number; y: number; angle: number; color: string }> = ({ x, y, angle, color }) => (
  <polygon points="-9,-6 7,0 -9,6" fill={color} transform={`translate(${x} ${y}) rotate(${angle / DEG})`} />
);

export const PhanXaView: React.FC<ViewProps<PhanXaParams>> = ({ params, onParamChange }) => {
  const { i_prime, angleBetweenRays, angleWithMirror } = computePhanXa(params);
  const t = useAnimationTime();

  // Tia sáng và gương xoay mượt tới vị trí mới
  const i = useSpring(params.i, { stiffness: 170, damping: 24 });
  const mirrorAngle = useSpring(params.mirrorAngle, { stiffness: 170, damping: 24 });

  const normal = mirrorAngle * DEG - Math.PI / 2; // pháp tuyến vuông góc với mặt gương
  const incident = normal - i * DEG;              // phương từ I về nguồn S
  const reflected = normal + i * DEG;             // i' = i, ở bên kia pháp tuyến

  const S = polar(incident, RAY);
  const R = polar(reflected, RAY);
  const N = polar(normal, RAY + 18);

  const dragSource = useSvgDrag(({ x, y }) => {
    let diff = (Math.atan2(y - IY, x - IX) - (params.mirrorAngle * DEG - Math.PI / 2)) / DEG;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    onParamChange('i', Math.min(89, Math.round(Math.abs(diff))));
  });
  const dragMirror = useSvgDrag(({ x, y }) => {
    const a = Math.atan2(y - IY, x - IX) / DEG;
    onParamChange('mirrorAngle', Math.max(-45, Math.min(45, Math.round(a))));
  });

  const mirrorEnd = polar(mirrorAngle * DEG, 215);
  const labelI = polar(normal - (i / 2) * DEG, 78);
  const labelR = polar(normal + (i / 2) * DEG, 78);

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Định luật phản xạ ánh sáng</h3>
        <div className="stage-badges">
          <span className="badge-tag">Góc tới i = {vn(params.i, 0)}°</span>
          <span className="badge-tag tag-success">Góc phản xạ i′ = {vn(i_prime, 0)}°</span>
          <span className="badge-tag">Tia tới hợp với gương {vn(angleWithMirror, 0)}°</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="mirrorHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Gương phẳng và thước đo góc, cùng xoay quanh điểm tới I */}
          <g transform={`rotate(${mirrorAngle} ${IX} ${IY})`}>
            <path d={`M ${IX - 170} ${IY} A 170 170 0 0 1 ${IX + 170} ${IY}`} fill="rgba(148,163,184,0.05)" stroke="#475569" strokeWidth="1.2" />
            {Array.from({ length: 19 }, (_, k) => k * 10).map((deg) => {
              const a = -deg * DEG;
              const long = deg % 30 === 0;
              const p1 = polar(a, long ? 156 : 162), p2 = polar(a, 170);
              return <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeWidth={long ? 1.4 : 0.8} />;
            })}
            {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
              const p = polar(-deg * DEG, 144);
              return (
                <text key={deg} x={p.x} y={p.y + 3} fill="#94a3b8" fontSize="9" textAnchor="middle">
                  {Math.abs(90 - deg)}
                </text>
              );
            })}
            <rect x={IX - 215} y={IY} width="430" height="14" fill="url(#mirrorHatch)" />
            <line x1={IX - 215} y1={IY} x2={IX + 215} y2={IY} stroke="#7dd3fc" strokeWidth="4" />
            <text x={IX - 205} y={IY + 30} fill="#94a3b8" fontSize="11" fontStyle="italic">Gương phẳng</text>
          </g>

          {/* Góc tới và góc phản xạ */}
          {i > 1 && (
            <>
              <path d={sector(incident, normal, 52)} fill="rgba(239,68,68,0.22)" stroke="#ef4444" strokeWidth="1.2" />
              <path d={sector(normal, reflected, 62)} fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x={labelI.x} y={labelI.y + 4} fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="middle">i = {vn(i, 0)}°</text>
              <text x={labelR.x} y={labelR.y + 4} fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">i′ = {vn(i, 0)}°</text>
            </>
          )}

          {/* Pháp tuyến IN */}
          <line x1={IX} y1={IY} x2={N.x} y2={N.y} stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="6 4" />
          <text x={N.x} y={N.y - 6} fill="#fbbf24" fontSize="12" fontWeight="bold" textAnchor="middle">N (pháp tuyến)</text>

          {/* Tia tới SI và tia phản xạ IR */}
          <g filter="url(#laserGlow)">
            <line x1={S.x} y1={S.y} x2={IX} y2={IY} stroke="#ef4444" strokeWidth="3" />
            <line x1={IX} y1={IY} x2={R.x} y2={R.y} stroke="#38bdf8" strokeWidth="3" />
          </g>
          {/* Ánh sáng truyền đi: từ S tới gương rồi bật ra */}
          <polyline
            points={`${S.x},${S.y} ${IX},${IY} ${R.x},${R.y}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="5 34"
            strokeDashoffset={-t * 190}
            opacity="0.9"
          />
          <ArrowHead {...polar(incident, RAY * 0.55)} angle={incident + Math.PI} color="#ef4444" />
          <ArrowHead {...polar(reflected, RAY * 0.6)} angle={reflected} color="#38bdf8" />
          <text x={R.x + 8 * Math.cos(reflected)} y={R.y + 8 * Math.sin(reflected) - 6} fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">R</text>

          {/* Điểm tới */}
          <circle cx={IX} cy={IY} r="4" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
          <text x={IX + 12} y={IY + 32} fill="#f8fafc" fontSize="13" fontWeight="bold">I</text>

          {/* Đèn laze S, kéo để đổi góc tới */}
          <g transform={`translate(${S.x} ${S.y}) rotate(${incident / DEG})`}>
            <rect x="-2" y="-9" width="36" height="18" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            <circle cx="-2" cy="0" r="3.5" fill="#ef4444" />
          </g>
          <text x={S.x + 26 * Math.cos(incident)} y={S.y + 26 * Math.sin(incident) - 16} fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="middle">S</text>
          <circle cx={S.x} cy={S.y} r="24" fill="transparent" {...dragSource} />

          {/* Tay xoay gương */}
          <circle cx={mirrorEnd.x} cy={mirrorEnd.y} r="7" fill="#7dd3fc" stroke="#ffffff" strokeWidth="2" pointerEvents="none" />
          <circle cx={mirrorEnd.x} cy={mirrorEnd.y} r="20" fill="transparent" {...dragMirror} />

          <text x="16" y="24" fill="#94a3b8" fontSize="11">Góc giữa tia tới và tia phản xạ: {vn(angleBetweenRays, 0)}°</text>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Góc tới:</span>
        {[0, 30, 45, 60].map((deg) => (
          <button key={deg} className={`quick-pill ${params.i === deg ? 'active' : ''}`} onClick={() => onParamChange('i', deg)}>
            {deg}°
          </button>
        ))}
        <span>Gương nghiêng:</span>
        {[-20, 0, 20].map((deg) => (
          <button key={deg} className={`quick-pill ${params.mirrorAngle === deg ? 'active' : ''}`} onClick={() => onParamChange('mirrorAngle', deg)}>
            {deg}°
          </button>
        ))}
        <span className="stage-note">Kéo đèn S để đổi góc tới, kéo chấm ở đầu gương để xoay gương.</span>
      </div>
    </div>
  );
};
