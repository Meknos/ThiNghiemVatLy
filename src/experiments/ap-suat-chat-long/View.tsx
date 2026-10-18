import React, { useState } from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { ApSuatChatLongParams, COLUMN_HEIGHT_CM, STAND_HEIGHT_CM, computeApSuatChatLong, jetRangeCm } from './model';

// 1 cm = 1,8 px
const PX = 1.8;
const TANK_X = 50;
const TANK_W = 100;
const SURFACE_Y = 44;
const BOTTOM_Y = SURFACE_Y + COLUMN_HEIGHT_CM * PX;
const FLOOR_Y = BOTTOM_Y + STAND_HEIGHT_CM * PX;
const WALL_X = TANK_X + TANK_W;

const depthY = (h: number) => SURFACE_Y + h * PX;

/** Quỹ đạo tia nước phun ngang từ lỗ ở độ sâu h rồi rơi xuống sàn. */
function jetPath(h: number): { d: string; landX: number } {
  const range = jetRangeCm(h) * PX;
  const drop = FLOOR_Y - depthY(h);
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24; // tỉ lệ thời gian bay
    pts.push(`${(WALL_X + range * u).toFixed(1)},${(depthY(h) + drop * u * u).toFixed(1)}`);
  }
  return { d: `M ${pts.join(' L ')}`, landX: WALL_X + range };
}

function liquidLook(d: number) {
  if (d < 9000) return { name: 'Dầu', top: '#fde68a', bottom: '#b45309', jet: '#fbbf24' };
  if (d > 10150) return { name: 'Nước muối', top: '#5eead4', bottom: '#0f766e', jet: '#2dd4bf' };
  return { name: 'Nước', top: '#7dd3fc', bottom: '#0369a1', jet: '#38bdf8' };
}

export const ApSuatChatLongView: React.FC<ViewProps<ApSuatChatLongParams>> = ({ params, onParamChange }) => {
  const { h_cm, d_liquid } = params;
  const { p, jetRange } = computeApSuatChatLong(params);
  const t = useAnimationTime();
  const look = liquidLook(d_liquid);

  const h = useSpring(h_cm, { stiffness: 160, damping: 22 });
  const holeY = depthY(h);
  const jet = jetPath(h);

  const pMax = 15000 * (COLUMN_HEIGHT_CM / 100);
  const probeArrow = 8 + 30 * (p / pMax);

  const drag = useSvgDrag(({ y }) => {
    const next = Math.round((y - SURFACE_Y) / PX);
    onParamChange('h_cm', Math.max(5, Math.min(COLUMN_HEIGHT_CM, next)));
  });

  // Mặt thoáng gợn nhẹ
  const wave = Array.from({ length: 11 }, (_, i) => {
    const x = TANK_X + 3 + (i * (TANK_W - 6)) / 10;
    return `${x.toFixed(1)},${(SURFACE_Y + Math.sin(t * 2 + i * 0.9) * 1.3).toFixed(2)}`;
  }).join(' L ');

  const flowSpeed = 70 + 16 * Math.sqrt(h);

  // Ba lỗ có nút đậy trên thành bình: bấm để rút nút hoặc đậy lại
  const [openHoles, setOpenHoles] = useState<Record<number, boolean>>({});
  const toggleHole = (depth: number) => setOpenHoles((prev) => ({ ...prev, [depth]: !prev[depth] }));

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Áp suất chất lỏng tăng theo độ sâu</h3>
        <div className="stage-badges">
          <span className="badge-tag">{look.name}: d = {vn(d_liquid, 0)} N/m³</span>
          <span className="badge-tag">h = {vn(h_cm, 0)} cm</span>
          <span className="badge-tag tag-success">p = {vn(p, 0)} Pa</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="liquidColumn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={look.top} stopOpacity="0.5" />
              <stop offset="100%" stopColor={look.bottom} stopOpacity="0.95" />
            </linearGradient>
            <marker id="arrowPress" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
            </marker>
            <marker id="arrowWall" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f8fafc" />
            </marker>
          </defs>

          {/* Sàn và giá đỡ */}
          <line x1="20" y1={FLOOR_Y} x2="585" y2={FLOOR_Y} stroke="#64748b" strokeWidth="2" />
          <rect x={TANK_X - 8} y={BOTTOM_Y + 3} width={TANK_W + 16} height="8" fill="#475569" />
          <line x1={TANK_X + 6} y1={BOTTOM_Y + 11} x2={TANK_X - 4} y2={FLOOR_Y} stroke="#475569" strokeWidth="5" />
          <line x1={WALL_X - 6} y1={BOTTOM_Y + 11} x2={WALL_X + 4} y2={FLOOR_Y} stroke="#475569" strokeWidth="5" />
          <text x={TANK_X + TANK_W / 2} y={(BOTTOM_Y + FLOOR_Y) / 2 + 8} fill="#94a3b8" fontSize="10" textAnchor="middle">Giá cao 80 cm</text>

          {/* Tia nước từ các lỗ đã rút nút, để so sánh với lỗ đang xét */}
          {[20, 40, 60].filter((ref) => openHoles[ref]).map((ref) => {
            const g = jetPath(ref);
            return (
              <g key={ref}>
                <path d={g.d} fill="none" stroke={look.jet} strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
                <path
                  d={g.d}
                  fill="none"
                  stroke="#f0f9ff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="7 7"
                  strokeDashoffset={-t * (70 + 16 * Math.sqrt(ref))}
                  opacity="0.85"
                />
                <text x={g.landX} y={FLOOR_Y + 14} fill="#cbd5e1" fontSize="9" textAnchor="middle">
                  {vn(jetRangeCm(ref), 0)} cm
                </text>
              </g>
            );
          })}

          {/* Tia nước từ lỗ đang xét */}
          <path d={jet.d} fill="none" stroke={look.jet} strokeWidth="5" strokeLinecap="round" opacity="0.35" />
          <path
            d={jet.d}
            fill="none"
            stroke="#f0f9ff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="9 7"
            strokeDashoffset={-t * flowSpeed}
          />
          {[0, 0.5].map((phase) => {
            const u = (t * 1.6 + phase) % 1;
            return (
              <ellipse
                key={phase}
                cx={jet.landX}
                cy={FLOOR_Y - 1}
                rx={3 + u * 16}
                ry={1 + u * 3}
                fill="none"
                stroke={look.jet}
                strokeWidth="1.5"
                opacity={1 - u}
              />
            );
          })}
          <text x={jet.landX} y={FLOOR_Y + 30} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
            xa {vn(jetRange, 0)} cm
          </text>

          {/* Bình và cột chất lỏng */}
          <rect x={TANK_X + 3} y={SURFACE_Y} width={TANK_W - 6} height={BOTTOM_Y - SURFACE_Y} fill="url(#liquidColumn)" />
          <path d={`M ${wave}`} fill="none" stroke="#e0f2fe" strokeWidth="2" />
          <path
            d={`M ${TANK_X} ${SURFACE_Y - 22} L ${TANK_X} ${BOTTOM_Y + 3} L ${WALL_X} ${BOTTOM_Y + 3} L ${WALL_X} ${SURFACE_Y - 22}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
          />
          <text x={TANK_X + TANK_W / 2} y={SURFACE_Y - 8} fill="#bae6fd" fontSize="10" textAnchor="middle">Mặt thoáng</text>

          {/* Thước đo độ sâu */}
          {Array.from({ length: 9 }, (_, i) => i * 10).map((depth) => (
            <g key={depth}>
              <line x1={TANK_X - (depth % 20 === 0 ? 10 : 6)} y1={depthY(depth)} x2={TANK_X - 2} y2={depthY(depth)} stroke="#94a3b8" strokeWidth="1.2" />
              {depth % 20 === 0 && (
                <text x={TANK_X - 13} y={depthY(depth) + 3.5} fill="#94a3b8" fontSize="9" textAnchor="end">{depth}</text>
              )}
            </g>
          ))}
          <text x={TANK_X - 13} y={SURFACE_Y - 12} fill="#94a3b8" fontSize="9" textAnchor="end">cm</text>

          {/* Áp suất lên thành bình: càng sâu mũi tên càng dài */}
          {[10, 25, 40, 55, 70].map((depth) => {
            const len = 5 + 26 * ((d_liquid * depth) / 100 / pMax);
            return (
              <line
                key={depth}
                x1={TANK_X + 6 + len}
                y1={depthY(depth)}
                x2={TANK_X + 6}
                y2={depthY(depth)}
                stroke="#f8fafc"
                strokeWidth="1.5"
                opacity="0.75"
                markerEnd="url(#arrowWall)"
              />
            );
          })}

          {/* Ba lỗ có nút đậy: bấm vào để rút nút hoặc đậy lại */}
          {[20, 40, 60].map((ref) => (
            <g key={ref} style={{ cursor: 'pointer' }} onClick={() => toggleHole(ref)}>
              <rect x={WALL_X - 8} y={depthY(ref) - 10} width="34" height="20" fill="transparent" />
              {openHoles[ref] ? (
                <rect x={WALL_X - 2} y={depthY(ref) - 3} width="5" height="6" fill="#0b1121" />
              ) : (
                <>
                  <rect x={WALL_X - 3} y={depthY(ref) - 4} width="11" height="8" rx="2" fill="#b45309" stroke="#fcd34d" strokeWidth="1" />
                  <text x={WALL_X + 12} y={depthY(ref) + 3} fill="#fcd34d" fontSize="8.5">nút</text>
                </>
              )}
            </g>
          ))}

          {/* Lỗ phun và điểm đang xét: kéo lên xuống để đổi độ sâu */}
          <line x1={TANK_X + 3} y1={holeY} x2={WALL_X - 3} y2={holeY} stroke="#facc15" strokeWidth="1.2" strokeDasharray="4 3" />
          <rect x={WALL_X - 2} y={holeY - 3} width="5" height="6" fill="#0b1121" />
          <g transform={`translate(${TANK_X + 66}, ${holeY})`}>
            {[0, 90, 180, 270].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1={-(10 + probeArrow)}
                x2="0"
                y2="-10"
                stroke="#facc15"
                strokeWidth="2"
                markerEnd="url(#arrowPress)"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle r="16" fill="transparent" {...drag} />
            <circle r="7" fill="#facc15" stroke="#ffffff" strokeWidth="2" pointerEvents="none" />
          </g>

          {/* Áp kế */}
          <g transform="translate(456, 52)">
            <rect x="0" y="0" width="132" height="92" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="66" y="20" fill="#94a3b8" fontSize="11" textAnchor="middle">Áp kế tại điểm xét</text>
            <text x="66" y="48" fill="#facc15" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              {vn(p, 0)} Pa
            </text>
            <text x="66" y="68" fill="#cbd5e1" fontSize="10.5" textAnchor="middle">
              p = d·h = {vn(d_liquid, 0)} × {vn(h_cm / 100, 2)}
            </text>
            <text x="66" y="83" fill="#64748b" fontSize="9" textAnchor="middle">theo mọi phương như nhau</text>
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Chất lỏng:</span>
        <button className={`quick-pill ${d_liquid === 10000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10000)}>
          Nước (10 000)
        </button>
        <button className={`quick-pill ${d_liquid === 8000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 8000)}>
          Dầu (8 000)
        </button>
        <button className={`quick-pill ${d_liquid === 10300 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10300)}>
          Nước biển (10 300)
        </button>
        <span>Độ sâu:</span>
        {[20, 40, 60, 80].map((depth) => (
          <button key={depth} className={`quick-pill ${h_cm === depth ? 'active' : ''}`} onClick={() => onParamChange('h_cm', depth)}>
            {depth} cm
          </button>
        ))}
        <span className="stage-note">Kéo chấm vàng để đổi độ sâu. Bấm các nút đậy trên thành bình để mở thêm tia nước.</span>
      </div>
    </div>
  );
};
