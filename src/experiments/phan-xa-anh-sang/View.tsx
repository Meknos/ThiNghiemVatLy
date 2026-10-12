import React, { useRef, useCallback } from 'react';
import { ViewProps } from '../../core/types';
import { PhanXaParams } from './model';

export const PhanXaView: React.FC<ViewProps<PhanXaParams>> = ({ params, outputs, onParamChange }) => {
  const { i: angleI, mirrorAngle } = params;
  const { i_prime, angleBetweenRays, angleWithMirror } = outputs;

  const svgRef = useRef<SVGSVGElement>(null);

  // Center coordinates of point of incidence I
  const ix = 300;
  const iy = 260;
  const rayLength = 200;

  // Normal line is perpendicular to mirror
  // If mirror is horizontal (0 deg), normal is vertical upwards (angle = -90 deg or 270 deg)
  const mirrorRad = (mirrorAngle * Math.PI) / 180;
  const normalAngleRad = mirrorRad - Math.PI / 2;

  // Incident ray comes from top-left (relative to normal)
  // angleI is measured relative to normal
  const incidentRad = normalAngleRad - (angleI * Math.PI) / 180;
  const sourceX = ix + rayLength * Math.cos(incidentRad);
  const sourceY = iy + rayLength * Math.sin(incidentRad);

  // Reflected ray goes to top-right
  const reflectedRad = normalAngleRad + (i_prime * Math.PI) / 180;
  const targetX = ix + rayLength * Math.cos(reflectedRad);
  const targetY = iy + rayLength * Math.sin(reflectedRad);

  // Normal top point
  const normalTopX = ix + (rayLength + 20) * Math.cos(normalAngleRad);
  const normalTopY = iy + (rayLength + 20) * Math.sin(normalAngleRad);

  // Mouse drag handler for the laser emitter handle
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 600;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 400;

      // Calculate angle relative to incidence point I
      const dx = mouseX - ix;
      const dy = mouseY - iy;
      const mouseAngleRad = Math.atan2(dy, dx);

      // Angle from normal
      let diffDeg = ((mouseAngleRad - normalAngleRad) * 180) / Math.PI;
      // Normalise to [-180, 180]
      while (diffDeg < -180) diffDeg += 360;
      while (diffDeg > 180) diffDeg -= 360;

      let newI = Math.abs(diffDeg);
      if (newI > 89) newI = 89;
      onParamChange('i', Math.round(newI));
    },
    [normalAngleRad, onParamChange]
  );

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Quang Học: Định Luật Phản Xạ Ánh Sáng</h3>
        <div className="stage-badges">
          <span className="badge-tag">Tia Laser & Gương Phẳng</span>
          <span className="badge-tag">Góc tới: {angleI}° | Góc phản xạ: {i_prime}°</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 600 400"
          className="interactive-svg"
          onMouseMove={handleMouseMove}
          style={{ cursor: 'crosshair' }}
        >
          <defs>
            {/* Glow filters for laser rays */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Mirror hatch pattern */}
            <pattern id="mirrorHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
            </pattern>

            <marker id="rayArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>

            <marker id="laserHead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Nửa vòng tròn thước chia độ (Protractor) */}
          <g opacity="0.35">
            <path
              d={`M ${ix - 170} ${iy} A 170 170 0 0 1 ${ix + 170} ${iy}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Vạch chia độ */}
            {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180].map((deg) => {
              const rad = ((-deg) * Math.PI) / 180;
              const r1 = 160;
              const r2 = 170;
              const x1 = ix + r1 * Math.cos(rad);
              const y1 = iy + r1 * Math.sin(rad);
              const x2 = ix + r2 * Math.cos(rad);
              const y2 = iy + r2 * Math.sin(rad);
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1" />
              );
            })}
          </g>

          {/* GƯƠNG PHẲNG */}
          <g transform={`rotate(${mirrorAngle} ${ix} ${iy})`}>
            {/* Mặt phản xạ */}
            <line x1={ix - 220} y1={iy} x2={ix + 220} y2={iy} stroke="#38bdf8" strokeWidth="4" />
            {/* Lớp tráng bạc / gạch chéo đáy gương */}
            <rect x={ix - 220} y={iy} width="440" height="16" fill="url(#mirrorHatch)" />
            <text x={ix + 140} y={iy + 30} fill="#94a3b8" fontSize="12" fontStyle="italic">
              Gương phẳng G
            </text>
          </g>

          {/* ĐIỂM TỚI I */}
          <circle cx={ix} cy={iy} r="4" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
          <text x={ix} y={iy + 20} fill="#f8fafc" fontSize="14" fontWeight="bold" textAnchor="middle">
            I
          </text>

          {/* PHÁP TUYẾN NN' */}
          <line
            x1={ix}
            y1={iy}
            x2={normalTopX}
            y2={normalTopY}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x={normalTopX} y={normalTopY - 8} fill="#fbbf24" fontSize="13" fontWeight="bold" textAnchor="middle">
            N (Pháp tuyến)
          </text>

          {/* TIA TỚI SI (Màu đỏ Laser) */}
          <line
            x1={sourceX}
            y1={sourceY}
            x2={ix}
            y2={iy}
            stroke="#ef4444"
            strokeWidth="3.5"
            filter="url(#laserGlow)"
            markerMid="url(#laserHead)"
          />

          {/* Nguồn phát Laser S (có thể bấm kéo) */}
          <g
            style={{ cursor: 'grab' }}
            transform={`translate(${sourceX}, ${sourceY})`}
          >
            <circle cx="0" cy="0" r="14" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" />
            <circle cx="0" cy="0" r="7" fill="#ef4444" />
            <text x="-25" y="-12" fill="#ef4444" fontSize="12" fontWeight="bold">
              S (Nguồn)
            </text>
          </g>

          {/* TIA PHẢN XẠ IR (Màu xanh Cyan phản xạ) */}
          <line
            x1={ix}
            y1={iy}
            x2={targetX}
            y2={targetY}
            stroke="#38bdf8"
            strokeWidth="3.5"
            filter="url(#laserGlow)"
            markerEnd="url(#rayArrow)"
          />
          <text x={targetX + 10} y={targetY - 10} fill="#38bdf8" fontSize="12" fontWeight="bold">
            R (Tia phản xạ)
          </text>

          {/* CUNG ĐO GÓC TỚI i */}
          {angleI > 3 && (
            <g>
              <text x={(sourceX + ix + normalTopX) / 3} y={(sourceY + iy + normalTopY) / 3} fill="#ef4444" fontSize="13" fontWeight="bold">
                i = {angleI}°
              </text>
            </g>
          )}

          {/* CUNG ĐO GÓC PHẢN XẠ i' */}
          {i_prime > 3 && (
            <g>
              <text x={(targetX + ix + normalTopX) / 3} y={(targetY + iy + normalTopY) / 3} fill="#38bdf8" fontSize="13" fontWeight="bold">
                i' = {i_prime}°
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Quick select presets */}
      <div className="quick-orientation-bar">
        <span>Chọn nhanh góc tới i:</span>
        <button className={`quick-pill ${angleI === 0 ? 'active' : ''}`} onClick={() => onParamChange('i', 0)}>
          0° (Vuông góc)
        </button>
        <button className={`quick-pill ${angleI === 30 ? 'active' : ''}`} onClick={() => onParamChange('i', 30)}>
          30°
        </button>
        <button className={`quick-pill ${angleI === 45 ? 'active' : ''}`} onClick={() => onParamChange('i', 45)}>
          45° (Góc vuông tia)
        </button>
        <button className={`quick-pill ${angleI === 60 ? 'active' : ''}`} onClick={() => onParamChange('i', 60)}>
          60°
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          💡 Bạn có thể bấm và kéo nguồn sáng trực tiếp trên hình!
        </span>
      </div>
    </div>
  );
};
