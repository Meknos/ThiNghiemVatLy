import React from 'react';
import { ViewProps } from '../../core/types';
import { OhmParams } from './model';

export const OhmView: React.FC<ViewProps<OhmParams>> = ({
  params,
  outputs,
  onParamChange
}) => {
  const { U, R } = params;
  const { I, P_power } = outputs;

  // Needle angle for Ammeter (0A = -45 deg, 3A = +45 deg)
  const ammeterAngle = -45 + (Math.min(3, I) / 3) * 90;

  // Needle angle for Voltmeter (0V = -45 deg, 24V = +45 deg)
  const voltmeterAngle = -45 + (Math.min(24, U) / 24) * 90;

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Điện Học: Khảo Sát Định Luật Ôm & Đo U, I</h3>
        <div className="stage-badges">
          <span className="badge-tag tag-success">I = {I} A (Ampe)</span>
          <span className="badge-tag">U = {U} V (Vôn)</span>
          <span className="badge-tag">R = {R} Ω (Ôm)</span>
          <span className="badge-tag">P = {P_power} W</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          {/* MẠCH ĐIỆN CHÍNH */}
          {/* Dây dẫn chữ nhật bao quanh: (120, 160) đến (480, 280) */}
          <path
            d="M 120 200 L 120 140 L 220 140"
            stroke="#38bdf8"
            strokeWidth="3.5"
            fill="none"
          />

          {/* AMPE KẾ A MẮC NỐI TIẾP (220 -> 300) */}
          <g transform="translate(260, 140)">
            {/* Đồng hồ đo kim */}
            <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
            <path d="M -20 -10 A 25 25 0 0 1 20 -10" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Kim đo xoay */}
            <line
              x1="0"
              y1="10"
              x2="0"
              y2="-22"
              stroke="#ef4444"
              strokeWidth="2.5"
              transform={`rotate(${ammeterAngle})`}
            />
            <circle cx="0" cy="10" r="3" fill="#ef4444" />
            <text x="0" y="22" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">A</text>
          </g>

          {/* DÂY TỪ AMPE KẾ QUA ĐIỆN TRỞ R */}
          <line x1="292" y1="140" x2="350" y2="140" stroke="#38bdf8" strokeWidth="3.5" />

          {/* ĐIỆN TRỞ R (HÌNH CHỮ NHẬT THEO SGK) */}
          <g transform="translate(350, 120)">
            <rect x="0" y="0" width="80" height="40" rx="3" fill="#334155" stroke="#f59e0b" strokeWidth="2.5" />
            {/* Vạch điện trở */}
            <line x1="20" y1="5" x2="20" y2="35" stroke="#64748b" strokeWidth="1.5" />
            <line x1="40" y1="5" x2="40" y2="35" stroke="#64748b" strokeWidth="1.5" />
            <line x1="60" y1="5" x2="60" y2="35" stroke="#64748b" strokeWidth="1.5" />
            <text x="40" y="25" fill="#facc15" fontSize="13" fontWeight="bold" textAnchor="middle">
              {R} Ω
            </text>
          </g>

          {/* DÂY ĐI TIẾP VỀ GÓC PHẢI */}
          <path
            d="M 430 140 L 480 140 L 480 260 L 120 260 L 120 200"
            stroke="#38bdf8"
            strokeWidth="3.5"
            fill="none"
          />

          {/* NGUỒN ĐIỆN DC BIẾN THIÊN (CẠNH TRÁI x: 120) */}
          <g transform="translate(120, 200)">
            <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#ef4444" strokeWidth="3.5" />
            <line x1="-12" y1="15" x2="12" y2="15" stroke="#38bdf8" strokeWidth="6" />
            <text x="-40" y="-10" fill="#ef4444" fontSize="14" fontWeight="bold">+</text>
            <text x="-38" y="22" fill="#38bdf8" fontSize="14" fontWeight="bold">−</text>
            <text x="-75" y="5" fill="#f8fafc" fontSize="12" fontWeight="bold">Nguồn {U}V</text>
          </g>

          {/* VÔN KẾ V MẮC SONG SONG VỚI ĐIỆN TRỞ R (Ở TRÊN ĐẦU R) */}
          <g>
            {/* Dây nhánh nối song song */}
            <path d="M 330 140 L 330 70 L 390 70" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 450 140 L 450 70 L 390 70" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" fill="none" />

            {/* Mặt đồng hồ Vôn kế */}
            <g transform="translate(390, 70)">
              <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
              <path d="M -16 -8 A 20 20 0 0 1 16 -8" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <line
                x1="0"
                y1="8"
                x2="0"
                y2="-18"
                stroke="#fbbf24"
                strokeWidth="2.5"
                transform={`rotate(${voltmeterAngle})`}
              />
              <circle cx="0" cy="8" r="2.5" fill="#fbbf24" />
              <text x="0" y="18" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">V</text>
            </g>
          </g>

          {/* BẢNG SỐ LIỆU ĐO ĐẠC TRỰC TIẾP */}
          <g transform="translate(240, 290)">
            <rect x="0" y="0" width="220" height="75" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <text x="15" y="24" fill="#94a3b8" fontSize="11">Hiệu điện thế đo được (V):</text>
            <text x="180" y="24" fill="#fbbf24" fontSize="13" fontWeight="bold" textAnchor="end">{U} V</text>
            <text x="15" y="46" fill="#94a3b8" fontSize="11">Cường độ dòng điện (A):</text>
            <text x="180" y="46" fill="#10b981" fontSize="13" fontWeight="bold" textAnchor="end">{I} A</text>
            <text x="15" y="66" fill="#94a3b8" fontSize="11">Tỉ số U / I:</text>
            <text x="180" y="66" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="end">
              {(U / (I || 1)).toFixed(1)} Ω = R
            </text>
          </g>
        </svg>
      </div>

      {/* QUICK PRESET BUTTONS */}
      <div className="quick-orientation-bar">
        <span>Chọn nhanh giá trị:</span>
        <button className="quick-pill" onClick={() => onParamChange('U', 6)}>
          U = 6 V
        </button>
        <button className="quick-pill" onClick={() => onParamChange('U', 12)}>
          U = 12 V (Chuẩn bình ắc quy)
        </button>
        <button className="quick-pill" onClick={() => onParamChange('U', 18)}>
          U = 18 V
        </button>
        <button className="quick-pill" onClick={() => onParamChange('R', 5)}>
          Điện trở nhỏ: R = 5 Ω (Dòng lớn)
        </button>
        <button className="quick-pill" onClick={() => onParamChange('R', 20)}>
          Điện trở lớn: R = 20 Ω (Dòng nhỏ)
        </button>
      </div>
    </div>
  );
};
