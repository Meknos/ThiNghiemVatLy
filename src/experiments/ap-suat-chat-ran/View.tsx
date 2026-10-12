import React from 'react';
import { ViewProps } from '../../core/types';
import { ApSuatParams } from './model';

export const ApSuatView: React.FC<ViewProps<ApSuatParams>> = ({ params, outputs, onParamChange }) => {
  const { m, S } = params;
  const { F, p, depth } = outputs;

  // Block dimensions calculated based on S
  // Width proportional to S, height compensates
  const blockWidth = Math.max(60, Math.min(220, Math.sqrt(S) * 22));
  const blockHeight = Math.max(50, Math.min(180, (m / (S || 1)) * 300 + 40));

  // Visual foam surface geometry
  const foamY = 320;
  const sinkPx = Math.min(65, depth * 1.5);
  const blockBottomY = foamY + sinkPx;
  const blockTopY = blockBottomY - blockHeight;

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Thực Nghiệm: Áp Suất & Độ Lún Mặt Bị Ép</h3>
        <div className="stage-badges">
          <span className="badge-tag">Đệm xốp biến dạng</span>
          <span className="badge-tag">Khối kim loại</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            {/* Gradient cho khối kim loại */}
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Gradient cho đệm xốp */}
            <linearGradient id="foamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
            </linearGradient>

            {/* Mũi tên lực */}
            <marker id="arrowF" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Lưới tọa độ mờ phía sau */}
          <g opacity="0.15">
            {[...Array(9)].map((_, i) => (
              <line key={`h-${i}`} x1="40" y1={50 + i * 40} x2="560" y2={50 + i * 40} stroke="#94a3b8" strokeDasharray="3 3" />
            ))}
          </g>

          {/* Đệm xốp / Bề mặt đàn hồi */}
          {/* Vẽ hình đa giác mặt lún */}
          <path
            d={`M 50 ${foamY} 
                L ${300 - blockWidth / 2} ${foamY} 
                L ${300 - blockWidth / 2} ${foamY + sinkPx} 
                L ${300 + blockWidth / 2} ${foamY + sinkPx} 
                L ${300 + blockWidth / 2} ${foamY} 
                L 550 ${foamY} 
                L 550 390 
                L 50 390 Z`}
            fill="url(#foamGrad)"
            stroke="#d97706"
            strokeWidth="2"
          />

          {/* Nhãn đệm xốp */}
          <text x="70" y={foamY + 40} fill="#fef3c7" fontSize="13" fontWeight="bold">
            Mặt bị ép (Đệm xốp mềm)
          </text>

          {/* Đường mặt đất ban đầu (nét đứt) */}
          <line x1="50" y1={foamY} x2="550" y2={foamY} stroke="#ffffff" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.5" />
          <text x="440" y={foamY - 8} fill="#94a3b8" fontSize="11">
            Bề mặt ban đầu (chưa lún)
          </text>

          {/* Khối kim loại */}
          <rect
            x={300 - blockWidth / 2}
            y={blockTopY}
            width={blockWidth}
            height={blockHeight}
            rx="6"
            fill="url(#metalGrad)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))"
          />

          {/* Trọng lượng / Khối lượng ghi trên khối */}
          <text x="300" y={blockTopY + blockHeight / 2 - 6} fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">
            m = {m} kg
          </text>
          <text x="300" y={blockTopY + blockHeight / 2 + 14} fill="#e0f2fe" fontSize="12" textAnchor="middle">
            S = {S} cm²
          </text>

          {/* Véc-tơ áp lực F hướng xuống */}
          <line
            x1="300"
            y1={blockTopY - 50}
            x2="300"
            y2={blockTopY - 4}
            stroke="#ef4444"
            strokeWidth="3.5"
            markerEnd="url(#arrowF)"
          />
          <text x="315" y={blockTopY - 25} fill="#ef4444" fontSize="14" fontWeight="bold">
            F = {F.toFixed(0)} N
          </text>

          {/* Chỉ báo độ lún h */}
          {sinkPx > 2 && (
            <g>
              <line
                x1={300 + blockWidth / 2 + 15}
                y1={foamY}
                x2={300 + blockWidth / 2 + 15}
                y2={foamY + sinkPx}
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <path
                d={`M ${300 + blockWidth / 2 + 10} ${foamY} L ${300 + blockWidth / 2 + 20} ${foamY} 
                    M ${300 + blockWidth / 2 + 10} ${foamY + sinkPx} L ${300 + blockWidth / 2 + 20} ${foamY + sinkPx}`}
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <text x={300 + blockWidth / 2 + 26} y={foamY + sinkPx / 2 + 4} fill="#fbbf24" fontSize="12" fontWeight="bold">
                Lún: {depth.toFixed(1)} mm
              </text>
            </g>
          )}

          {/* Vạch diện tích tiếp xúc S */}
          <line
            x1={300 - blockWidth / 2}
            y1={foamY + sinkPx + 5}
            x2={300 + blockWidth / 2}
            y2={foamY + sinkPx + 5}
            stroke="#38bdf8"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Phím đổi nhanh tư thế khối kim loại (Mặt lớn / Mặt vừa / Mặt nhỏ) */}
      <div className="quick-orientation-bar">
        <span>Đặt mặt tiếp xúc:</span>
        <button
          className={`quick-pill ${S === 10 ? 'active' : ''}`}
          onClick={() => onParamChange('S', 10)}
        >
          Mặt nhỏ (10 cm²) — Lún sâu nhất
        </button>
        <button
          className={`quick-pill ${S === 25 ? 'active' : ''}`}
          onClick={() => onParamChange('S', 25)}
        >
          Mặt vừa (25 cm²)
        </button>
        <button
          className={`quick-pill ${S === 60 ? 'active' : ''}`}
          onClick={() => onParamChange('S', 60)}
        >
          Mặt lớn (60 cm²) — Lún ít nhất
        </button>
      </div>
    </div>
  );
};
