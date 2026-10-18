import React, { useEffect, useRef, useState } from 'react';
import { ViewProps } from '../../core/types';
import { useAnimationTime, useSpring, useSvgDrag, vn } from '../../core/anim';
import { KhoiLuongRiengParams, computeKhoiLuongRieng } from './model';

const PAN = { x: 130, y: 262 };
const CYL = { x: 430, innerW: 66, zeroY: 334, pxPerMl: 2.4 };
const LIFT_Y = 60;

const levelY = (ml: number) => CYL.zeroY - ml * CYL.pxPerMl;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function sampleColor(D: number) {
  if (Math.abs(D - 2700) < 300) return { fill: '#cbd5e1', stroke: '#f1f5f9' };  // nhôm
  if (Math.abs(D - 7800) < 500) return { fill: '#64748b', stroke: '#94a3b8' };  // sắt
  if (Math.abs(D - 8900) < 500) return { fill: '#c2703d', stroke: '#fdba74' };  // đồng
  if (Math.abs(D - 11300) < 600) return { fill: '#475569', stroke: '#7c8ba1' }; // chì
  return { fill: '#f59e0b', stroke: '#fde68a' };
}

export const KhoiLuongRiengView: React.FC<ViewProps<KhoiLuongRiengParams>> = ({ params, onParamChange }) => {
  const { m_g, V1_cm3 } = params;
  const { V_obj, D_g_cm3, D_kg_m3, material, V2_used, valid } = computeKhoiLuongRieng(params);
  const t = useAnimationTime();

  // Bước 1: cân vật. Bước 2: thả vật vào bình chia độ.
  const [inCylinder, setInCylinder] = useState(false);
  const autoDrop = useRef(0);
  useEffect(() => {
    autoDrop.current = window.setTimeout(() => setInCylinder(true), 900);
    return () => window.clearTimeout(autoDrop.current);
  }, []);
  const [jump, setJump] = useState({ key: 0, value: 0 });
  const u = clamp01(useSpring(inCylinder ? 1 : 0, { stiffness: 14, damping: 7.5, jump }));

  const side = 16 + Math.cbrt(V_obj) * 6.5;
  const color = sampleColor(D_kg_m3);

  // Đường đi của vật: nhấc lên khỏi đĩa cân, đưa sang ngang, hạ xuống đáy bình
  const start = { x: PAN.x, y: PAN.y - side };
  const end = { x: CYL.x, y: CYL.zeroY - 2 - side };
  const a = clamp01(u / 0.3), b = clamp01((u - 0.3) / 0.3), c = clamp01((u - 0.6) / 0.4);

  // Tự tay cầm vật: kéo từ đĩa cân sang miệng bình rồi thả vào nước
  const [held, setHeld] = useState<{ x: number; y: number } | null>(null);
  const overCylinder = (x: number) => Math.abs(x - CYL.x) < CYL.innerW / 2 + 14;
  const mouthY = levelY(100) - 26;
  const constrain = (p: { x: number; y: number }) => {
    const y = p.y - side / 2;
    // Đã lọt vào trong bình thì chỉ đi lên xuống được, và không xuyên qua đáy bình hay đĩa cân
    if (overCylinder(p.x) && y + side > mouthY) return { x: CYL.x, y: Math.min(end.y, y) };
    const floor = Math.abs(p.x - PAN.x) < 56 + side / 2 ? start.y : CYL.zeroY - side;
    return { x: p.x, y: Math.min(floor, Math.max(10, y)) };
  };
  const dragSample = useSvgDrag(
    (p) => {
      window.clearTimeout(autoDrop.current); // người dùng đã tự cầm vật thì không tự thả nữa
      setHeld(constrain(p));
    },
    (p) => {
      const pos = constrain(p);
      setHeld(null);
      if (pos.x === CYL.x) {
        // Thả trong bình: vật chìm tiếp xuống đáy từ đúng chỗ vừa thả
        setJump((j) => ({ key: j.key + 1, value: 0.6 + 0.4 * clamp01((pos.y - LIFT_Y) / (end.y - LIFT_Y)) }));
        setInCylinder(true);
      } else {
        // Thả ở ngoài: vật quay về đĩa cân
        setJump((j) => ({ key: j.key + 1, value: 0.3 * clamp01((start.y - pos.y) / (start.y - LIFT_Y)) }));
        setInCylinder(false);
      }
    }
  );

  const objX = held ? held.x : start.x + (end.x - start.x) * b;
  const objY = held ? held.y : start.y + (LIFT_Y - start.y) * a + (end.y - LIFT_Y) * c;

  // Nước dâng dần theo phần vật đã chìm
  const dipped = clamp01((objY + side - levelY(V1_cm3)) / side);
  const level = Math.abs(objX - CYL.x) < 1 ? V1_cm3 + (V2_used - V1_cm3) * dipped : V1_cm3;
  const onPan = held ? held.y >= start.y - 0.5 && Math.abs(held.x - PAN.x) < 56 : u < 0.02;
  const entering = dipped > 0 && dipped < 1;

  const left = CYL.x - CYL.innerW / 2;

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Xác định khối lượng riêng của vật rắn không thấm nước</h3>
        <div className="stage-badges">
          {!valid && <span className="badge-tag tag-warning">V₂ phải lớn hơn V₁</span>}
          <span className="badge-tag">V = {vn(V_obj, 0)} cm³</span>
          <span className="badge-tag">D = {vn(D_kg_m3, 0)} kg/m³</span>
          <span className="badge-tag tag-success">{material}</span>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          {/* CÂN ĐIỆN TỬ */}
          <rect x={PAN.x - 62} y={PAN.y + 24} width="124" height="86" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <rect x={PAN.x - 7} y={PAN.y + 4} width="14" height="20" fill="#64748b" />
          <rect x={PAN.x - 56} y={PAN.y} width="112" height="6" rx="3" fill="#cbd5e1" />
          <rect x={PAN.x - 42} y={PAN.y + 46} width="84" height="36" rx="4" fill="#04080f" stroke="#0ea5e9" strokeWidth="1.5" />
          <text x={PAN.x} y={PAN.y + 71} fill="#38bdf8" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
            {onPan ? vn(m_g, 0) : 0} g
          </text>
          <text x={PAN.x} y={PAN.y + 128} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
            Bước 1: cân khối lượng m
          </text>

          {/* BÌNH CHIA ĐỘ */}
          <ellipse cx={CYL.x} cy={CYL.zeroY + 10} rx="48" ry="9" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          <rect x={left} y={levelY(level)} width={CYL.innerW} height={CYL.zeroY - levelY(level)} fill="rgba(56, 189, 248, 0.45)" />
          <path
            d={`M ${left} ${levelY(level)} Q ${CYL.x} ${levelY(level) + 4} ${left + CYL.innerW} ${levelY(level)}`}
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2"
          />
          {entering && [0, 0.5].map((phase) => {
            const k = (t * 1.8 + phase) % 1;
            return (
              <ellipse
                key={phase}
                cx={CYL.x}
                cy={levelY(level) + 2}
                rx={side / 2 + k * (CYL.innerW / 2 - side / 2)}
                ry={1 + k * 2}
                fill="none"
                stroke="#e0f2fe"
                strokeWidth="1.2"
                opacity={1 - k}
              />
            );
          })}

          {/* Vật mẫu và sợi chỉ buộc vật */}
          {!onPan && <line x1={objX} y1={objY - 60} x2={objX} y2={objY} stroke="#e2e8f0" strokeWidth="1.2" />}
          <rect x={objX - side / 2} y={objY} width={side} height={side} rx="3" fill={color.fill} stroke={color.stroke} strokeWidth="1.8" />

          {/* Thành bình và vạch chia (vẽ sau để nằm trên nước và vật) */}
          <path
            d={`M ${left - 2} ${levelY(100) - 26} L ${left - 2} ${CYL.zeroY + 2} L ${left + CYL.innerW + 2} ${CYL.zeroY + 2} L ${left + CYL.innerW + 2} ${levelY(100) - 26}`}
            fill="rgba(255,255,255,0.03)"
            stroke="#cbd5e1"
            strokeWidth="2.5"
          />
          {Array.from({ length: 21 }, (_, i) => i * 5).map((v) => (
            <g key={v}>
              <line x1={left - 2} y1={levelY(v)} x2={left + (v % 10 === 0 ? 14 : 8)} y2={levelY(v)} stroke="#e2e8f0" strokeWidth={v % 10 === 0 ? 1.4 : 0.8} />
              {v % 20 === 0 && (
                <text x={left + 17} y={levelY(v) + 3.5} fill="#e2e8f0" fontSize="9" fontFamily="JetBrains Mono, monospace">{v}</text>
              )}
            </g>
          ))}
          <text x={CYL.x} y={levelY(100) - 32} fill="#94a3b8" fontSize="9" textAnchor="middle">cm³ (mL)</text>

          {/* Vùng cầm vật, đặt trên cùng để bấm được cả khi vật ở trong bình */}
          <rect x={objX - side / 2 - 8} y={objY - 8} width={side + 16} height={side + 16} fill="transparent" {...dragSample} />

          {/* Mực nước ban đầu và mực nước hiện tại */}
          <line x1={left - 2} y1={levelY(V1_cm3)} x2={left + CYL.innerW + 16} y2={levelY(V1_cm3)} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={left + CYL.innerW + 20} y={levelY(V1_cm3) + 4} fill="#fbbf24" fontSize="11" fontWeight="bold">V₁ = {vn(V1_cm3, 0)}</text>
          {level > V1_cm3 + 0.5 && (
            <>
              <line x1={left + CYL.innerW + 2} y1={levelY(level)} x2={left + CYL.innerW + 16} y2={levelY(level)} stroke="#38bdf8" strokeWidth="1.5" />
              <text x={left + CYL.innerW + 20} y={levelY(level) + 4} fill="#38bdf8" fontSize="11" fontWeight="bold">
                {dipped >= 1 ? `V₂ = ${vn(V2_used, 0)}` : vn(level, 0)}
              </text>
            </>
          )}
          <text x={CYL.x} y={CYL.zeroY + 38} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
            Bước 2: đo thể tích V = V₂ − V₁
          </text>

          {/* PHÉP TÍNH */}
          <g transform="translate(222, 150)">
            <rect x="0" y="0" width="150" height="118" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="12" y="22" fill="#94a3b8" fontSize="10.5">m</text>
            <text x="138" y="22" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="end">{vn(m_g, 0)} g</text>
            <text x="12" y="42" fill="#94a3b8" fontSize="10.5">V = V₂ − V₁</text>
            <text x="138" y="42" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="end">{vn(V_obj, 0)} cm³</text>
            <line x1="12" y1="52" x2="138" y2="52" stroke="#334155" />
            <text x="12" y="71" fill="#94a3b8" fontSize="10.5">D = m / V</text>
            <text x="138" y="71" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="end">{vn(D_g_cm3)} g/cm³</text>
            <text x="138" y="89" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="end">= {vn(D_kg_m3, 0)} kg/m³</text>
            <text x="75" y="108" fill="#f8fafc" fontSize="10.5" textAnchor="middle">{material}</text>
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <button className="quick-pill active" onClick={() => setInCylinder(!inCylinder)}>
          {inCylinder ? 'Lấy vật ra, đặt lên cân' : 'Thả vật vào bình chia độ'}
        </button>
        <span>Hoặc tự kéo vật thả vào bình. Vật mẫu 20 cm³:</span>
        {[
          { name: 'Nhôm', m: 54 },
          { name: 'Sắt', m: 156 },
          { name: 'Đồng', m: 178 },
          { name: 'Chì', m: 226 }
        ].map((sample) => (
          <button
            key={sample.name}
            className={`quick-pill ${m_g === sample.m && V_obj === 20 ? 'active' : ''}`}
            onClick={() => {
              onParamChange('m_g', sample.m);
              onParamChange('V1_cm3', 50);
              onParamChange('V2_cm3', 70);
              setInCylinder(false);
              window.setTimeout(() => setInCylinder(true), 700);
            }}
          >
            {sample.name}
          </button>
        ))}
      </div>
    </div>
  );
};
