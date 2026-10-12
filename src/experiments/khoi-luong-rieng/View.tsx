import React from 'react';
import { ViewProps } from '../../core/types';
import { KhoiLuongRiengParams } from './model';

export const KhoiLuongRiengView: React.FC<ViewProps<KhoiLuongRiengParams>> = ({
  params,
  outputs,
  onParamChange
}) => {
  const { m_g, V1_cm3, V2_cm3 } = params;
  const { V_obj, D_g_cm3, D_kg_m3, material } = outputs;

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Thí Nghiệm: Đo Thể Tích & Xác Định Khối Lượng Riêng</h3>
        <div className="stage-badges">
          <span className="badge-tag tag-success">Chất liệu: {material}</span>
          <span className="badge-tag">D = {D_g_cm3} g/cm³ = {D_kg_m3} kg/m³</span>
          <span className="badge-tag">V = {V_obj} cm³ (mL)</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          {/* CÂN ĐIỆN TỬ ĐO KHỐI LƯỢNG m BÊN TRÁI */}
          <g transform="translate(100, 160)">
            {/* Đĩa cân kim loại */}
            <ellipse cx="60" cy="50" rx="55" ry="12" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="52" y="50" width="16" height="30" fill="#64748b" />
            {/* Thân cân điện tử */}
            <rect x="0" y="80" width="120" height="90" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Màn hình LED LCD hiển thị số gam */}
            <rect x="20" y="105" width="80" height="35" rx="4" fill="#090d16" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="60" y="128" fill="#38bdf8" fontSize="16" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
              {m_g} g
            </text>
            <text x="60" y="195" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
              Cân điện tử (m = {m_g}g)
            </text>

            {/* Vật mẫu đặt trên đĩa cân */}
            <rect x="35" y="15" width="50" height="35" rx="4" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="60" y="37" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Vật Mẫu</text>
          </g>

          {/* MŨI TÊN CHUYỂN TIẾP THẢ VẬT VÀO BÌNH */}
          <g transform="translate(255, 230)">
            <path d="M 0 0 Q 30 -30 60 0" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
            <polygon points="60,0 52,-6 55,4" fill="#38bdf8" />
            <text x="30" y="-15" fill="#94a3b8" fontSize="10" textAnchor="middle">Thả chìm</text>
          </g>

          {/* BÌNH CHIA ĐỘ (ỐNG ĐONG) BÊN PHẢI */}
          <g transform="translate(360, 60)">
            {/* Đế ống đong */}
            <ellipse cx="60" cy="300" rx="45" ry="12" fill="#334155" stroke="#64748b" strokeWidth="2" />
            {/* Thân thủy tinh ống đong */}
            <rect x="25" y="20" width="70" height="280" rx="4" fill="rgba(255, 255, 255, 0.04)" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Cột nước dâng lên mức V2 */}
            <rect
              x="27"
              y={290 - (V2_cm3 / 100) * 240}
              width="66"
              height={(V2_cm3 / 100) * 240}
              fill="rgba(56, 189, 248, 0.5)"
            />

            {/* Vạch chia độ 0 -> 100 mL */}
            {[0, 20, 40, 60, 80, 100].map((v) => {
              const y = 290 - (v / 100) * 240;
              return (
                <g key={v}>
                  <line x1="25" y1={y} x2="40" y2={y} stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="44" y={y + 4} fill="#cbd5e1" fontSize="9" fontFamily="JetBrains Mono">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* Mực nước ban đầu V1 (nét đứt) */}
            <line
              x1="27"
              y1={290 - (V1_cm3 / 100) * 240}
              x2="93"
              y2={290 - (V1_cm3 / 100) * 240}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text x="105" y={290 - (V1_cm3 / 100) * 240 + 4} fill="#fbbf24" fontSize="10" fontWeight="bold">
              V₁ = {V1_cm3} cm³
            </text>

            {/* Mực nước sau V2 */}
            <line
              x1="27"
              y1={290 - (V2_cm3 / 100) * 240}
              x2="93"
              y2={290 - (V2_cm3 / 100) * 240}
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text x="105" y={290 - (V2_cm3 / 100) * 240 + 4} fill="#38bdf8" fontSize="10" fontWeight="bold">
              V₂ = {V2_cm3} cm³
            </text>

            {/* Vật mẫu chìm dưới đáy ống đong */}
            <rect x="42" y="240" width="36" height="45" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            <text x="60" y="325" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
              Bình chia độ (V = V₂ − V₁)
            </text>
          </g>
        </svg>
      </div>

      {/* QUICK MATERIAL PRESETS */}
      <div className="quick-orientation-bar">
        <span>Thử vật mẫu kim loại:</span>
        <button
          className={`quick-pill ${Math.abs(D_kg_m3 - 2700) < 300 ? 'active' : ''}`}
          onClick={() => {
            onParamChange('m_g', 54);
            onParamChange('V1_cm3', 50);
            onParamChange('V2_cm3', 70); // V = 20 -> D = 2.7
          }}
        >
          Khối Nhôm (D ≈ 2700 kg/m³)
        </button>
        <button
          className={`quick-pill ${Math.abs(D_kg_m3 - 7800) < 500 ? 'active' : ''}`}
          onClick={() => {
            onParamChange('m_g', 156);
            onParamChange('V1_cm3', 50);
            onParamChange('V2_cm3', 70); // V = 20 -> D = 7.8
          }}
        >
          Khối Sắt (D ≈ 7800 kg/m³)
        </button>
        <button
          className={`quick-pill ${Math.abs(D_kg_m3 - 8900) < 500 ? 'active' : ''}`}
          onClick={() => {
            onParamChange('m_g', 178);
            onParamChange('V1_cm3', 50);
            onParamChange('V2_cm3', 70); // V = 20 -> D = 8.9
          }}
        >
          Khối Đồng (D ≈ 8900 kg/m³)
        </button>
        <button
          className={`quick-pill ${Math.abs(D_kg_m3 - 11300) < 600 ? 'active' : ''}`}
          onClick={() => {
            onParamChange('m_g', 226);
            onParamChange('V1_cm3', 50);
            onParamChange('V2_cm3', 70); // V = 20 -> D = 11.3
          }}
        >
          Khối Chì (D ≈ 11300 kg/m³)
        </button>
      </div>
    </div>
  );
};
