import React from 'react';
import { ViewProps } from '../../core/types';
import { ApSuatChatLongParams } from './model';

export const ApSuatChatLongView: React.FC<ViewProps<ApSuatChatLongParams>> = ({
  params,
  outputs,
  onParamChange
}) => {
  const { h_cm, d_liquid } = params;
  const { p, jetRange } = outputs;

  // Cylinder coordinates
  const cylX = 140;
  const cylY = 80;
  const cylW = 120;
  const cylH = 260;

  // Depth in px: top of water is cylY + 20, bottom is cylY + cylH
  const waterTopY = cylY + 20;
  const probeY = waterTopY + (h_cm / 80) * (cylH - 20);

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Thí Nghiệm: Áp Suất Chất Lỏng Tại Các Độ Sâu</h3>
        <div className="stage-badges">
          <span className="badge-tag">Độ sâu: h = {h_cm} cm</span>
          <span className="badge-tag">Áp suất: p = {p} N/m² (Pa)</span>
          <span className="badge-tag">Tia nước phụt xa: {jetRange} cm</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="deepWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
            </linearGradient>

            <filter id="jetGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* TRỤ CHỨA CHẤT LỎNG */}
          <rect
            x={cylX}
            y={cylY}
            width={cylW}
            height={cylH}
            rx="6"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* CỘT NƯỚC */}
          <rect
            x={cylX + 3}
            y={waterTopY}
            width={cylW - 6}
            height={cylH - (waterTopY - cylY) - 3}
            fill="url(#deepWaterGrad)"
          />
          <line
            x1={cylX + 2}
            y1={waterTopY}
            x2={cylX + cylW - 2}
            y2={waterTopY}
            stroke="#7dd3fc"
            strokeWidth="2.5"
          />
          <text x={cylX + 15} y={waterTopY - 8} fill="#38bdf8" fontSize="11" fontWeight="bold">
            Mặt thoáng chất lỏng
          </text>

          {/* CÁC VẠCH ĐỘ SÂU BÊN TRÁI TRỤ */}
          {[0, 20, 40, 60, 80].map((depth) => {
            const y = waterTopY + (depth / 80) * (cylH - 20);
            return (
              <g key={depth}>
                <line x1={cylX - 8} y1={y} x2={cylX} y2={y} stroke="#64748b" strokeWidth="1.5" />
                <text x={cylX - 12} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                  {depth}cm
                </text>
              </g>
            );
          })}

          {/* 3 LỖ XẢ NƯỚC VÀ CÁC TIA NƯỚC PHỤT RA (MINH HỌA KHTN 8) */}
          {/* Lỗ A (nông): h = 25cm -> phụt gần */}
          <circle cx={cylX + cylW} cy={waterTopY + 60} r="3" fill="#38bdf8" />
          <path
            d={`M ${cylX + cylW} ${waterTopY + 60} Q ${cylX + cylW + 70} ${waterTopY + 65} ${cylX + cylW + 80} 340`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            opacity="0.7"
          />
          <text x={cylX + cylW + 90} y={335} fill="#94a3b8" fontSize="10">Lỗ A (nông)</text>

          {/* Lỗ B (vừa): h = 50cm -> phụt vừa */}
          <circle cx={cylX + cylW} cy={waterTopY + 130} r="3" fill="#38bdf8" />
          <path
            d={`M ${cylX + cylW} ${waterTopY + 130} Q ${cylX + cylW + 150} ${waterTopY + 140} ${cylX + cylW + 180} 340`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="4 2"
            opacity="0.85"
          />
          <text x={cylX + cylW + 190} y={335} fill="#94a3b8" fontSize="10">Lỗ B (vừa)</text>

          {/* Lỗ C (sát đáy): h = 75cm -> phụt xa nhất! */}
          <circle cx={cylX + cylW} cy={waterTopY + 210} r="3" fill="#38bdf8" />
          <path
            d={`M ${cylX + cylW} ${waterTopY + 210} Q ${cylX + cylW + 220} ${waterTopY + 225} ${cylX + cylW + 280} 340`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            filter="url(#jetGlow)"
          />
          <text x={cylX + cylW + 290} y={335} fill="#38bdf8" fontSize="10" fontWeight="bold">Lỗ C (đáy - xa nhất)</text>

          {/* MẶT ĐẤT SÀN */}
          <line x1="80" y1="340" x2="560" y2="340" stroke="#475569" strokeWidth="2" />

          {/* ĐẦU DÒ ĐỘ SÂU ĐANG XÉT (HÌNH TRÒN VÀNG CÓ THỂ ĐIỀU CHỈNH) */}
          <line x1={cylX} y1={probeY} x2={cylX + cylW} y2={probeY} stroke="#facc15" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={cylX + cylW / 2} cy={probeY} r="7" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
          <text x={cylX + cylW / 2 + 12} y={probeY + 4} fill="#facc15" fontSize="12" fontWeight="bold">
            p = {p} Pa
          </text>
        </svg>
      </div>

      {/* QUICK PRESET BUTTONS */}
      <div className="quick-orientation-bar">
        <span>Chọn độ sâu khảo sát h:</span>
        <button className={`quick-pill ${h_cm === 15 ? 'active' : ''}`} onClick={() => onParamChange('h_cm', 15)}>
          Nông (15 cm) — p nhỏ
        </button>
        <button className={`quick-pill ${h_cm === 40 ? 'active' : ''}`} onClick={() => onParamChange('h_cm', 40)}>
          Giữa cột nước (40 cm)
        </button>
        <button className={`quick-pill ${h_cm === 75 ? 'active' : ''}`} onClick={() => onParamChange('h_cm', 75)}>
          Sát đáy bình (75 cm) — p lớn nhất
        </button>
      </div>
    </div>
  );
};
