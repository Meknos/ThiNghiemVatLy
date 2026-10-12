import React, { useRef, useCallback } from 'react';
import { ViewProps } from '../../core/types';
import { KhucXaParams } from './model';

export const KhucXaView: React.FC<ViewProps<KhucXaParams>> = ({
  params,
  outputs,
  onParamChange
}) => {
  const { i: angleI, medium } = params;
  const { r: angleR, deviation, mediumName } = outputs;

  const svgRef = useRef<SVGSVGElement>(null);

  const ix = 300;
  const iy = 200;
  const rayLen = 170;

  // Incident ray in air (top-left)
  const iRad = (angleI * Math.PI) / 180;
  const srcX = ix - rayLen * Math.sin(iRad);
  const srcY = iy - rayLen * Math.cos(iRad);

  // Refracted ray in medium (bottom-right)
  const rRad = (angleR * Math.PI) / 180;
  const targetX = ix + rayLen * Math.sin(rRad);
  const targetY = iy + rayLen * Math.cos(rRad);

  // Continuation of incident ray (straight line)
  const straightX = ix + rayLen * Math.sin(iRad);
  const straightY = iy + rayLen * Math.cos(iRad);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 600;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 400;

      if (mouseY >= iy) return; // Chỉ kéo ở nửa trên (không khí)
      const dx = ix - mouseX;
      const dy = iy - mouseY;
      let newI = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
      if (newI < 0) newI = 0;
      if (newI > 85) newI = 85;
      onParamChange('i', newI);
    },
    [onParamChange]
  );

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Quang Học: Định Luật Khúc Xạ Ánh Sáng</h3>
        <div className="stage-badges">
          <span className="badge-tag">Góc tới: i = {angleI}°</span>
          <span className="badge-tag tag-success">Góc khúc xạ: r = {angleR}° (r &lt; i)</span>
          <span className="badge-tag">Môi trường: {mediumName}</span>
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
            <linearGradient id="mediumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.75" />
            </linearGradient>

            <marker id="arrowLaserRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
            <marker id="arrowLaserCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* NỬA DƯỚI: MÔI TRƯỜNG TRONG SUỐT (NƯỚC / THỦY TINH) */}
          <rect x="50" y={iy} width="500" height="180" fill="url(#mediumGrad)" stroke="#0ea5e9" strokeWidth="1" />
          <text x="70" y={iy + 35} fill="#e0f2fe" fontSize="13" fontWeight="bold">
            Môi trường 2: {mediumName}
          </text>

          {/* NỬA TRÊN: KHÔNG KHÍ */}
          <text x="70" y={iy - 25} fill="#94a3b8" fontSize="13" fontWeight="bold">
            Môi trường 1: Không khí (n₁ = 1)
          </text>

          {/* MẶT PHÂN CÁCH HAI MÔI TRƯỜNG */}
          <line x1="50" y1={iy} x2="550" y2={iy} stroke="#38bdf8" strokeWidth="3" />
          <text x="500" y={iy - 8} fill="#38bdf8" fontSize="11" fontStyle="italic">
            Mặt phân cách
          </text>

          {/* ĐIỂM TỚI I */}
          <circle cx={ix} cy={iy} r="4" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
          <text x={ix + 12} y={iy - 8} fill="#ffffff" fontSize="13" fontWeight="bold">I</text>

          {/* ĐƯỜNG PHÁP TUYẾN NN' */}
          <line x1={ix} y1="30" x2={ix} y2="370" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" />
          <text x={ix - 12} y="45" fill="#fbbf24" fontSize="12" fontWeight="bold">N</text>
          <text x={ix - 12} y="365" fill="#fbbf24" fontSize="12" fontWeight="bold">N'</text>

          {/* TIA TỚI SI TRONG KHÔNG KHÍ (MÀU ĐỎ) */}
          <line
            x1={srcX}
            y1={srcY}
            x2={ix}
            y2={iy}
            stroke="#ef4444"
            strokeWidth="3.5"
            markerMid="url(#arrowLaserRed)"
          />
          {/* Nguồn phát laser S kéo được */}
          <g transform={`translate(${srcX}, ${srcY})`} style={{ cursor: 'grab' }}>
            <circle cx="0" cy="0" r="12" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="2" />
            <circle cx="0" cy="0" r="6" fill="#ef4444" />
            <text x="-25" y="-14" fill="#ef4444" fontSize="11" fontWeight="bold">S (Kéo nguồn)</text>
          </g>

          {/* TIA KHÚC XẠ IK BỊ BẺ CONG (MÀU CYAN) */}
          <line
            x1={ix}
            y1={iy}
            x2={targetX}
            y2={targetY}
            stroke="#38bdf8"
            strokeWidth="3.5"
            markerEnd="url(#arrowLaserCyan)"
          />
          <text x={targetX + 10} y={targetY + 4} fill="#38bdf8" fontSize="12" fontWeight="bold">K (Tia khúc xạ)</text>

          {/* PHƯƠNG KÉO DÀI CỦA TIA TỚI ĐỂ THẤY GÓC LỆCH (NÉT ĐỨT) */}
          {angleI > 5 && (
            <line
              x1={ix}
              y1={iy}
              x2={straightX}
              y2={straightY}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* NHÃN GÓC TỚI i & GÓC KHÚC XẠ r */}
          {angleI > 5 && (
            <text x={ix - 35} y={iy - 35} fill="#ef4444" fontSize="13" fontWeight="bold">
              i = {angleI}°
            </text>
          )}
          {angleR > 3 && (
            <text x={ix + 18} y={iy + 45} fill="#38bdf8" fontSize="13" fontWeight="bold">
              r = {angleR}°
            </text>
          )}
        </svg>
      </div>

      {/* QUICK PRESETS */}
      <div className="quick-orientation-bar">
        <span>Chọn môi trường khúc xạ:</span>
        <button className={`quick-pill ${medium === 1 ? 'active' : ''}`} onClick={() => onParamChange('medium', 1)}>
          Nước (n = 1.33)
        </button>
        <button className={`quick-pill ${medium === 2 ? 'active' : ''}`} onClick={() => onParamChange('medium', 2)}>
          Thủy tinh (n = 1.50) — Bẻ cong nhiều hơn
        </button>
        <button className={`quick-pill ${medium === 3 ? 'active' : ''}`} onClick={() => onParamChange('medium', 3)}>
          Kim cương (n = 2.42) — Bẻ cong tối đa
        </button>
        <button className="quick-pill" onClick={() => onParamChange('i', 60)}>
          Góc tới lớn (60°)
        </button>
      </div>
    </div>
  );
};
