import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { KhucXaParams, MEDIA, computeKhucXa, mediumName } from './model';

const IX = 300;
const IY = 200;
const RAY = 172;
const DEG = Math.PI / 180;

// Màu môi trường theo chiết suất: lấy màu của mốc gần nhất
const LOOKS = [
  { n: 1.33, top: '#0ea5e9', bottom: '#075985' },
  { n: 1.5, top: '#2dd4bf', bottom: '#115e59' },
  { n: 1.8, top: '#a5b4fc', bottom: '#3730a3' },
  { n: 2.42, top: '#c4b5fd', bottom: '#5b21b6' }
];
const lookFor = (n: number) => LOOKS.reduce((best, l) => (Math.abs(l.n - n) < Math.abs(best.n - n) ? l : best));

/** Hình quạt đánh dấu góc giữa hai phương (rad) tại điểm tới, đi theo cung ngắn hơn. */
function sector(a1: number, a2: number, r: number) {
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const p = (a: number) => `${IX + r * Math.cos(a)} ${IY + r * Math.sin(a)}`;
  return `M ${IX} ${IY} L ${p(a1)} A ${r} ${r} 0 0 ${diff > 0 ? 1 : 0} ${p(a2)} Z`;
}

const ArrowHead: React.FC<{ x: number; y: number; angle: number; color: string; opacity?: number }> = ({ x, y, angle, color, opacity = 1 }) => (
  <polygon points="-9,-6 7,0 -9,6" fill={color} opacity={opacity} transform={`translate(${x} ${y}) rotate(${angle / DEG})`} />
);

export const KhucXaView: React.FC<ViewProps<KhucXaParams>> = ({ params, onParamChange }) => {
  const direction = params.direction === 2 ? 2 : 1;
  const res = computeKhucXa(params);
  const t = useAnimationTime();
  const look = { ...lookFor(res.n), name: mediumName(res.n) };

  const i = useSpring(params.i, { stiffness: 170, damping: 24 });
  const live = computeKhucXa({ ...params, i }); // tính lại theo góc đang chuyển động để tia khúc xạ đi theo mượt
  const tir = live.totalReflection;

  // side = -1: nguồn sáng ở trên (không khí); +1: nguồn sáng ở dưới (trong môi trường)
  const side = direction === 1 ? -1 : 1;
  const iRad = i * DEG;
  const rRad = (tir ? 90 : live.r) * DEG;

  const src = { x: IX - RAY * Math.sin(iRad), y: IY + side * RAY * Math.cos(iRad) };
  const refl = { x: IX + RAY * Math.sin(iRad), y: IY + side * RAY * Math.cos(iRad) };
  const refr = { x: IX + RAY * Math.sin(rRad), y: IY - side * RAY * Math.cos(rRad) };
  const straight = { x: IX + RAY * Math.sin(iRad), y: IY - side * RAY * Math.cos(iRad) };

  const angleTo = (p: { x: number; y: number }) => Math.atan2(p.y - IY, p.x - IX);
  const normalSrc = side * (Math.PI / 2);
  const normalFar = -side * (Math.PI / 2);

  const dragSource = useSvgDrag(({ x, y }) => {
    const along = side * (y - IY);
    if (along <= 4) return; // nguồn sáng không vượt qua mặt phân cách
    const next = Math.round(Math.atan2(IX - x, along) / DEG);
    onParamChange('i', Math.max(0, Math.min(85, next)));
  });

  const refrOpacity = 0.3 + 0.7 * (1 - live.reflectance);
  const reflOpacity = Math.min(1, 0.14 + live.reflectance);
  const speed = (n: number) => 210 / n; // ánh sáng đi chậm hơn trong môi trường chiết suất lớn

  const mid = (p: { x: number; y: number }, f: number) => ({ x: IX + (p.x - IX) * f, y: IY + (p.y - IY) * f });

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Khúc xạ ánh sáng tại mặt phân cách</h3>
        <div className="stage-badges">
          <span className="badge-tag">i = {vn(params.i, 0)}°</span>
          {res.totalReflection ? (
            <span className="badge-tag tag-warning">Phản xạ toàn phần</span>
          ) : (
            <span className="badge-tag tag-success">r = {vn(res.r, 1)}° ({res.r < params.i ? 'r < i' : res.r > params.i ? 'r > i' : 'r = i'})</span>
          )}
          {direction === 2 && <span className="badge-tag">i_gh = {vn(res.criticalAngle, 1)}°</span>}
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="mediumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={look.top} stopOpacity="0.4" />
              <stop offset="100%" stopColor={look.bottom} stopOpacity="0.8" />
            </linearGradient>
            <filter id="rayGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hai môi trường */}
          <rect x="40" y={IY} width="520" height="185" fill="url(#mediumGrad)" />
          <line x1="40" y1={IY} x2="560" y2={IY} stroke="#7dd3fc" strokeWidth="2.5" />
          <text x="52" y={IY - 150} fill="#cbd5e1" fontSize="12" fontWeight="bold">Không khí (n = 1)</text>
          <text x="52" y={IY - 134} fill="#94a3b8" fontSize="10">ánh sáng truyền nhanh nhất</text>
          <text x="52" y={IY + 160} fill="#f0f9ff" fontSize="12" fontWeight="bold">{look.name} (n = {vn(res.n)})</text>
          <text x="52" y={IY + 175} fill="#e0f2fe" fontSize="10">ánh sáng truyền chậm hơn {vn(res.n)} lần</text>
          <text x="548" y={IY - 6} fill="#7dd3fc" fontSize="10" fontStyle="italic" textAnchor="end">Mặt phân cách</text>

          {/* Pháp tuyến */}
          <line x1={IX} y1="18" x2={IX} y2="382" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="6 4" />
          <text x={IX + 8} y="28" fill="#fbbf24" fontSize="12" fontWeight="bold">N</text>
          <text x={IX + 8} y="380" fill="#fbbf24" fontSize="12" fontWeight="bold">N′</text>

          {/* Góc tới, góc khúc xạ */}
          {i > 1 && (
            <>
              <path d={sector(angleTo(src), normalSrc, 50)} fill="rgba(239,68,68,0.22)" stroke="#ef4444" strokeWidth="1.2" />
              <text {...mid(src, 0.42)} dx={-6} fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="end">i = {vn(i, 0)}°</text>
            </>
          )}
          {!tir && live.r > 1 && (
            <>
              <path d={sector(normalFar, angleTo(refr), 58)} fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="1.2" />
              <text {...mid(refr, 0.5)} dx={10} fill="#34d399" fontSize="13" fontWeight="bold">r = {vn(live.r, 1)}°</text>
            </>
          )}

          {/* Phương tia tới kéo dài, để thấy tia sáng bị gãy khúc */}
          {i > 3 && !tir && (
            <line x1={IX} y1={IY} x2={straight.x} y2={straight.y} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
          )}

          {/* Tia tới */}
          <line x1={src.x} y1={src.y} x2={IX} y2={IY} stroke="#ef4444" strokeWidth="3.2" filter="url(#rayGlow)" />
          <line
            x1={src.x} y1={src.y} x2={IX} y2={IY}
            stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"
            strokeDasharray="5 30" strokeDashoffset={-t * speed(live.n1)}
          />
          <ArrowHead {...mid(src, 0.5)} angle={angleTo(src) + Math.PI} color="#ef4444" />

          {/* Tia phản xạ: mờ khi chiếu gần vuông góc, sáng hẳn khi phản xạ toàn phần */}
          <line x1={IX} y1={IY} x2={refl.x} y2={refl.y} stroke="#f472b6" strokeWidth={tir ? 3.2 : 2} opacity={reflOpacity} filter={tir ? 'url(#rayGlow)' : undefined} />
          <line
            x1={IX} y1={IY} x2={refl.x} y2={refl.y}
            stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity={reflOpacity}
            strokeDasharray="5 30" strokeDashoffset={-t * speed(live.n1)}
          />
          <ArrowHead {...mid(refl, 0.6)} angle={angleTo(refl)} color="#f472b6" opacity={reflOpacity} />
          <text x={refl.x} y={refl.y + (side < 0 ? -8 : 16)} fill="#f472b6" fontSize="11" textAnchor="middle" opacity={Math.max(0.6, reflOpacity)}>
            {tir ? 'Phản xạ toàn phần' : 'Tia phản xạ'}
          </text>

          {/* Tia khúc xạ */}
          {!tir && (
            <>
              <line x1={IX} y1={IY} x2={refr.x} y2={refr.y} stroke="#34d399" strokeWidth="3.2" opacity={refrOpacity} filter="url(#rayGlow)" />
              <line
                x1={IX} y1={IY} x2={refr.x} y2={refr.y}
                stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity={refrOpacity}
                strokeDasharray="5 30" strokeDashoffset={-t * speed(live.n2)}
              />
              <ArrowHead {...mid(refr, 0.62)} angle={angleTo(refr)} color="#34d399" opacity={refrOpacity} />
              <text x={refr.x} y={refr.y + (side < 0 ? 16 : -8)} fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">Tia khúc xạ</text>
            </>
          )}

          <circle cx={IX} cy={IY} r="4" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
          <text x={IX - 14} y={IY - 8} fill="#ffffff" fontSize="13" fontWeight="bold">I</text>

          {/* Đèn laze S */}
          <g transform={`translate(${src.x} ${src.y}) rotate(${angleTo(src) / DEG})`}>
            <rect x="-2" y="-9" width="34" height="18" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            <circle cx="-2" cy="0" r="3.5" fill="#ef4444" />
          </g>
          <circle cx={src.x} cy={src.y} r="24" fill="transparent" {...dragSource} />
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Chiều truyền:</span>
        <button className={`quick-pill ${direction === 1 ? 'active' : ''}`} onClick={() => onParamChange('direction', 1)}>
          Không khí → {look.name.toLowerCase()}
        </button>
        <button className={`quick-pill ${direction === 2 ? 'active' : ''}`} onClick={() => onParamChange('direction', 2)}>
          {look.name} → không khí
        </button>
        <span>Môi trường:</span>
        {MEDIA.map((m) => (
          <button key={m.name} className={`quick-pill ${Math.abs(params.n - m.n) < 0.005 ? 'active' : ''}`} onClick={() => onParamChange('n', m.n)}>
            {m.name}
          </button>
        ))}
        <span className="stage-note">Kéo đèn laze để đổi góc tới.</span>
      </div>
    </div>
  );
};
