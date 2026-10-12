import React from 'react';
import { ViewProps } from '../../core/types';
import { MachDienParams } from './model';

export const MachDienView: React.FC<ViewProps<MachDienParams>> = ({ params, outputs, onParamChange }) => {
  const { voltage, switchClosed, topology, wireBroken } = params;
  const { isClosed, isShortCircuit, bulb1Lit, bulb2Lit, currentEst } = outputs;

  const isSwitchOn = switchClosed === 1;

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mô Phỏng Điện Học: Sơ Đồ & Mạch Điện Đơn Giản</h3>
        <div className="stage-badges">
          <span className={`badge-tag ${isShortCircuit ? 'tag-warning' : isClosed ? 'tag-success' : ''}`}>
            {isShortCircuit ? '⚠️ ĐOẢN MẠCH NGUY HIỂM!' : isClosed ? '● Mạch Kín' : '○ Mạch Hở'}
          </span>
          <span className="badge-tag">Nguồn: {voltage} V</span>
          {isClosed === 1 && !isShortCircuit && (
            <span className="badge-tag">I ≈ {currentEst} A</span>
          )}
        </div>
      </div>

      <div className="svg-canvas-wrapper" style={{ height: 420 }}>
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            {/* Bulb glow effect */}
            <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#facc15" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>

            <filter id="shortCircuitBurn" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feColorMatrix type="hueRotate" values="180" />
            </filter>
          </defs>

          {/* SƠ ĐỒ MẠCH ĐIỆN VẼ BẰNG ĐƯỜNG DÂY DẪN */}
          {/* Dây phía trên: từ cực dương pin (x: 150) qua công tắc (x: 250 -> 310) tới tải (x: 450) */}
          <path
            d="M 150 120 L 250 120"
            stroke={wireBroken ? '#64748b' : '#38bdf8'}
            strokeWidth="3.5"
            fill="none"
          />

          {/* CÔNG TẮC K (Đóng / Mở) - BẤM ĐƯỢC */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onParamChange('switchClosed', isSwitchOn ? 0 : 1)}
          >
            {/* Chốt tiếp xúc A */}
            <circle cx="250" cy="120" r="5" fill="#38bdf8" />
            {/* Chốt tiếp xúc B */}
            <circle cx="310" cy="120" r="5" fill="#38bdf8" />
            {/* Cần gạt công tắc */}
            <line
              x1="250"
              y1="120"
              x2={isSwitchOn ? '310' : '295'}
              y2={isSwitchOn ? '120' : '90'}
              stroke={isSwitchOn ? '#10b981' : '#f43f5e'}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text x="280" y="80" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
              K ({isSwitchOn ? 'Đóng' : 'Mở'})
            </text>
          </g>

          {/* Dây sau công tắc tới đèn */}
          <path
            d="M 310 120 L 450 120"
            stroke={wireBroken ? '#64748b' : '#38bdf8'}
            strokeWidth="3.5"
            fill="none"
          />

          {/* TẢI / BÓNG ĐÈN */}
          {topology === 1 && (
            /* 1 bóng đèn ở nhánh phải */
            <g transform="translate(450, 200)">
              {bulb1Lit === 1 && (
                <circle cx="0" cy="0" r="45" fill="url(#bulbGlow)" />
              )}
              {/* Vỏ bóng đèn */}
              <circle cx="0" cy="0" r="22" fill={bulb1Lit ? '#fef9c3' : '#1e293b'} stroke="#e2e8f0" strokeWidth="2.5" />
              {/* Dây tóc hình chữ X bên trong theo ký hiệu SGK */}
              <line x1="-12" y1="-12" x2="12" y2="12" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
              <line x1="-12" y1="12" x2="12" y2="-12" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
              <text x="35" y="5" fill="#f8fafc" fontSize="13" fontWeight="bold">
                Đèn Đ₁
              </text>
              {/* Dây vào / ra đèn */}
              <line x1="0" y1="-80" x2="0" y2="-22" stroke="#38bdf8" strokeWidth="3.5" />
              <line x1="0" y1="22" x2="0" y2="80" stroke="#38bdf8" strokeWidth="3.5" />
            </g>
          )}

          {topology === 2 && (
            /* 2 bóng đèn nối tiếp */
            <g>
              {/* Đèn 1 */}
              <g transform="translate(450, 160)">
                {bulb1Lit === 1 && <circle cx="0" cy="0" r="32" fill="url(#bulbGlow)" />}
                <circle cx="0" cy="0" r="18" fill={bulb1Lit ? '#fef9c3' : '#1e293b'} stroke="#e2e8f0" strokeWidth="2" />
                <line x1="-9" y1="-9" x2="9" y2="9" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <line x1="-9" y1="9" x2="9" y2="-9" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <text x="28" y="5" fill="#f8fafc" fontSize="11" fontWeight="bold">Đ₁</text>
                <line x1="0" y1="-40" x2="0" y2="-18" stroke="#38bdf8" strokeWidth="3" />
              </g>
              {/* Dây nối giữa 2 đèn */}
              <line x1="450" y1="178" x2="450" y2="222" stroke="#38bdf8" strokeWidth="3.5" />
              {/* Đèn 2 */}
              <g transform="translate(450, 240)">
                {bulb2Lit === 1 && <circle cx="0" cy="0" r="32" fill="url(#bulbGlow)" />}
                <circle cx="0" cy="0" r="18" fill={bulb2Lit ? '#fef9c3' : '#1e293b'} stroke="#e2e8f0" strokeWidth="2" />
                <line x1="-9" y1="-9" x2="9" y2="9" stroke={bulb2Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <line x1="-9" y1="9" x2="9" y2="-9" stroke={bulb2Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <text x="28" y="5" fill="#f8fafc" fontSize="11" fontWeight="bold">Đ₂</text>
                <line x1="0" y1="18" x2="0" y2="40" stroke="#38bdf8" strokeWidth="3" />
              </g>
            </g>
          )}

          {topology === 3 && (
            /* 2 bóng đèn song song */
            <g>
              {/* Nhánh 1: x: 410 */}
              <g transform="translate(410, 200)">
                {bulb1Lit === 1 && <circle cx="0" cy="0" r="36" fill="url(#bulbGlow)" />}
                <circle cx="0" cy="0" r="18" fill={bulb1Lit ? '#fef9c3' : '#1e293b'} stroke="#e2e8f0" strokeWidth="2" />
                <line x1="-9" y1="-9" x2="9" y2="9" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <line x1="-9" y1="9" x2="9" y2="-9" stroke={bulb1Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <text x="-32" y="5" fill="#f8fafc" fontSize="11" fontWeight="bold">Đ₁</text>
                <line x1="0" y1="-80" x2="0" y2="-18" stroke="#38bdf8" strokeWidth="3" />
                <line x1="0" y1="18" x2="0" y2="80" stroke="#38bdf8" strokeWidth="3" />
              </g>
              {/* Nhánh 2: x: 490 */}
              <g transform="translate(490, 200)">
                {bulb2Lit === 1 && <circle cx="0" cy="0" r="36" fill="url(#bulbGlow)" />}
                <circle cx="0" cy="0" r="18" fill={bulb2Lit ? '#fef9c3' : '#1e293b'} stroke="#e2e8f0" strokeWidth="2" />
                <line x1="-9" y1="-9" x2="9" y2="9" stroke={bulb2Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <line x1="-9" y1="9" x2="9" y2="-9" stroke={bulb2Lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
                <text x="26" y="5" fill="#f8fafc" fontSize="11" fontWeight="bold">Đ₂</text>
                <line x1="0" y1="-80" x2="0" y2="-18" stroke="#38bdf8" strokeWidth="3" />
                <line x1="0" y1="18" x2="0" y2="80" stroke="#38bdf8" strokeWidth="3" />
              </g>
              {/* Cầu nối song song ngang */}
              <line x1="410" y1="120" x2="490" y2="120" stroke="#38bdf8" strokeWidth="3.5" />
              <line x1="410" y1="280" x2="490" y2="280" stroke="#38bdf8" strokeWidth="3.5" />
            </g>
          )}

          {topology === 4 && (
            /* Đoản mạch: dây nối thẳng không qua tải */
            <g>
              <line x1="450" y1="120" x2="450" y2="280" stroke="#ef4444" strokeWidth="5" strokeDasharray="6 3" />
              {isClosed === 1 && (
                <text x="460" y="200" fill="#f43f5e" fontSize="15" fontWeight="bold">
                  🔥 ĐOẢN MẠCH BỐC KHÓI!
                </text>
              )}
            </g>
          )}

          {/* DÂY ĐÁY QUAY VỀ CỰC ÂM PIN */}
          <path
            d="M 450 280 L 150 280"
            stroke={wireBroken ? '#64748b' : '#38bdf8'}
            strokeWidth="3.5"
            fill="none"
          />

          {/* NGUỒN PIN (Pin hóa học / Ắc quy ở cạnh trái x: 150) */}
          <g transform="translate(150, 200)">
            {/* Dây nối lên cực dương */}
            <line x1="0" y1="-80" x2="0" y2="-20" stroke="#38bdf8" strokeWidth="3.5" />
            {/* Cực dương (+) bản dài mỏng */}
            <line x1="-25" y1="-20" x2="25" y2="-20" stroke="#ef4444" strokeWidth="3.5" />
            <text x="-40" y="-15" fill="#ef4444" fontSize="16" fontWeight="bold">+</text>

            {/* Cực âm (-) bản ngắn dày */}
            <line x1="-15" y1="20" x2="15" y2="20" stroke="#38bdf8" strokeWidth="7" />
            <text x="-38" y="25" fill="#38bdf8" fontSize="16" fontWeight="bold">−</text>
            {/* Dây nối xuống cực âm */}
            <line x1="0" y1="20" x2="0" y2="80" stroke="#38bdf8" strokeWidth="3.5" />

            <text x="35" y="5" fill="#f8fafc" fontSize="13" fontWeight="bold">
              Nguồn Pin ({voltage}V)
            </text>
          </g>
        </svg>
      </div>

      {/* QUICK TOPOLOGY SELECTION BAR */}
      <div className="quick-orientation-bar">
        <span>Kiểu mắc:</span>
        <button
          className={`quick-pill ${topology === 1 ? 'active' : ''}`}
          onClick={() => onParamChange('topology', 1)}
        >
          1 Bóng đèn
        </button>
        <button
          className={`quick-pill ${topology === 2 ? 'active' : ''}`}
          onClick={() => onParamChange('topology', 2)}
        >
          2 Đèn nối tiếp (sáng mờ hơn)
        </button>
        <button
          className={`quick-pill ${topology === 3 ? 'active' : ''}`}
          onClick={() => onParamChange('topology', 3)}
        >
          2 Đèn song song (sáng độc lập)
        </button>
        <button
          className={`quick-pill ${topology === 4 ? 'active' : ''}`}
          style={{ borderColor: 'var(--rose-500)', color: 'var(--rose-500)' }}
          onClick={() => onParamChange('topology', 4)}
        >
          Thử đoản mạch (Nguy hiểm)
        </button>
        <button
          className="quick-pill"
          style={{ marginLeft: 'auto', background: isSwitchOn ? '#10b981' : '#f43f5e', color: '#fff' }}
          onClick={() => onParamChange('switchClosed', isSwitchOn ? 0 : 1)}
        >
          {isSwitchOn ? 'Bấm mở công tắc K' : 'Bấm đóng công tắc K'}
        </button>
      </div>
    </div>
  );
};
