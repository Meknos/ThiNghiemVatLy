import React from 'react';
import { ViewProps } from '../../core/types';
import { dotsAlong, useAnimationTime, useSpring, vn } from '../../core/anim';
import { MachDienParams, computeMachDien } from './model';

type Pt = [number, number];

const LEFT = 110;
const TOP = 92;
const BOTTOM = 308;
const RIGHT = 470;       // nhánh tải khi mắc một đèn, nối tiếp, đoản mạch
const BR1 = 420;         // hai nhánh khi mắc song song
const BR2 = 510;
const SW = { x1: 220, x2: 282 };
const BREAK = { x1: 250, x2: 296 };
const PLUS_Y = 188;
const MINUS_Y = 212;

const WIRE = '#38bdf8';
const DEAD = '#475569';

const Bulb: React.FC<{
  x: number; y: number; name: string; brightness: number; t: number;
  labelLeft?: boolean; removed: boolean; onToggle: () => void;
}> = ({ x, y, name, brightness, t, labelLeft, removed, onToggle }) => {
  const lit = brightness > 0.01;
  const level = Math.min(1.6, brightness);
  const flicker = 1 + 0.035 * Math.sin(t * 23 + x);
  const side = labelLeft ? -1 : 1;

  // Đèn đã tháo: đui đèn để trống (mạch hở tại đó), bóng đèn đặt bên cạnh
  if (removed) {
    return (
      <g transform={`translate(${x} ${y})`} style={{ cursor: 'pointer' }} onClick={onToggle}>
        <title>Bấm để lắp đèn lại</title>
        <rect x="-8" y="-21" width="16" height="42" fill="#0b1121" />
        <circle cy="-21" r="4.5" fill="#e2e8f0" />
        <circle cy="21" r="4.5" fill="#e2e8f0" />
        <circle r="20" fill="transparent" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />
        <g transform={`translate(${side * 46} 0)`}>
          <circle r="15" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#94a3b8" strokeWidth="1.6" />
          <line x1="-8" y1="8" x2="8" y2="-8" stroke="#94a3b8" strokeWidth="1.6" />
          <text y="30" fill="#fda4af" fontSize="10.5" textAnchor="middle">{name} đã tháo</text>
        </g>
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y})`} style={{ cursor: 'pointer' }} onClick={onToggle}>
      <title>Bấm để tháo đèn khỏi đui</title>
      {lit && (
        <>
          <circle r={(26 + 30 * level) * flicker} fill="url(#bulbGlow)" opacity={Math.min(1, 0.3 + 0.6 * level)} />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4 + t * 0.5;
            const r1 = 26, r2 = 26 + 5 + 12 * level;
            return (
              <line
                key={k}
                x1={r1 * Math.cos(a)} y1={r1 * Math.sin(a)}
                x2={r2 * Math.cos(a)} y2={r2 * Math.sin(a)}
                stroke="#fde047" strokeWidth="2" strokeLinecap="round"
                opacity={Math.min(1, 0.25 + 0.6 * level)}
              />
            );
          })}
        </>
      )}
      <circle r="20" fill={lit ? `rgba(254, 240, 138, ${Math.min(1, 0.35 + 0.6 * level)})` : '#1e293b'} stroke="#e2e8f0" strokeWidth="2.2" />
      <line x1="-11" y1="-11" x2="11" y2="11" stroke={lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
      <line x1="-11" y1="11" x2="11" y2="-11" stroke={lit ? '#ea580c' : '#94a3b8'} strokeWidth="2" />
      <text x={labelLeft ? -30 : 30} y="5" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor={labelLeft ? 'end' : 'start'}>
        {name}
      </text>
    </g>
  );
};

export const MachDienView: React.FC<ViewProps<MachDienParams>> = ({ params, onParamChange }) => {
  const { voltage, switchClosed, topology, wireBroken } = params;
  const out = computeMachDien(params);
  const t = useAnimationTime();

  const closed = out.isClosed === 1;
  const short = out.isShortCircuit === 1;
  const parallel = topology === 3;
  const switchOn = switchClosed === 1;
  const broken = wireBroken === 1;
  const loadX = parallel ? BR1 : RIGHT;
  const out1 = params.bulb1Out === 1;
  const out2 = params.bulb2Out === 1;
  const toggle1 = () => onParamChange('bulb1Out', out1 ? 0 : 1);
  const toggle2 = () => onParamChange('bulb2Out', out2 ? 0 : 1);
  const glow1 = out.bulb1Lit ? out.brightness : 0;
  const glow2 = out.bulb2Lit ? out.brightness : 0;

  const leverAngle = useSpring(switchOn ? 0 : -32, { stiffness: 220, damping: 16 });
  const wireColor = closed ? WIRE : DEAD;

  // Đường đi của dòng điện theo chiều quy ước: cực dương → dây dẫn, đèn → cực âm
  const paths: { pts: Pt[]; current: number }[] = parallel
    ? [
        { pts: [[LEFT, PLUS_Y], [LEFT, TOP], [BR1, TOP]], current: out.currentEst },
        { pts: [[BR1, TOP], [BR1, BOTTOM]], current: out1 ? 0 : out.bulbCurrent },
        { pts: [[BR1, TOP], [BR2, TOP], [BR2, BOTTOM], [BR1, BOTTOM]], current: out2 ? 0 : out.bulbCurrent },
        { pts: [[BR1, BOTTOM], [LEFT, BOTTOM], [LEFT, MINUS_Y]], current: out.currentEst }
      ]
    : [{ pts: [[LEFT, PLUS_Y], [LEFT, TOP], [RIGHT, TOP], [RIGHT, BOTTOM], [LEFT, BOTTOM], [LEFT, MINUS_Y]], current: out.currentEst }];

  const dotSpeed = (current: number) => (short ? 270 : 26 + 70 * current);

  const brightnessText =
    !closed ? 'Đèn tắt' :
    short ? 'Đèn không sáng' :
    out.brightness < 0.5 ? 'Đèn sáng yếu' :
    out.overVoltage ? 'Đèn quá sáng, dễ cháy' :
    out.brightness > 1.2 ? 'Đèn sáng mạnh hơn bình thường' :
    'Đèn sáng bình thường';

  // Tia lửa khi đoản mạch
  const sparkSeed = Math.floor(t * 14);
  const sparks = Array.from({ length: 5 }, (_, k) => {
    const a = ((sparkSeed * 37 + k * 71) % 360) * (Math.PI / 180);
    const r = 14 + ((sparkSeed * 13 + k * 29) % 18);
    return { x: RIGHT + r * Math.cos(a), y: 200 + r * Math.sin(a) };
  });

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>Mạch điện đơn giản: nguồn, công tắc, bóng đèn</h3>
        <div className="stage-badges">
          <span className={`badge-tag ${short ? 'tag-warning' : closed ? 'tag-success' : ''}`}>
            {short ? 'Đoản mạch!' : closed ? 'Mạch kín' : 'Mạch hở'}
          </span>
          <span className="badge-tag">Nguồn {vn(voltage, 1)} V</span>
          {closed && <span className="badge-tag">I = {vn(out.currentEst)} A</span>}
          {out.overVoltage === 1 && <span className="badge-tag tag-warning">Quá hiệu điện thế định mức</span>}
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox="0 0 600 400" className="interactive-svg">
          <defs>
            <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#facc15" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* DÂY DẪN */}
          <g fill="none" stroke={wireColor} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
            <polyline points={`${LEFT},${PLUS_Y} ${LEFT},${TOP} ${SW.x1},${TOP}`} />
            <polyline points={`${SW.x2},${TOP} ${loadX},${TOP}`} />
            {broken ? (
              <>
                <polyline points={`${loadX},${BOTTOM} ${BREAK.x2},${BOTTOM}`} />
                <polyline points={`${BREAK.x1},${BOTTOM} ${LEFT},${BOTTOM} ${LEFT},${MINUS_Y}`} />
              </>
            ) : (
              <polyline points={`${loadX},${BOTTOM} ${LEFT},${BOTTOM} ${LEFT},${MINUS_Y}`} />
            )}
            {parallel ? (
              <>
                <line x1={BR1} y1={TOP} x2={BR1} y2={BOTTOM} />
                <polyline points={`${BR1},${TOP} ${BR2},${TOP} ${BR2},${BOTTOM} ${BR1},${BOTTOM}`} />
              </>
            ) : (
              <line x1={RIGHT} y1={TOP} x2={RIGHT} y2={BOTTOM} stroke={short ? '#f43f5e' : wireColor} strokeWidth={short ? 5 : 3.5} />
            )}
          </g>
          {parallel && (
            <>
              <circle cx={BR1} cy={TOP} r="4.5" fill={wireColor} />
              <circle cx={BR1} cy={BOTTOM} r="4.5" fill={wireColor} />
            </>
          )}

          {/* Bấm vào đoạn dây này để cắt hoặc nối lại */}
          <g style={{ cursor: 'pointer' }} onClick={() => onParamChange('wireBroken', broken ? 0 : 1)}>
            <rect x={BREAK.x1 - 14} y={BOTTOM - 16} width={BREAK.x2 - BREAK.x1 + 28} height="46" fill="transparent" />
            {!broken && (
              <text x={(BREAK.x1 + BREAK.x2) / 2} y={BOTTOM + 22} fill="#64748b" fontSize="10" textAnchor="middle">✂ bấm để cắt dây</text>
            )}
          </g>

          {/* Chỗ dây bị đứt */}
          {broken && (
            <g pointerEvents="none">
              <path d={`M ${BREAK.x1} ${BOTTOM} l 7 -7 M ${BREAK.x1} ${BOTTOM} l 8 5`} stroke={DEAD} strokeWidth="2" fill="none" />
              <path d={`M ${BREAK.x2} ${BOTTOM} l -7 6 M ${BREAK.x2} ${BOTTOM} l -8 -5`} stroke={DEAD} strokeWidth="2" fill="none" />
              <text x={(BREAK.x1 + BREAK.x2) / 2} y={BOTTOM + 24} fill="#f87171" fontSize="12" fontWeight="bold" textAnchor="middle">Dây đứt</text>
            </g>
          )}

          {/* DÒNG ĐIỆN: các hạt chạy theo chiều quy ước, càng nhanh khi cường độ càng lớn */}
          {closed && paths.filter((path) => path.current > 0).map((path, k) =>
            dotsAlong(path.pts, t * dotSpeed(path.current), 26).map(([x, y], n) => (
              <circle key={`${k}-${n}`} cx={x} cy={y} r="3.3" fill={short ? '#fb7185' : '#fde047'} />
            ))
          )}
          {closed && (
            <g>
              <polygon points={`${340},${TOP - 7} ${354},${TOP} ${340},${TOP + 7}`} fill="#fde047" />
              <text x="347" y={TOP - 14} fill="#fde047" fontSize="10.5" textAnchor="middle">Chiều dòng điện</text>
            </g>
          )}

          {/* CÔNG TẮC K: bấm để đóng, mở */}
          <g style={{ cursor: 'pointer' }} onClick={() => onParamChange('switchClosed', switchOn ? 0 : 1)}>
            <rect x={SW.x1 - 12} y={TOP - 52} width={SW.x2 - SW.x1 + 24} height="70" fill="transparent" />
            <line
              x1={SW.x1} y1={TOP} x2={SW.x2} y2={TOP}
              stroke={switchOn ? '#10b981' : '#f43f5e'} strokeWidth="4.5" strokeLinecap="round"
              transform={`rotate(${leverAngle} ${SW.x1} ${TOP})`}
            />
            <circle cx={SW.x1} cy={TOP} r="5.5" fill="#e2e8f0" />
            <circle cx={SW.x2} cy={TOP} r="5.5" fill="#e2e8f0" />
            <text x={(SW.x1 + SW.x2) / 2} y={TOP - 42} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
              K ({switchOn ? 'đóng' : 'mở'})
            </text>
          </g>

          {/* TẢI */}
          {topology === 1 && <Bulb x={RIGHT} y={200} name="Đ₁" brightness={glow1} t={t} removed={out1} onToggle={toggle1} />}
          {topology === 2 && (
            <>
              <Bulb x={RIGHT} y={152} name="Đ₁" brightness={glow1} t={t} removed={out1} onToggle={toggle1} />
              <Bulb x={RIGHT} y={248} name="Đ₂" brightness={glow2} t={t} removed={out2} onToggle={toggle2} />
            </>
          )}
          {parallel && (
            <>
              <Bulb x={BR1} y={200} name="Đ₁" brightness={glow1} t={t} labelLeft removed={out1} onToggle={toggle1} />
              <Bulb x={BR2} y={200} name="Đ₂" brightness={glow2} t={t} removed={out2} onToggle={toggle2} />
            </>
          )}
          {topology === 4 && (
            <g>
              <text x={RIGHT + 14} y="160" fill="#fda4af" fontSize="11">Dây nối tắt,</text>
              <text x={RIGHT + 14} y="174" fill="#fda4af" fontSize="11">không có đèn</text>
              {short && sparks.map((s, k) => (
                <line key={k} x1={RIGHT} y1="200" x2={s.x} y2={s.y} stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
              ))}
            </g>
          )}

          {/* NGUỒN ĐIỆN: bản dài mảnh là cực dương, bản ngắn dày là cực âm */}
          {short && <circle cx={LEFT} cy="200" r={44 + 6 * Math.sin(t * 9)} fill="url(#heatGlow)" />}
          <line x1={LEFT - 24} y1={PLUS_Y} x2={LEFT + 24} y2={PLUS_Y} stroke="#ef4444" strokeWidth="3" />
          <line x1={LEFT - 13} y1={MINUS_Y} x2={LEFT + 13} y2={MINUS_Y} stroke="#38bdf8" strokeWidth="7" />
          <text x={LEFT - 34} y={PLUS_Y + 5} fill="#ef4444" fontSize="17" fontWeight="bold" textAnchor="middle">+</text>
          <text x={LEFT - 34} y={MINUS_Y + 6} fill="#38bdf8" fontSize="17" fontWeight="bold" textAnchor="middle">−</text>
          <text x={LEFT - 46} y="250" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">Nguồn</text>
          <text x={LEFT - 46} y="266" fill="#f8fafc" fontSize="12" textAnchor="middle">{vn(voltage, 1)} V</text>
          {/* Thêm hoặc bớt một pin 1,5 V */}
          {[{ sign: -1, x: LEFT - 68, label: '−' }, { sign: 1, x: LEFT - 24, label: '+' }].map((b) => (
            <g
              key={b.sign}
              style={{ cursor: 'pointer' }}
              onClick={() => onParamChange('voltage', Math.max(1.5, Math.min(24, voltage + b.sign * 1.5)))}
            >
              <title>{b.sign > 0 ? 'Thêm một pin 1,5 V' : 'Bớt một pin 1,5 V'}</title>
              <circle cx={b.x} cy="140" r="11" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <text x={b.x} y="145" fill="#f8fafc" fontSize="15" fontWeight="bold" textAnchor="middle">{b.label}</text>
            </g>
          ))}
          <text x={LEFT - 46} y="122" fill="#94a3b8" fontSize="9.5" textAnchor="middle">số pin</text>
          {short && <text x={LEFT - 46} y="284" fill="#fb7185" fontSize="11" fontWeight="bold" textAnchor="middle">Nguồn nóng lên!</text>}

          {/* SỐ LIỆU */}
          <g transform="translate(176, 150)">
            <rect x="0" y="0" width="200" height="104" rx="8" fill="#0f172a" stroke="#334155" />
            <text x="14" y="24" fill="#94a3b8" fontSize="11">Dòng điện qua nguồn</text>
            <text x="186" y="24" fill="#fde047" fontSize="12" fontWeight="bold" textAnchor="end">{vn(out.currentEst)} A</text>
            <text x="14" y="46" fill="#94a3b8" fontSize="11">Hiệu điện thế mỗi đèn</text>
            <text x="186" y="46" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="end">{vn(out.bulbVoltage, 1)} V</text>
            <text x="14" y="68" fill="#94a3b8" fontSize="11">Dòng điện qua mỗi đèn</text>
            <text x="186" y="68" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="end">{vn(out.bulbCurrent)} A</text>
            <text x="100" y="92" fill={short || out.overVoltage ? '#fb7185' : '#f8fafc'} fontSize="12" fontWeight="bold" textAnchor="middle">
              {short ? 'Dòng điện rất lớn, nguy hiểm!' : brightnessText}
            </text>
          </g>
        </svg>
      </div>

      <div className="quick-orientation-bar">
        <span>Cách mắc:</span>
        <button className={`quick-pill ${topology === 1 ? 'active' : ''}`} onClick={() => onParamChange('topology', 1)}>Một đèn</button>
        <button className={`quick-pill ${topology === 2 ? 'active' : ''}`} onClick={() => onParamChange('topology', 2)}>Hai đèn nối tiếp</button>
        <button className={`quick-pill ${topology === 3 ? 'active' : ''}`} onClick={() => onParamChange('topology', 3)}>Hai đèn song song</button>
        <button className={`quick-pill ${topology === 4 ? 'active' : ''}`} onClick={() => onParamChange('topology', 4)}>Đoản mạch</button>
        <button className={`quick-pill ${switchOn ? 'active' : ''}`} onClick={() => onParamChange('switchClosed', switchOn ? 0 : 1)}>
          {switchOn ? 'Mở công tắc K' : 'Đóng công tắc K'}
        </button>
        <button className={`quick-pill ${broken ? 'active' : ''}`} onClick={() => onParamChange('wireBroken', broken ? 0 : 1)}>
          {broken ? 'Nối lại dây' : 'Làm đứt dây'}
        </button>
        <span className="stage-note">Bấm trực tiếp vào công tắc, bóng đèn (tháo/lắp), dây dẫn, nút ± của nguồn.</span>
      </div>
    </div>
  );
};
