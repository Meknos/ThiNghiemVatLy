import React from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { ApSuatParams, computeApSuat } from './model';

const FOAM_Y = 290;
const CX = 250;
// Hình vẽ nén theo căn bậc hai để vật 100 kg hay mặt 1000 cm² vẫn nằm gọn trong khung
const S_MAX = 1000;
const F_MAX = 1000;
const widthOf = (S: number) => 44 + 170 * Math.sqrt(S / S_MAX);
const arrowOf = (F: number) => 20 + 62 * Math.sqrt(F / F_MAX);

export const ApSuatView: React.FC<ViewProps<ApSuatParams>> = ({ params, onParamChange }) => {
  const { m, S } = params;
  const { F, p, sinkRatio } = computeApSuat(params);
  const t = useAnimationTime();

  // Cùng một khối, đặt mặt nào xuống thì bề ngang là cạnh của mặt đó
  const targetW = widthOf(S);
  const blockW = useSpring(targetW, { stiffness: 140, damping: 18 });
  const blockH = Math.max(46, Math.min(170, 13500 / blockW));

  // Khối lún xuống và nảy nhẹ rồi dừng, như đặt vật lên đệm mút
  const sink = useSpring(sinkRatio * 62, { stiffness: 90, damping: 9 });
  const bottom = FOAM_Y + sink;
  const top = bottom - blockH;
  const left = CX - blockW / 2;
  const right = CX + blockW / 2;

  // Mặt đệm võng xuống quanh khối
  const sag = 26 + sink * 0.5;
  const foamPath = `M 40 ${FOAM_Y}
    L ${left - sag} ${FOAM_Y}
    C ${left - sag * 0.35} ${FOAM_Y} ${left} ${bottom - sink * 0.45} ${left} ${bottom}
    L ${right} ${bottom}
    C ${right} ${bottom - sink * 0.45} ${right + sag * 0.35} ${FOAM_Y} ${right + sag} ${FOAM_Y}
    L 460 ${FOAM_Y} L 460 385 L 40 385 Z`;

  // Các mũi tên áp suất dưới đáy khối: áp suất càng lớn, mũi tên càng dài và càng dày
  const arrowCount = Math.max(3, Math.round(blockW / 22));
  const arrowLen = 10 + sinkRatio * 30;
  const pulse = 1 + 0.12 * Math.sin(t * 3.2);

  const forceLen = arrowOf(F);

  // Kéo cạnh phải của khối: đổi bề ngang, tức đổi diện tích mặt tiếp xúc
  const dragArea = useSvgDrag(({ x }) => {
    const ratio = Math.max(0, 2 * (x - CX) - 44) / 170;
    onParamChange('S', Math.max(5, Math.min(S_MAX, Math.round(S_MAX * ratio * ratio))));
  });
  // Kéo đuôi mũi tên lực lên xuống: đổi áp lực, tức đổi khối lượng của khối
  const dragForce = useSvgDrag(({ y }) => {
    const ratio = Math.max(0, top - 8 - y - 20) / 62;
    const kg = (F_MAX * ratio * ratio) / 10;
    onParamChange('m', Math.max(0.2, Math.min(100, Math.round(kg * 5) / 5)));
  });
  const side = 78 * Math.sqrt(S / S_MAX); // hình vuông có diện tích tỉ lệ với S

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Áp suất phụ thuộc áp lực và diện tích bị ép</h3>
        <div className="stage-badges">
          <span className="badge-tag">F = {vn(F, 1)} N</span>
          <span className="badge-tag tag-success">p = {vn(p, 0)} Pa</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="foamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.95" />
            </linearGradient>
            <marker id="arrowF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
            <marker id="arrowP" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fde68a" />
            </marker>
          </defs>

          {/* Đệm mút */}
          <path d={foamPath} fill="url(#foamGrad)" stroke="#d97706" strokeWidth="2" />
          <line x1="40" y1={FOAM_Y} x2="460" y2={FOAM_Y} stroke="#ffffff" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.45" />
          <text x="52" y={FOAM_Y - 8} fill="#94a3b8" fontSize="11">Mặt đệm khi chưa đặt vật</text>
          <text x="52" y="372" fill="#fef3c7" fontSize="12" fontWeight="bold">Đệm mút (mặt bị ép)</text>

          {/* Áp suất tác dụng lên mặt bị ép */}
          {Array.from({ length: arrowCount }, (_, k) => {
            const x = left + ((k + 0.5) * blockW) / arrowCount;
            return (
              <line
                key={k}
                x1={x}
                y1={bottom + 3}
                x2={x}
                y2={bottom + 3 + arrowLen * pulse}
                stroke="#fde68a"
                strokeWidth={1.2 + sinkRatio * 2.2}
                markerEnd="url(#arrowP)"
                opacity="0.9"
              />
            );
          })}

          {/* Khối kim loại */}
          <rect
            x={left}
            y={top}
            width={blockW}
            height={blockH}
            rx="5"
            fill="url(#metalGrad)"
            stroke="#bae6fd"
            strokeWidth="2"
          />
          <text x={CX} y={top + blockH / 2 + 5} fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">
            m = {vn(m, 1)} kg
          </text>

          {/* Áp lực F = P, vuông góc với mặt bị ép */}
          <line
            x1={CX}
            y1={top - 8 - forceLen}
            x2={CX}
            y2={top - 8}
            stroke="#ef4444"
            strokeWidth="4"
            markerEnd="url(#arrowF)"
          />
          <text x={CX + 12} y={top - 8 - forceLen / 2} fill="#f87171" fontSize="13" fontWeight="bold">
            F = {vn(F, 1)} N
          </text>

          {/* Bề rộng mặt tiếp xúc */}
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#f8fafc" strokeWidth="3" />

          {/* Tay kéo: đổi diện tích (cạnh khối) và đổi áp lực (đuôi mũi tên) */}
          <g>
            <rect x={right - 3} y={top + blockH / 2 - 16} width="6" height="32" rx="3" fill="#f8fafc" pointerEvents="none" />
            <text x={right + 10} y={top + blockH / 2 + 4} fill="#cbd5e1" fontSize="10" pointerEvents="none">↔ kéo</text>
            <rect x={right - 14} y={top} width="28" height={blockH} fill="transparent" {...dragArea} style={{ cursor: 'ew-resize', touchAction: 'none' }} />
          </g>
          <g>
            <circle cx={CX} cy={top - 8 - forceLen} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" pointerEvents="none" />
            <text x={CX - 12} y={top - 8 - forceLen + 4} fill="#cbd5e1" fontSize="10" textAnchor="end" pointerEvents="none">kéo ↕</text>
            <circle cx={CX} cy={top - 8 - forceLen} r="18" fill="transparent" {...dragForce} style={{ cursor: 'ns-resize', touchAction: 'none' }} />
          </g>

          {/* Mặt bị ép nhìn từ trên xuống, vẽ đúng tỉ lệ */}
          <g transform="translate(528, 96)">
            <text x="0" y="-52" fill="#cbd5e1" fontSize="11" textAnchor="middle">Diện tích bị ép</text>
            <rect x="-40" y="-40" width="80" height="80" fill="none" stroke="#475569" strokeDasharray="3 3" />
            <rect x={-side / 2} y={-side / 2} width={side} height={side} fill="rgba(56,189,248,0.35)" stroke="#38bdf8" strokeWidth="2" />
            <text x="0" y="60" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">S = {vn(S, 0)} cm²</text>
            <text x="0" y="76" fill="#94a3b8" fontSize="10" textAnchor="middle">= {vn(S / 10000, 4)} m²</text>
          </g>

          {/* Phép tính */}
          <g transform="translate(476, 230)">
            <rect x="0" y="0" width="112" height="96" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="56" y="22" fill="#94a3b8" fontSize="11" textAnchor="middle">p = F / S</text>
            <text x="56" y="42" fill="#cbd5e1" fontSize="11" textAnchor="middle">= {vn(F, 1)} / {vn(S / 10000, 4)}</text>
            <text x="56" y="68" fill="#34d399" fontSize="15" fontWeight="bold" textAnchor="middle">{vn(p, 0)} Pa</text>
            <text x="56" y="86" fill="#64748b" fontSize="9" textAnchor="middle">1 Pa = 1 N/m²</text>
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Đặt khối bằng mặt:</span>
        <button className={`quick-pill ${S === 10 ? 'active' : ''}`} onClick={() => onParamChange('S', 10)}>
          Nhỏ (10 cm²)
        </button>
        <button className={`quick-pill ${S === 25 ? 'active' : ''}`} onClick={() => onParamChange('S', 25)}>
          Vừa (25 cm²)
        </button>
        <button className={`quick-pill ${S === 60 ? 'active' : ''}`} onClick={() => onParamChange('S', 60)}>
          Lớn (60 cm²)
        </button>
        <span className="stage-note">Kéo cạnh khối để đổi diện tích, kéo chấm đỏ để đổi áp lực. Độ lún chỉ minh họa.</span>
      </div>
    </div>
  );
};
