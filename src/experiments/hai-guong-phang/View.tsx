import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { HaiGuongParams, Point, computeHaiGuong } from './model';

// Giao tuyến O của hai gương và tỉ lệ vẽ (OI1 = 1 đơn vị = SCALE px)
const OX = 110;
const OY = 345;
const SCALE = 150;
const MIRROR_LEN = 2.25;
const DEG = Math.PI / 180;

const toSvg = (p: Point) => ({ x: OX + p.x * SCALE, y: OY - p.y * SCALE });
const toModel = (x: number, y: number): Point => ({ x: (x - OX) / SCALE, y: (OY - y) / SCALE });

// Màu từng đoạn tia: tia tới, sau lần phản xạ 1, 2, 3...
const RAY_COLORS = ['#ef4444', '#38bdf8', '#34d399', '#fbbf24', '#c084fc'];

const ArrowHead: React.FC<{ from: Point; to: Point; color: string }> = ({ from, to, color }) => {
  const a = toSvg(from), b = toSvg(to);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const angle = Math.atan2(b.y - a.y, b.x - a.x) / DEG;
  return <polygon points="-9,-6 7,0 -9,6" fill={color} transform={`translate(${mid.x} ${mid.y}) rotate(${angle})`} />;
};

/** Đánh dấu góc giữa hai hướng (rad, hệ tọa độ SVG) tại đỉnh c: cung tròn và nhãn nằm trên đường phân giác. */
const AngleMark: React.FC<{ c: { x: number; y: number }; a1: number; a2: number; r: number; color: string; text: string }> = ({ c, a1, a2, r, color, text }) => {
  const p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  const p2 = { x: c.x + r * Math.cos(a2), y: c.y + r * Math.sin(a2) };
  const cross = Math.cos(a1) * Math.sin(a2) - Math.sin(a1) * Math.cos(a2);
  const bx = Math.cos(a1) + Math.cos(a2);
  const by = Math.sin(a1) + Math.sin(a2);
  const len = Math.hypot(bx, by) || 1;
  const lr = r + 26;
  return (
    <g>
      <path d={`M ${c.x} ${c.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${p2.x} ${p2.y} Z`} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
      <text
        x={c.x + (bx / len) * lr}
        y={c.y + (by / len) * lr + 5}
        fill={color}
        fontSize="13"
        fontWeight="bold"
        textAnchor={Math.abs(bx / len) < 0.25 ? 'middle' : bx > 0 ? 'start' : 'end'}
      >
        {text}
      </text>
    </g>
  );
};

const dir = (from: { x: number; y: number }, to: { x: number; y: number }) => Math.atan2(to.y - from.y, to.x - from.x);

/** Gương phẳng vẽ từ O theo hướng góc a (rad), mặt sau có gạch chéo. */
const Mirror: React.FC<{ angle: number; label: string; hatchSide: 1 | -1 }> = ({ angle, label, hatchSide }) => {
  const end = toSvg({ x: MIRROR_LEN * Math.cos(angle), y: MIRROR_LEN * Math.sin(angle) });
  const deg = -angle / DEG;
  // Nhãn đặt ở mặt sau gương, gần đầu gương, để không đè lên tia sáng
  const back = hatchSide === 1 ? { x: Math.sin(angle), y: -Math.cos(angle) } : { x: -Math.sin(angle), y: Math.cos(angle) };
  const labelPos = toSvg({
    x: 0.82 * MIRROR_LEN * Math.cos(angle) + back.x * 0.22,
    y: 0.82 * MIRROR_LEN * Math.sin(angle) + back.y * 0.22
  });
  return (
    <g>
      <g transform={`translate(${OX} ${OY}) rotate(${deg})`}>
        <rect x="0" y={hatchSide === 1 ? 0 : -12} width={MIRROR_LEN * SCALE} height="12" fill="url(#mirrorHatch2)" />
      </g>
      <line x1={OX} y1={OY} x2={end.x} y2={end.y} stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" />
      <text x={labelPos.x} y={labelPos.y + 5} fill="#7dd3fc" fontSize="15" fontWeight="bold" textAnchor="middle">{label}</text>
    </g>
  );
};

export const HaiGuongView: React.FC<ViewProps<HaiGuongParams>> = ({ params, onParamChange }) => {
  const exact = computeHaiGuong(params);
  const t = useAnimationTime();

  // Vẽ theo giá trị chuyển động mượt, số liệu hiển thị theo giá trị chính xác
  const i = useSpring(params.i, { stiffness: 170, damping: 24 });
  const theta = useSpring(params.theta, { stiffness: 170, damping: 24 });
  const { path, reflections } = computeHaiGuong({ i, theta });

  const pts = path.map(toSvg);
  const source = pts[0];
  const antiParallel = exact.reflections === 2 && Math.abs(exact.angleBetween - 180) < 0.5;

  const dragSource = useSvgDrag(({ x, y }) => {
    const p = toModel(x, y);
    const deg = Math.atan2(p.x - 1, p.y) / DEG;
    onParamChange('i', Math.max(0, Math.min(89, Math.round(deg))));
  });
  const dragMirror = useSvgDrag(({ x, y }) => {
    const p = toModel(x, y);
    const deg = Math.atan2(p.y, p.x) / DEG;
    onParamChange('theta', Math.max(30, Math.min(150, Math.round(deg))));
  });

  const g2End = toSvg({ x: MIRROR_LEN * Math.cos(theta * DEG), y: MIRROR_LEN * Math.sin(theta * DEG) });

  // Pháp tuyến tại các điểm phản xạ (bỏ điểm đầu và điểm cuối của đường đi)
  const normals = path.slice(1, -1).map((p, k) => {
    const onG1 = Math.abs(p.y) < 1e-6;
    const n = onG1 ? { x: 0, y: 1 } : { x: Math.sin(theta * DEG), y: -Math.cos(theta * DEG) };
    const a = toSvg({ x: p.x - n.x * 0.05, y: p.y - n.y * 0.05 });
    const b = toSvg({ x: p.x + n.x * 0.55, y: p.y + n.y * 0.55 });
    const label = toSvg({ x: p.x + n.x * 0.66, y: p.y + n.y * 0.66 });
    return { a, b, label, name: `N${k + 1}` };
  });

  const I1 = pts[1];
  const I2 = pts[2];

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Hệ hai gương phẳng hợp góc θ</h3>
        <div className="stage-badges">
          <span className="badge-tag">Góc tới tại G₁: i = {vn(params.i, 0)}°</span>
          {Number.isFinite(exact.i2) && <span className="badge-tag">Góc tới tại G₂ = {vn(exact.i2, 0)}°</span>}
          {antiParallel ? (
            <span className="badge-tag tag-success">Tia ló song song, ngược chiều tia tới</span>
          ) : (
            <span className="badge-tag tag-warning">
              {exact.reflections === 1 ? 'Tia không tới G₂' : `Phản xạ ${exact.reflections} lần, tia ló lệch ${vn(exact.angleBetween, 0)}°`}
            </span>
          )}
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <pattern id="mirrorHatch2" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="1.5" />
            </pattern>
            <filter id="laserGlow2" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hai gương: G1 nằm ngang, G2 hợp với G1 góc θ */}
          <Mirror angle={0} label="G₁" hatchSide={1} />
          <Mirror angle={theta * DEG} label="G₂" hatchSide={-1} />
          <path
            d={`M ${OX + 34} ${OY} A 34 34 0 0 0 ${OX + 34 * Math.cos(theta * DEG)} ${OY - 34 * Math.sin(theta * DEG)}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <text
            x={OX + 50 * Math.cos((theta / 2) * DEG)}
            y={OY - 50 * Math.sin((theta / 2) * DEG) + 5}
            fill="#e2e8f0"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            θ = {vn(params.theta, 0)}°
          </text>
          <text x={OX - 14} y={OY + 20} fill="#e2e8f0" fontSize="14" fontWeight="bold">O</text>

          {/* Pháp tuyến tại các điểm tới */}
          {normals.map((n) => (
            <g key={n.name}>
              <line x1={n.a.x} y1={n.a.y} x2={n.b.x} y2={n.b.y} stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="6 4" />
              <text x={n.label.x} y={n.label.y + 4} fill="#fbbf24" fontSize="12" fontWeight="bold" textAnchor="middle">{n.name}</text>
            </g>
          ))}

          {/* Đường truyền tia sáng, mỗi đoạn một màu */}
          <g filter="url(#laserGlow2)">
            {pts.slice(0, -1).map((p, k) => (
              <line key={k} x1={p.x} y1={p.y} x2={pts[k + 1].x} y2={pts[k + 1].y} stroke={RAY_COLORS[Math.min(k, RAY_COLORS.length - 1)]} strokeWidth="3" />
            ))}
          </g>
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="5 34"
            strokeDashoffset={-t * 190}
            opacity="0.9"
          />
          {path.slice(0, -1).map((p, k) => (
            <ArrowHead key={k} from={p} to={path[k + 1]} color={RAY_COLORS[Math.min(k, RAY_COLORS.length - 1)]} />
          ))}

          {/* Nhãn góc tại hai điểm tới đầu tiên */}
          {i > 2 && (
            <>
              <AngleMark c={I1} a1={dir(I1, source)} a2={-Math.PI / 2} r={44} color="#f87171" text={`i = ${vn(params.i, 0)}°`} />
              <AngleMark c={I1} a1={-Math.PI / 2} a2={dir(I1, I2)} r={56} color="#38bdf8" text={`i′ = ${vn(params.i, 0)}°`} />
            </>
          )}
          <circle cx={I1.x} cy={I1.y} r="4" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
          <text x={I1.x + 10} y={I1.y + 24} fill="#f8fafc" fontSize="13" fontWeight="bold">I₁</text>
          {reflections >= 2 && I2 && (() => {
            const normalDir = dir(normals[1].a, normals[1].b);
            return (
              <>
                {exact.i2 > 2 && (
                  <>
                    <AngleMark c={I2} a1={dir(I2, I1)} a2={normalDir} r={40} color="#38bdf8" text={`i₂ = ${vn(exact.i2, 0)}°`} />
                    <AngleMark c={I2} a1={normalDir} a2={dir(I2, pts[3])} r={52} color="#34d399" text={`i₂′ = ${vn(exact.i2Prime, 0)}°`} />
                  </>
                )}
                <circle cx={I2.x} cy={I2.y} r="4" fill="#ffffff" stroke="#34d399" strokeWidth="2" />
                {(() => {
                  // Nhãn I2 đặt ở mặt sau gương chứa I2
                  const p = path[2];
                  const onG1 = Math.abs(p.y) < 1e-6;
                  const back = onG1 ? { x: 0, y: -1 } : { x: -Math.sin(theta * DEG), y: Math.cos(theta * DEG) };
                  const l = toSvg({ x: p.x + back.x * 0.14, y: p.y + back.y * 0.14 });
                  return <text x={l.x} y={l.y + 5} fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">I₂</text>;
                })()}
              </>
            );
          })()}

          {/* Đèn S, kéo để đổi góc tới */}
          <g transform={`translate(${source.x} ${source.y}) rotate(${Math.atan2(source.y - I1.y, source.x - I1.x) / DEG})`}>
            <rect x="-2" y="-9" width="36" height="18" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            <circle cx="-2" cy="0" r="3.5" fill="#ef4444" />
          </g>
          <text x={source.x + 4} y={source.y - 20} fill="#f87171" fontSize="13" fontWeight="bold" textAnchor="middle">S</text>
          <circle cx={source.x} cy={source.y} r="24" fill="transparent" {...dragSource} />

          {/* Tay xoay gương G2 */}
          <circle cx={g2End.x} cy={g2End.y} r="7" fill="#7dd3fc" stroke="#ffffff" strokeWidth="2" pointerEvents="none" />
          <circle cx={g2End.x} cy={g2End.y} r="20" fill="transparent" {...dragMirror} />
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Góc tới:</span>
        {[30, 40, 55, 70].map((deg) => (
          <button key={deg} className={`quick-pill ${params.i === deg ? 'active' : ''}`} onClick={() => onParamChange('i', deg)}>
            {deg}°
          </button>
        ))}
        <span>Góc giữa hai gương:</span>
        {[60, 90, 120].map((deg) => (
          <button key={deg} className={`quick-pill ${params.theta === deg ? 'active' : ''}`} onClick={() => onParamChange('theta', deg)}>
            {deg}°
          </button>
        ))}
        <span className="stage-note">Kéo đèn S để đổi góc tới, kéo chấm ở đầu gương G₂ để đổi góc giữa hai gương.</span>
      </div>
    </div>
  );
};
