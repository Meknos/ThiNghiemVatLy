import React from 'react';
import { ViewProps } from '../../core/types';
import { ArchimedesParams } from './model';

export const ArchimedesView: React.FC<ViewProps<ArchimedesParams>> = ({ params, outputs, onParamChange }) => {
  const { V_cm3, d_liquid, m_kg } = params;
  const { F_A, P, P_prime, state } = outputs;

  const beakerX = 220;
  const beakerY = 140;
  const beakerW = 200;
  const beakerH = 220;
  const waterLevelY = beakerY + 50;

  // Object immersed height
  const objW = 70;
  const objH = Math.min(120, Math.max(40, (V_cm3 / 800) * 100));
  const objY = waterLevelY + 40;

  const isFloating = F_A > P + 0.01;
  const isSinking = P > F_A + 0.01;
  const stateStr = isFloating ? 'Nổi' : isSinking ? 'Chìm' : 'Lơ lửng';

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Thí Nghiệm: Lực Đẩy Ác-si-mét & Sự Nổi/Chìm</h3>
        <div className="stage-badges">
          <span className={`badge-tag ${isFloating ? 'tag-success' : isSinking ? 'tag-warning' : ''}`}>
            ● Trạng thái: {stateStr}
          </span>
          <span className="badge-tag">Lực đẩy F_A = {F_A} N</span>
          <span className="badge-tag">Trọng lượng P = {P} N</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>

            <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* GIÁ ĐỠ VÀ LỰC KẾ LÒ XO PHÍA TRÊN */}
          <g transform="translate(320, 20)">
            {/* Giá treo */}
            <line x1="-70" y1="10" x2="0" y2="10" stroke="#94a3b8" strokeWidth="6" />
            <rect x="-16" y="10" width="32" height="70" rx="4" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="0" y="32" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">LỰC KẾ</text>
            <text x="0" y="55" fill="#facc15" fontSize="13" fontWeight="bold" textAnchor="middle">
              {P_prime} N
            </text>
            {/* Dây treo vật từ lực kế xuống */}
            <line x1="0" y1="80" x2="0" y2={objY - 20} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 2" />
          </g>

          {/* BÌNH THỦY TINH ĐỰNG CHẤT LỎNG */}
          <rect
            x={beakerX}
            y={beakerY}
            width={beakerW}
            height={beakerH}
            rx="8"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* MẶT NƯỚC / CHẤT LỎNG */}
          <rect
            x={beakerX + 3}
            y={waterLevelY}
            width={beakerW - 6}
            height={beakerH - (waterLevelY - beakerY) - 3}
            rx="4"
            fill="url(#waterGrad)"
          />
          <line
            x1={beakerX + 2}
            y1={waterLevelY}
            x2={beakerX + beakerW - 2}
            y2={waterLevelY}
            stroke="#7dd3fc"
            strokeWidth="2.5"
          />
          <text x={beakerX + 15} y={waterLevelY + 25} fill="#e0f2fe" fontSize="11" fontStyle="italic">
            {d_liquid === 10000 ? 'Nước (d = 10000 N/m³)' : d_liquid === 8000 ? 'Dầu (d = 8000 N/m³)' : `Chất lỏng d = ${d_liquid} N/m³`}
          </text>

          {/* VẬT THÍ NGHIỆM CHÌM TRONG CHẤT LỎNG */}
          <rect
            x={320 - objW / 2}
            y={objY}
            width={objW}
            height={objH}
            rx="4"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <text x="320" y={objY + objH / 2} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
            V={V_cm3}cm³
          </text>

          {/* MŨI TÊN LỰC ĐẨY ÁC-SI-MÉT F_A HƯỚNG LÊN (MÀU XANH) */}
          <line
            x1="320"
            y1={objY}
            x2="320"
            y2={objY - Math.min(80, F_A * 8 + 15)}
            stroke="#10b981"
            strokeWidth="4"
            markerEnd="url(#arrowUp)"
          />
          <text x="335" y={objY - 30} fill="#10b981" fontSize="13" fontWeight="bold">
            F_A = {F_A}N
          </text>

          {/* MŨI TÊN TRỌNG LỰC P HƯỚNG XUỐNG (MÀU ĐỎ) */}
          <line
            x1="320"
            y1={objY + objH}
            x2="320"
            y2={objY + objH + Math.min(80, P * 8 + 15)}
            stroke="#ef4444"
            strokeWidth="4"
            markerEnd="url(#arrowDown)"
          />
          <text x="335" y={objY + objH + 40} fill="#ef4444" fontSize="13" fontWeight="bold">
            P = {P}N
          </text>

          {/* GHI CHÚ BÊN PHẢI */}
          <g transform="translate(450, 160)">
            <text x="0" y="0" fill="#f8fafc" fontSize="12" fontWeight="bold">
              Số chỉ lực kế:
            </text>
            <text x="0" y="24" fill="#facc15" fontSize="13" fontWeight="bold">
              P' = P − F_A
            </text>
            <text x="0" y="44" fill="#94a3b8" fontSize="11">
              = {P} − {F_A} = {P_prime} N
            </text>
          </g>
        </svg>
      </div>

      {/* QUICK PRESETS FOR LIQUIDS */}
      <div className="quick-orientation-bar">
        <span>Chọn chất lỏng:</span>
        <button className={`quick-pill ${d_liquid === 10000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10000)}>
          Nước tinh khiết (10.000 N/m³)
        </button>
        <button className={`quick-pill ${d_liquid === 10300 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 10300)}>
          Nước muối biển (10.300 N/m³)
        </button>
        <button className={`quick-pill ${d_liquid === 8000 ? 'active' : ''}`} onClick={() => onParamChange('d_liquid', 8000)}>
          Dầu hỏa (8.000 N/m³)
        </button>
        <button className="quick-pill" onClick={() => onParamChange('V_cm3', 800)}>
          Nhúng chìm sâu hơn (800 cm³)
        </button>
      </div>
    </div>
  );
};
