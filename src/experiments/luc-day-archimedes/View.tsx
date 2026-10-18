import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { ArchimedesParams, computeArchimedes } from './model';

const CX = 300;
const BEAKER = { x: 200, y: 196, w: 200, bottom: 368 };
const BASE_LEVEL = 256; // mực chất lỏng khi chưa nhúng vật
const SCALE_TOP = 44;
const SCALE_LEN = 72;

function liquidLook(d: number) {
  if (d < 9000) return { name: 'Dầu', top: '#fde68a', bottom: '#b45309' };
  if (d > 10150) return { name: 'Nước muối', top: '#5eead4', bottom: '#0f766e' };
  return { name: 'Nước', top: '#7dd3fc', bottom: '#0369a1' };
}

const niceMax = (x: number) => [2, 5, 10, 20, 50].find((n) => n >= x) ?? 50;

export const ArchimedesView: React.FC<ViewProps<ArchimedesParams>> = ({ params, onParamChange }) => {
  const { V_cm3, d_liquid, m_kg } = params;
  const immersed = params.immersed ?? 100;
  const { F_A, P, P_prime, V_chim, state, stringSlack } = computeArchimedes(params);
  const t = useAnimationTime();
  const look = liquidLook(d_liquid);

  const objW = 72;
  const objH = 36 + 64 * (V_cm3 / 1500);
  const submergedFrac = V_chim / V_cm3;

  // Chất lỏng dâng lên đúng bằng thể tích phần vật chìm
  const level = useSpring(BASE_LEVEL - (V_chim / 1500) * 30, { stiffness: 70, damping: 14 });
  const deep = immersed >= 100 && !stringSlack ? 20 : 0;
  const targetBottom = immersed <= 0 ? BASE_LEVEL - 12 : BASE_LEVEL - (V_chim / 1500) * 30 + submergedFrac * objH + deep;
  const bob = stringSlack ? Math.sin(t * 2.4) * 1.6 : 0;
  const objBottom = useSpring(targetBottom, { stiffness: 60, damping: 11 }) + bob;
  const objTop = objBottom - objH;

  // Lực kế: kim chạy theo số chỉ
  const scaleMax = niceMax(P);
  const reading = useSpring(P_prime, { stiffness: 80, damping: 12 });
  const pointerY = SCALE_TOP + 10 + (SCALE_LEN - 14) * Math.min(1, reading / scaleMax);
  const hookY = SCALE_TOP + SCALE_LEN + 8;

  // Cầm vật kéo lên xuống: phần nằm dưới mực chất lỏng ban đầu là phần được nhúng
  const dragObject = useSvgDrag(({ y }) => {
    const frac = (y + objH / 2 - BASE_LEVEL) / objH;
    onParamChange('immersed', Math.max(0, Math.min(100, Math.round(frac * 20) * 5)));
  });

  const forceScale = 62 / Math.max(P, F_A, 1);
  const cy = objTop + objH / 2;

  const wave = Array.from({ length: 13 }, (_, i) => {
    const x = BEAKER.x + 3 + (i * (BEAKER.w - 6)) / 12;
    return `${x.toFixed(1)},${(level + Math.sin(t * 1.8 + i * 0.8) * 1.2).toFixed(2)}`;
  }).join(' L ');

  const stateText =
    state === 'Chìm' ? 'P > d·V: thả tay ra vật sẽ chìm' :
    state === 'Nổi' ? 'P < d·V: vật tự nổi lên' :
    'P = d·V: vật lơ lửng trong chất lỏng';

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Lực đẩy Ác-si-mét và sự nổi</h3>
        <div className="stage-badges">
          <span className={`badge-tag ${state === 'Nổi' ? 'tag-success' : ''}`}>Vật {state.toLowerCase()}</span>
          <span className="badge-tag">F_A = {vn(F_A)} N</span>
          <span className="badge-tag">Lực kế: {vn(P_prime)} N</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="archLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={look.top} stopOpacity="0.45" />
              <stop offset="100%" stopColor={look.bottom} stopOpacity="0.85" />
            </linearGradient>
            <marker id="archUp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker id="archDown" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Giá thí nghiệm */}
          <rect x="96" y="372" width="120" height="8" rx="2" fill="#475569" />
          <rect x="116" y="18" width="8" height="356" fill="#64748b" />
          <rect x="116" y="18" width={CX - 100} height="7" fill="#64748b" />
          <line x1={CX} y1="25" x2={CX} y2={SCALE_TOP} stroke="#cbd5e1" strokeWidth="2" />

          {/* Lực kế lò xo */}
          <rect x={CX - 17} y={SCALE_TOP} width="34" height={SCALE_LEN} rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          {Array.from({ length: 11 }, (_, i) => {
            const y = SCALE_TOP + 10 + ((SCALE_LEN - 14) * i) / 10;
            return (
              <g key={i}>
                <line x1={CX - 17} y1={y} x2={CX - (i % 5 === 0 ? 7 : 11)} y2={y} stroke="#334155" strokeWidth="1" />
                {i % 5 === 0 && (
                  <text x={CX + 14} y={y + 3} fill="#334155" fontSize="7.5" textAnchor="end">{vn((scaleMax * i) / 10, 1)}</text>
                )}
              </g>
            );
          })}
          <polyline
            points={Array.from({ length: 9 }, (_, i) => {
              const y = SCALE_TOP + 4 + ((pointerY - SCALE_TOP - 4) * i) / 8;
              return `${CX - 4 + (i % 2 === 0 ? -3 : 3)},${y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          <line x1={CX - 17} y1={pointerY} x2={CX + 2} y2={pointerY} stroke="#ef4444" strokeWidth="2.5" />
          <text x={CX + 26} y={SCALE_TOP + 14} fill="#94a3b8" fontSize="10">Lực kế (N)</text>
          <text x={CX + 26} y={SCALE_TOP + 34} fill="#facc15" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
            {vn(reading)} N
          </text>

          {/* Dây treo: căng khi lực kế còn kéo, chùng khi vật tự nổi */}
          {stringSlack ? (
            <path
              d={`M ${CX} ${hookY} Q ${CX + 26} ${(hookY + objTop) / 2 + 16} ${CX} ${objTop}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          ) : (
            <line x1={CX} y1={pointerY} x2={CX} y2={objTop} stroke="#cbd5e1" strokeWidth="1.5" />
          )}

          {/* Chất lỏng trong cốc */}
          <path
            d={`M ${BEAKER.x + 3} ${BEAKER.bottom - 3} L ${wave} L ${BEAKER.x + BEAKER.w - 3} ${BEAKER.bottom - 3} Z`}
            fill="url(#archLiquid)"
          />

          {/* Vật */}
          <rect x={CX - objW / 2} y={objTop} width={objW} height={objH} rx="4" fill="#f59e0b" stroke="#fde68a" strokeWidth="2" {...dragObject} />
          <text x={CX} y={cy - 3} fill="#1e293b" fontSize="11" fontWeight="bold" textAnchor="middle" pointerEvents="none">{vn(m_kg, 1)} kg</text>
          <text x={CX} y={cy + 11} fill="#1e293b" fontSize="10" textAnchor="middle" pointerEvents="none">{vn(V_cm3, 0)} cm³</text>

          {/* Lớp chất lỏng phủ lên phần vật chìm */}
          <rect
            x={CX - objW / 2 - 1}
            y={Math.max(level, objTop)}
            width={objW + 2}
            height={Math.max(0, objBottom - Math.max(level, objTop))}
            fill={look.bottom}
            opacity="0.28"
            pointerEvents="none"
          />
          <path d={`M ${wave}`} fill="none" stroke="#e0f2fe" strokeWidth="2" />

          {/* Cốc thủy tinh */}
          <path
            d={`M ${BEAKER.x} ${BEAKER.y} L ${BEAKER.x} ${BEAKER.bottom} L ${BEAKER.x + BEAKER.w} ${BEAKER.bottom} L ${BEAKER.x + BEAKER.w} ${BEAKER.y}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line x1={BEAKER.x - 22} y1={BASE_LEVEL} x2={BEAKER.x + BEAKER.w} y2={BASE_LEVEL} stroke="#fbbf24" strokeDasharray="4 3" strokeWidth="1.2" />
          <text x={BEAKER.x - 26} y={BASE_LEVEL + 3} fill="#fbbf24" fontSize="9.5" textAnchor="end">Mực ban đầu</text>
          {V_chim > 0 && (
            <text x={BEAKER.x - 26} y={level - 4} fill="#7dd3fc" fontSize="9.5" textAnchor="end">
              Dâng thêm {vn(V_chim, 0)} cm³
            </text>
          )}
          <text x={BEAKER.x + 10} y={BEAKER.bottom - 12} fill="#e0f2fe" fontSize="10.5" fontStyle="italic">
            {look.name}: d = {vn(d_liquid, 0)} N/m³
          </text>

          {/* Trọng lực P và lực đẩy F_A, vẽ cùng tỉ lệ */}
          <line x1={CX + 27} y1={cy} x2={CX + 27} y2={cy + P * forceScale} stroke="#ef4444" strokeWidth="3.5" markerEnd="url(#archDown)" pointerEvents="none" />
          <text x={CX + 27} y={cy + P * forceScale + 16} fill="#f87171" fontSize="12" fontWeight="bold" textAnchor="middle" pointerEvents="none">P = {vn(P)} N</text>
          {F_A > 0.005 && (
            <>
              <line x1={CX - 27} y1={cy} x2={CX - 27} y2={cy - F_A * forceScale} stroke="#10b981" strokeWidth="3.5" markerEnd="url(#archUp)" pointerEvents="none" />
              <text x={CX - 27} y={cy - F_A * forceScale - 8} fill="#34d399" fontSize="12" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                F_A = {vn(F_A)} N
              </text>
            </>
          )}

          {/* Phép tính */}
          <g transform="translate(424, 150)">
            <rect x="0" y="0" width="166" height="128" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="12" y="22" fill="#94a3b8" fontSize="10.5">Thể tích phần chìm</text>
            <text x="154" y="22" fill="#7dd3fc" fontSize="11" fontWeight="bold" textAnchor="end">{vn(V_chim, 0)} cm³</text>
            <text x="12" y="44" fill="#94a3b8" fontSize="10.5">F_A = d·V</text>
            <text x="154" y="44" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="end">{vn(F_A)} N</text>
            <text x="12" y="66" fill="#94a3b8" fontSize="10.5">Lực kế = P − F_A</text>
            <text x="154" y="66" fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="end">{vn(P_prime)} N</text>
            <line x1="12" y1="78" x2="154" y2="78" stroke="#334155" />
            <text x="12" y="97" fill="#f8fafc" fontSize="10.5" fontWeight="bold">{stateText}</text>
            <text x="12" y="115" fill="#94a3b8" fontSize="10">
              P = {vn(P)} N, d·V = {vn((d_liquid * V_cm3) / 1e6)} N
            </text>
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Kéo vật lên xuống, hoặc chọn:</span>
        <button className={`quick-pill ${immersed === 0 ? 'active' : ''}`} onClick={() => onParamChange('immersed', 0)}>
          Ngoài không khí
        </button>
        <button className={`quick-pill ${immersed === 50 ? 'active' : ''}`} onClick={() => onParamChange('immersed', 50)}>
          Một nửa
        </button>
        <button className={`quick-pill ${immersed === 100 ? 'active' : ''}`} onClick={() => onParamChange('immersed', 100)}>
          Chìm hoàn toàn
        </button>
        <span>Chất lỏng:</span>
        <button className={`quick-pill ${d_liquid === 10000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10000)}>
          Nước
        </button>
        <button className={`quick-pill ${d_liquid === 10300 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10300)}>
          Nước biển
        </button>
        <button className={`quick-pill ${d_liquid === 8000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 8000)}>
          Dầu
        </button>
      </div>
    </div>
  );
};
