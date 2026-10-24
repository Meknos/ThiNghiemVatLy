import React from 'react';
import { useAnimationTime } from '../../core/anim';
import { SceneId } from './formulas';
import { fmt } from './model';

type Values = Record<string, number>;
interface SceneProps {
  values: Values;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : lo));
const C = { axis: '#64748b', dim: '#94a3b8', text: '#cbd5e1', force: '#ef4444', forceText: '#f87171', ok: '#34d399', warn: '#fbbf24', ray: '#facc15', blue: '#38bdf8' };

const Arrow: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
  </marker>
);

/* ------------------------------------------------------------------
   Chuyển động, công
------------------------------------------------------------------ */

/** Xe chạy hết quãng đường s trong thời gian t (thời gian trên màn hình được nén lại cho dễ xem). */
const MotionScene: React.FC<SceneProps> = ({ values }) => {
  const t = useAnimationTime();
  // Dùng chung cho tốc độ (s, t), tốc độ trung bình (s1 + s2, t1 + t2) và động năng (chỉ có v)
  const s = values.s ?? (values.s1 !== undefined ? values.s1 + values.s2 : undefined);
  const duration = values.t ?? (values.t1 !== undefined ? values.t1 + values.t2 : undefined);
  const v = values.v;
  const play = Math.max(2.5, Math.min(6, duration ?? 4));
  const u = Math.min(1, (t % (play + 1.2)) / play);
  const x0 = 60, x1 = 500;
  const x = x0 + (x1 - x0) * u;
  const split = values.s1 !== undefined && s ? x0 + ((x1 - x0) * values.s1) / s : null;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <line x1="30" y1="112" x2="530" y2="112" stroke={C.axis} strokeWidth="2" />
      {Array.from({ length: 11 }, (_, k) => (
        <line key={k} x1={x0 + ((x1 - x0) * k) / 10} y1="112" x2={x0 + ((x1 - x0) * k) / 10} y2={k % 5 === 0 ? 124 : 118} stroke={C.dim} />
      ))}
      <text x={x0} y="140" fill={C.dim} fontSize="11" textAnchor="middle">0</text>
      {s !== undefined && <text x={x1} y="140" fill={C.warn} fontSize="12" fontWeight="bold" textAnchor="middle">s = {fmt(s)} m</text>}
      {split !== null && (
        <g>
          <line x1={split} y1="100" x2={split} y2="128" stroke={C.blue} strokeDasharray="3 3" />
          <text x={(x0 + split) / 2} y="140" fill={C.blue} fontSize="11" textAnchor="middle">s1 = {fmt(values.s1)} m</text>
          <text x={(split + x1) / 2} y="140" fill={C.blue} fontSize="11" textAnchor="middle">s2 = {fmt(values.s2)} m</text>
        </g>
      )}
      <line x1={x0} y1="112" x2={x} y2="112" stroke={C.warn} strokeWidth="4" />

      <g transform={`translate(${x} 0)`}>
        <rect x="-34" y="78" width="60" height="22" rx="5" fill="#0ea5e9" />
        <path d="M -22 78 L -14 62 L 12 62 L 20 78 Z" fill={C.blue} />
        <circle cx="-18" cy="104" r="8" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="12" cy="104" r="8" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
        <text x="0" y="52" fill={C.ok} fontSize="12" fontWeight="bold" textAnchor="middle">v = {fmt(v)} m/s</text>
      </g>

      {duration !== undefined && (
        <g transform="translate(470 14)">
          <rect width="76" height="34" rx="6" fill="#04080f" stroke="#0ea5e9" />
          <text x="38" y="23" fill={C.blue} fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
            {fmt(Number((duration * u).toFixed(duration < 20 ? 1 : 0)))} s
          </text>
        </g>
      )}
      {s !== undefined && <text x="32" y="24" fill={C.dim} fontSize="11">Đã đi được {fmt(Number((s * u).toFixed(s < 20 ? 1 : 0)))} m</text>}
      {values.W !== undefined && <text x="32" y="24" fill={C.ok} fontSize="12">Động năng Wđ = {fmt(values.W)} J, m = {fmt(values.m)} kg</text>}
    </svg>
  );
};

/** Lực F đẩy thùng hàng đi quãng đường s: công tăng dần theo quãng đường đã đi. */
const PushScene: React.FC<SceneProps> = ({ values }) => {
  const t = useAnimationTime();
  const { F } = values;
  const u = Math.min(1, (t % 5.2) / 4);
  const x0 = 110, x1 = 450;
  const x = x0 + (x1 - x0) * u;
  const arrow = Math.min(70, 24 + F * 0.06);
  const isPower = values.A === undefined;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="pushArrow" color={C.force} /></defs>
      <line x1="30" y1="112" x2="530" y2="112" stroke={C.axis} strokeWidth="2" />
      <line x1={x0} y1="118" x2={x1} y2="118" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
      <line x1={x0} y1="118" x2={x} y2="118" stroke={C.warn} strokeWidth="4" />
      <text x={(x0 + x1) / 2} y="140" fill={C.warn} fontSize="12" fontWeight="bold" textAnchor="middle">
        {isPower ? `v = ${fmt(values.v)} m/s` : `s = ${fmt(values.s)} m`}
      </text>

      <g transform={`translate(${x} 0)`}>
        <rect x="-26" y="64" width="52" height="48" rx="4" fill="#b45309" stroke="#fcd34d" strokeWidth="2" />
        <line x1="-26" y1="80" x2="26" y2="80" stroke="#fcd34d" />
        <line x1={-34 - arrow} y1="88" x2="-32" y2="88" stroke={C.force} strokeWidth="4" markerEnd="url(#pushArrow)" />
        <text x={-34 - arrow / 2} y="78" fill={C.forceText} fontSize="12" fontWeight="bold" textAnchor="middle">F = {fmt(F)} N</text>
      </g>

      <text x="32" y="24" fill={C.dim} fontSize="11">{isPower ? 'Công suất' : 'Công đã thực hiện'}</text>
      <text x="32" y="44" fill={C.ok} fontSize="16" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
        {isPower ? `${fmt(values.P)} W` : `${fmt(Number((values.A * u).toFixed(0)))} J`}
      </text>
      {!isPower && <rect x="150" y="30" width="330" height="10" rx="5" fill="rgba(255,255,255,0.08)" />}
      {!isPower && <rect x="150" y="30" width={330 * u} height="10" rx="5" fill={C.ok} />}
    </svg>
  );
};

/* ------------------------------------------------------------------
   Quang học: đường truyền tia sáng qua thấu kính
------------------------------------------------------------------ */

const LensScene: React.FC<SceneProps & { diverging?: boolean }> = ({ values, diverging = false }) => {
  // Kính lúp chỉ có f và G: vật đặt trong khoảng tiêu cự, cách kính 0,6·f
  const f = values.f;
  const d = values.d ?? 0.6 * f;
  const dp = values.dp ?? (f * d) / (d - f);
  // Ảnh qua thấu kính phân kì luôn ảo: đặt về cùng phía vật
  const imageX = diverging ? -Math.abs(dp) : dp;
  const atInfinity = !Number.isFinite(dp) || Math.abs(dp) > 1e5;

  const cx = 280, axisY = 92;
  const span = Math.max(d, 1.3 * f, atInfinity ? 0 : Math.min(Math.abs(imageX), 6 * d));
  const k = 230 / span;
  const X = (cm: number) => cx + cm * k;
  const ratio = atInfinity ? 0 : -imageX / d; // độ phóng đại có dấu: âm là ảnh ngược chiều
  // Vật thấp lại khi ảnh lớn để cả vật và ảnh đều nằm trong khung
  const objH = Math.max(8, Math.min(34, 56 / Math.max(1, Math.abs(ratio))));
  const ox = X(-d);
  const oy = axisY - objH;
  const ix = X(imageX);
  const iy = axisY - objH * ratio;
  const imageVisible = !atInfinity && ix > 6 && ix < 554 && Math.abs(iy - axisY) < 140;
  const virtual = imageX < 0;

  // Tia 1: song song trục chính rồi đi qua (hoặc kéo dài qua) tiêu điểm ảnh
  const focusX = diverging ? X(-f) : X(f);
  const slope = (axisY - oy) / (focusX - cx);
  const farX = 556;
  const ray1End = { x: farX, y: oy + slope * (farX - cx) };
  // Tia 2: qua quang tâm truyền thẳng
  const slope2 = (axisY - oy) / (cx - ox);
  const ray2End = { x: farX, y: oy + slope2 * (farX - ox) };

  return (
    <svg viewBox="0 0 560 170" className="formula-scene">
      <defs><Arrow id="lensArrow" color={C.ok} /><Arrow id="lensRay" color={C.ray} /></defs>
      <line x1="6" y1={axisY} x2="554" y2={axisY} stroke={C.axis} strokeWidth="1.4" />
      {/* Thấu kính */}
      <line x1={cx} y1="16" x2={cx} y2="166" stroke={C.blue} strokeWidth="3" />
      {diverging ? (
        <g stroke={C.blue} strokeWidth="2.5" fill="none">
          <path d={`M ${cx - 8} 22 L ${cx} 16 L ${cx + 8} 22`} />
          <path d={`M ${cx - 8} 160 L ${cx} 166 L ${cx + 8} 160`} />
        </g>
      ) : (
        <g stroke={C.blue} strokeWidth="2.5" fill="none">
          <path d={`M ${cx - 8} 24 L ${cx} 16 L ${cx + 8} 24`} />
          <path d={`M ${cx - 8} 158 L ${cx} 166 L ${cx + 8} 158`} />
        </g>
      )}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={X(s * f)} cy={axisY} r="3" fill={C.blue} />
          <text x={X(s * f)} y={axisY + 16} fill={C.blue} fontSize="11" textAnchor="middle">{s < 0 ? 'F' : "F'"}</text>
        </g>
      ))}
      <text x={cx + 6} y={axisY + 16} fill={C.dim} fontSize="11">O</text>

      {/* Vật */}
      <line x1={ox} y1={axisY} x2={ox} y2={oy + 4} stroke={C.ok} strokeWidth="3" markerEnd="url(#lensArrow)" />
      <text x={ox} y={oy - 6} fill={C.ok} fontSize="11" textAnchor="middle">AB</text>

      {/* Tia sáng */}
      <polyline points={`${ox},${oy} ${cx},${oy} ${ray1End.x},${ray1End.y}`} fill="none" stroke={C.ray} strokeWidth="1.6" />
      <line x1={ox} y1={oy} x2={ray2End.x} y2={ray2End.y} stroke={C.ray} strokeWidth="1.6" />
      {(virtual || diverging) && !atInfinity && (
        <g stroke={C.ray} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8">
          <line x1={cx} y1={oy} x2={ix} y2={iy} />
          <line x1={ox} y1={oy} x2={ix} y2={iy} />
        </g>
      )}

      {/* Ảnh */}
      {imageVisible && (
        <g>
          <line x1={ix} y1={axisY} x2={ix} y2={iy} stroke="#f472b6" strokeWidth="3" strokeDasharray={virtual ? '5 3' : undefined} />
          <text x={ix} y={ratio > 0 ? iy - 6 : iy + 14} fill="#f472b6" fontSize="11" textAnchor="middle">A'B'</text>
        </g>
      )}
      <text x="10" y="162" fill={C.text} fontSize="11">
        f = {fmt(f)} cm · d = {fmt(d)} cm · {atInfinity ? 'không có ảnh' : `d' = ${fmt(diverging ? Math.abs(dp) : dp)} cm (${virtual ? 'ảnh ảo' : 'ảnh thật'})`}
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------
   Âm học
------------------------------------------------------------------ */

/** Âm phát ra, tới vách và dội lại: xung âm đi rồi về trong thời gian t. */
const EchoScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const { d, t, v } = values;
  const u = (time % 4) / 3.2; // 0..1 đi, 1..1,25 nghỉ
  const x0 = 80, x1 = 480;
  const going = u <= 0.5;
  const pos = u > 1 ? null : going ? x0 + (x1 - x0) * (u / 0.5) : x1 - (x1 - x0) * ((u - 0.5) / 0.5);
  const water = v >= 1000 && v < 3000;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      {water && <rect x="20" y="30" width="520" height="90" fill="rgba(14,165,233,0.12)" />}
      <rect x={x1} y="24" width="14" height="100" fill="#475569" />
      {Array.from({ length: 7 }, (_, k) => <line key={k} x1={x1} y1={30 + k * 14} x2={x1 + 14} y2={24 + k * 14} stroke="#64748b" />)}
      <circle cx={x0 - 20} cy="74" r="14" fill="#0ea5e9" />
      <path d={`M ${x0 - 8} 66 L ${x0 + 4} 58 L ${x0 + 4} 90 L ${x0 - 8} 82 Z`} fill={C.blue} />
      {pos !== null && (
        <g>
          {[0, 8, 16].map((o) => (
            <path key={o} d={`M ${pos + (going ? -o : o)} 56 Q ${pos + (going ? 12 - o : o - 12)} 74 ${pos + (going ? -o : o)} 92`} fill="none" stroke={going ? C.warn : C.ok} strokeWidth="2.5" opacity={1 - o / 24} />
          ))}
        </g>
      )}
      <line x1={x0} y1="132" x2={x1} y2="132" stroke={C.dim} />
      <line x1={x0} y1="126" x2={x0} y2="138" stroke={C.dim} />
      <line x1={x1} y1="126" x2={x1} y2="138" stroke={C.dim} />
      <text x={(x0 + x1) / 2} y="146" fill={C.warn} fontSize="12" fontWeight="bold" textAnchor="middle">d = {fmt(d)} m</text>
      <text x="20" y="18" fill={C.text} fontSize="11">
        Âm đi tới vật cản rồi dội lại: quãng đường 2d trong t = {fmt(t)} s, tốc độ âm v = {fmt(v)} m/s
      </text>
    </svg>
  );
};

/** Dao động của nguồn âm: số dao động trong một giây là tần số. */
const WaveScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const { f } = values;
  // Hình sóng có số chu kì tăng theo log của tần số để vẫn nhìn được ở tần số lớn
  const cycles = clamp(1 + Math.log10(Math.max(1, f)) * 2.2, 1, 12);
  const pts = Array.from({ length: 161 }, (_, k) => {
    const x = 90 + (k / 160) * 440;
    const y = 76 - 34 * Math.sin((k / 160) * cycles * 2 * Math.PI - time * 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const swing = 6 * Math.sin(time * Math.min(30, f) * 0.6);

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <g transform="translate(46 0)">
        <rect x="-4" y="96" width="8" height="40" fill="#94a3b8" />
        <path d={`M -4 96 L ${-14 + swing} 26`} stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
        <path d={`M 4 96 L ${14 - swing} 26`} stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
      </g>
      <line x1="90" y1="76" x2="530" y2="76" stroke="#334155" />
      <polyline points={pts} fill="none" stroke={f < 20 || f > 20000 ? C.dim : C.ok} strokeWidth="2.4" />
      <text x="90" y="138" fill={C.text} fontSize="12">
        f = {fmt(f)} Hz: {fmt(f)} dao động mỗi giây ({f < 20 ? 'hạ âm' : f > 20000 ? 'siêu âm' : 'tai người nghe được'})
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------
   Máy cơ đơn giản
------------------------------------------------------------------ */

/** Đòn bẩy: lực F2 (vật) ở bên trái, lực F1 ở bên phải; độ dài cánh tay đòn vẽ theo tỉ lệ. */
const LeverScene: React.FC<SceneProps> = ({ values }) => {
  // Mô men lực chỉ có một lực F và cánh tay đòn d
  const single = values.F1 === undefined;
  const d1 = single ? values.d * 100 : values.d1;
  const d2 = single ? 0 : values.d2;
  const F1 = single ? values.F : values.F1;
  const F2 = single ? 0 : values.F2;
  const cx = single ? 120 : 280, y = 92;
  const k = (single ? 380 : 240) / Math.max(d1, d2, 1);
  const len = (F: number) => clamp(14 + Math.sqrt(Math.max(F, 0)) * 3, 14, 60);

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="leverArrow" color={C.force} /></defs>
      <polygon points={`${cx},${y + 4} ${cx - 14},${y + 30} ${cx + 14},${y + 30}`} fill="#64748b" />
      <line x1={cx - d2 * k} y1={y} x2={cx + d1 * k} y2={y} stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
      {!single && (
        <g>
          <rect x={cx - d2 * k - 16} y={y + 4} width="32" height={clamp(14 + Math.sqrt(F2), 14, 40)} fill="#b45309" stroke="#fcd34d" />
          <line x1={cx - d2 * k} y1={y + 2} x2={cx - d2 * k} y2={y + 4 + len(F2)} stroke={C.force} strokeWidth="3" markerEnd="url(#leverArrow)" opacity="0.8" />
          <text x={cx - d2 * k} y={y - 10} fill={C.forceText} fontSize="12" fontWeight="bold" textAnchor="middle">F2 = {fmt(F2)} N</text>
          <text x={cx - (d2 * k) / 2} y={y + 46} fill={C.warn} fontSize="11" textAnchor="middle">d2 = {fmt(d2)} cm</text>
        </g>
      )}
      <line x1={cx + d1 * k} y1={y - 4 - len(F1)} x2={cx + d1 * k} y2={y - 6} stroke={C.force} strokeWidth="3" markerEnd="url(#leverArrow)" transform={`rotate(180 ${cx + d1 * k} ${y - 5 - len(F1) / 2})`} />
      <text x={cx + d1 * k} y={y - 12 - len(F1)} fill={C.forceText} fontSize="12" fontWeight="bold" textAnchor="middle">{single ? 'F' : 'F1'} = {fmt(F1)} N</text>
      <text x={cx + (d1 * k) / 2} y={y + 46} fill={C.warn} fontSize="11" textAnchor="middle">{single ? `d = ${fmt(values.d)} m` : `d1 = ${fmt(d1)} cm`}</text>
      <text x="16" y="18" fill={C.text} fontSize="11">
        {single ? `Mô men M = F·d = ${fmt(values.M)} N·m` : `F1·d1 = ${fmt(F1 * d1)} · F2·d2 = ${fmt(F2 * d2)} (N·cm)`}
      </text>
    </svg>
  );
};

/** Lò xo treo vật: độ giãn vẽ theo tỉ lệ. Dùng cả cho trọng lượng (P = 10m). */
const SpringScene: React.FC<SceneProps> = ({ values }) => {
  const weightOnly = values.k === undefined;
  const F = weightOnly ? values.P : values.F;
  const stretch = weightOnly ? clamp(F / 4, 6, 60) : clamp(values.dl * 4, 4, 70);
  const top = 14, rest = 40, coils = 9;
  const bottom = top + rest + stretch;
  const pts = Array.from({ length: coils * 2 + 1 }, (_, k) => {
    const yy = top + 8 + ((bottom - top - 16) * k) / (coils * 2);
    const xx = k === 0 || k === coils * 2 ? 140 : 140 + (k % 2 ? 12 : -12);
    return `${xx},${yy.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="springArrow" color={C.force} /></defs>
      <rect x="90" y="6" width="100" height="8" fill="#475569" />
      <polyline points={`140,14 140,${top + 8} ${pts} 140,${bottom}`} fill="none" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="120" y={bottom} width="40" height="28" rx="3" fill="#b45309" stroke="#fcd34d" />
      <line x1="200" y1={top + rest} x2="230" y2={top + rest} stroke={C.dim} strokeDasharray="3 3" />
      <line x1="200" y1={bottom} x2="230" y2={bottom} stroke={C.dim} strokeDasharray="3 3" />
      {!weightOnly && <text x="236" y={(top + rest + bottom) / 2 + 4} fill={C.warn} fontSize="12" fontWeight="bold">Δl = {fmt(values.dl)} cm</text>}
      <line x1="140" y1={bottom + 28} x2="140" y2={Math.min(146, bottom + 28 + 20)} stroke={C.force} strokeWidth="3" markerEnd="url(#springArrow)" />
      <text x="330" y="50" fill={C.forceText} fontSize="14" fontWeight="bold">{weightOnly ? `P = ${fmt(F)} N` : `Fđh = ${fmt(F)} N`}</text>
      <text x="330" y="74" fill={C.text} fontSize="12">{weightOnly ? `m = ${fmt(values.m)} kg` : `k = ${fmt(values.k)} N/m`}</text>
      <text x="330" y="98" fill={C.dim} fontSize="11">{weightOnly ? 'Vật 1 kg có trọng lượng 10 N' : 'Lò xo giãn càng nhiều, lực đàn hồi càng lớn'}</text>
    </svg>
  );
};

/** Máy nén thủy lực: hai pít-tông, bề rộng vẽ theo căn bậc hai diện tích. */
const HydraulicScene: React.FC<SceneProps> = ({ values }) => {
  const { F, f, S, s } = values;
  const wSmall = clamp(Math.sqrt(s) * 8, 16, 60);
  const wBig = clamp(wSmall * Math.sqrt(S / s), wSmall + 10, 240);
  const xs = 120, xb = 360;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="hydArrow" color={C.force} /></defs>
      <path d={`M ${xs - wSmall / 2} 50 L ${xs - wSmall / 2} 130 L ${xb + wBig / 2} 130 L ${xb + wBig / 2} 50 L ${xb - wBig / 2} 50 L ${xb - wBig / 2} 108 L ${xs + wSmall / 2} 108 L ${xs + wSmall / 2} 50`} fill="rgba(14,165,233,0.35)" stroke="#94a3b8" strokeWidth="2" />
      <rect x={xs - wSmall / 2} y="44" width={wSmall} height="8" fill="#e2e8f0" />
      <rect x={xb - wBig / 2} y="44" width={wBig} height="8" fill="#e2e8f0" />
      <line x1={xs} y1="12" x2={xs} y2="40" stroke={C.force} strokeWidth="3" markerEnd="url(#hydArrow)" />
      <line x1={xb} y1="42" x2={xb} y2="12" stroke={C.force} strokeWidth="4" markerEnd="url(#hydArrow)" />
      <text x={xs + 10} y="24" fill={C.forceText} fontSize="12" fontWeight="bold">f = {fmt(f)} N</text>
      <text x={xb + 10} y="24" fill={C.forceText} fontSize="12" fontWeight="bold">F = {fmt(F)} N</text>
      <text x={xs} y="146" fill={C.warn} fontSize="11" textAnchor="middle">s = {fmt(s)} cm²</text>
      <text x={xb} y="146" fill={C.warn} fontSize="11" textAnchor="middle">S = {fmt(S)} cm²</text>
    </svg>
  );
};

/** Mặt phẳng nghiêng (hoặc vật ở độ cao h khi tính thế năng). */
const InclineScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const potential = values.l === undefined;
  const h = values.h;
  const l = potential ? h * 2 : values.l;
  const ratio = clamp(h / l, 0.05, 0.95);
  const base = 360, x0 = 90, y0 = 130;
  const height = clamp(base * ratio / Math.sqrt(1 - ratio * ratio), 14, 110);
  const u = (time % 4.5) / 4;
  const along = Math.min(1, u);
  const bx = x0 + base * along, by = y0 - height * along;
  const angle = (Math.atan2(height, base) * 180) / Math.PI;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="inclineArrow" color={C.force} /></defs>
      <line x1="30" y1={y0} x2="530" y2={y0} stroke={C.axis} strokeWidth="2" />
      {potential ? (
        <g>
          <line x1={x0 + base} y1={y0} x2={x0 + base} y2={y0 - height} stroke={C.warn} strokeDasharray="4 3" />
          <rect x={x0 + base - 16} y={y0 - height - 26} width="32" height="26" fill="#b45309" stroke="#fcd34d" />
          <text x={x0 + base + 10} y={y0 - height / 2} fill={C.warn} fontSize="12" fontWeight="bold">h = {fmt(h)} m</text>
          <text x="40" y="22" fill={C.ok} fontSize="13" fontWeight="bold">Wt = {fmt(values.W)} J</text>
          <text x="40" y="40" fill={C.text} fontSize="11">m = {fmt(values.m)} kg, mốc thế năng tại mặt đất</text>
        </g>
      ) : (
        <g>
          <polygon points={`${x0},${y0} ${x0 + base},${y0} ${x0 + base},${y0 - height}`} fill="rgba(148,163,184,0.18)" stroke="#94a3b8" />
          <g transform={`translate(${bx} ${by}) rotate(${-angle})`}>
            <rect x="-14" y="-24" width="28" height="24" fill="#b45309" stroke="#fcd34d" />
            <line x1="16" y1="-12" x2="54" y2="-12" stroke={C.force} strokeWidth="3" markerEnd="url(#inclineArrow)" />
          </g>
          <text x={x0 + base + 8} y={y0 - height / 2} fill={C.warn} fontSize="12" fontWeight="bold">h = {fmt(h)} m</text>
          <text x={x0 + base / 2 - 30} y={y0 - height / 2 - 12} fill={C.warn} fontSize="12" fontWeight="bold" transform={`rotate(${-angle} ${x0 + base / 2} ${y0 - height / 2})`}>l = {fmt(l)} m</text>
          <text x="40" y="22" fill={C.forceText} fontSize="13" fontWeight="bold">F = {fmt(values.F)} N</text>
          <text x="40" y="40" fill={C.text} fontSize="11">P = {fmt(values.P)} N · F·l = P·h</text>
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------
   Điện học
------------------------------------------------------------------ */

const Resistor: React.FC<{ x: number; y: number; label: string; value?: number; unit?: string; glow?: number }> = ({ x, y, label, value, unit = 'Ω', glow = 0 }) => (
  <g>
    <rect x={x - 28} y={y - 10} width="56" height="20" rx="3" fill={glow > 0 ? `rgba(239,68,68,${0.25 + 0.5 * glow})` : '#1e293b'} stroke="#e2e8f0" strokeWidth="2" />
    <text x={x} y={y - 16} fill={C.text} fontSize="11" textAnchor="middle">{label}{value !== undefined ? ` = ${fmt(value)} ${unit}` : ''}</text>
  </g>
);

/** Đoạn mạch nối tiếp; với định luật Ôm, công suất điện chỉ có một dụng cụ. */
const SeriesScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const two = values.R1 !== undefined;
  const y = 50, yb = 124;
  const dash = -(time * 40) % 20;
  const U = values.U;
  const I = values.I;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <path d={`M 80 ${y} L 480 ${y} L 480 ${yb} L 80 ${yb} Z`} fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d={`M 80 ${y} L 480 ${y} L 480 ${yb} L 80 ${yb} Z`} fill="none" stroke={C.warn} strokeWidth="2" strokeDasharray="4 16" strokeDashoffset={dash} />
      {two ? (
        <g>
          <Resistor x={210} y={y} label="R1" value={values.R1} />
          <Resistor x={350} y={y} label="R2" value={values.R2} />
          <text x="280" y="94" fill={C.ok} fontSize="13" fontWeight="bold" textAnchor="middle">Rtđ = R1 + R2 = {fmt(values.R)} Ω</text>
        </g>
      ) : (
        <g>
          <Resistor x={280} y={y} label={values.R !== undefined ? 'R' : 'Dụng cụ điện'} value={values.R} />
          <text x="280" y="94" fill={C.ok} fontSize="13" fontWeight="bold" textAnchor="middle">
            {values.P !== undefined ? `𝒫 = ${fmt(values.P)} W` : ''} {I !== undefined ? `I = ${fmt(I)} A` : ''}
          </text>
        </g>
      )}
      <rect x="250" y={yb - 12} width="60" height="24" fill="#0b1121" />
      <line x1="270" y1={yb - 12} x2="270" y2={yb + 12} stroke="#e2e8f0" strokeWidth="3" />
      <line x1="290" y1={yb - 7} x2="290" y2={yb + 7} stroke="#e2e8f0" strokeWidth="5" />
      <text x="280" y={yb + 24} fill={C.text} fontSize="11" textAnchor="middle">{U !== undefined ? `U = ${fmt(U)} V` : 'Nguồn điện'}</text>
    </svg>
  );
};

const ParallelScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const dash = -(time * 40) % 20;
  const wire = (d: string) => (
    <g>
      <path d={d} fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d={d} fill="none" stroke={C.warn} strokeWidth="2" strokeDasharray="4 16" strokeDashoffset={dash} />
    </g>
  );
  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      {wire('M 60 76 L 160 76 L 160 36 L 400 36 L 400 76 L 500 76')}
      {wire('M 160 76 L 160 108 L 400 108 L 400 76')}
      {wire('M 60 76 L 60 138 L 500 138 L 500 76')}
      <Resistor x={280} y={36} label="R1" value={values.R1} />
      <Resistor x={280} y={108} label="R2" value={values.R2} />
      <circle cx="160" cy="76" r="4" fill="#e2e8f0" />
      <circle cx="400" cy="76" r="4" fill="#e2e8f0" />
      <text x="280" y="70" fill={C.ok} fontSize="12" fontWeight="bold" textAnchor="middle">Rtđ = {fmt(values.R)} Ω</text>
    </svg>
  );
};

/** Dây dẫn hình trụ: dài theo l, dày theo tiết diện S. */
const WireScene: React.FC<SceneProps> = ({ values }) => {
  const { l, S, rho, R } = values;
  const len = clamp(120 + Math.log10(Math.max(l, 0.1)) * 70, 80, 420);
  const thick = clamp(6 + Math.sqrt(S) * 14, 4, 40);
  const x0 = 280 - len / 2, y = 70;
  const material = rho < 2 ? 'đồng' : rho < 3.5 ? 'nhôm' : rho < 8 ? 'vonfram' : rho < 20 ? 'sắt' : rho < 45 ? 'nikelin' : rho < 80 ? 'constantan' : 'nicrom';

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <rect x={x0} y={y - thick / 2} width={len} height={thick} fill="#b45309" />
      <ellipse cx={x0} cy={y} rx={thick / 4} ry={thick / 2} fill="#fbbf24" />
      <ellipse cx={x0 + len} cy={y} rx={thick / 4} ry={thick / 2} fill="#92400e" />
      <line x1={x0} y1={y + 30} x2={x0 + len} y2={y + 30} stroke={C.warn} />
      <text x="280" y={y + 46} fill={C.warn} fontSize="12" fontWeight="bold" textAnchor="middle">l = {fmt(l)} m</text>
      <text x={x0 - 8} y={y - thick / 2 - 8} fill={C.blue} fontSize="11">S = {fmt(S)} mm²</text>
      <text x="16" y="18" fill={C.text} fontSize="11">Dây gần với {material} (ρ = {fmt(rho)}·10⁻⁸ Ω·m)</text>
      <text x="544" y="18" fill={C.ok} fontSize="13" fontWeight="bold" textAnchor="end">R = {fmt(R)} Ω</text>
    </svg>
  );
};

/* ------------------------------------------------------------------
   Nhiệt học
------------------------------------------------------------------ */

const Thermometer: React.FC<{ x: number; temp: number; label: string; color?: string }> = ({ x, temp, label, color = C.force }) => {
  const level = clamp((temp + 20) / 140, 0.03, 1);
  return (
    <g>
      <rect x={x - 5} y="20" width="10" height="100" rx="5" fill="#0b1121" stroke="#94a3b8" />
      <rect x={x - 3} y={20 + 98 * (1 - level)} width="6" height={98 * level} rx="3" fill={color} />
      <circle cx={x} cy="124" r="9" fill={color} stroke="#94a3b8" />
      <text x={x} y="146" fill={C.text} fontSize="11" textAnchor="middle">{label}</text>
    </g>
  );
};

/** Đun nóng vật (Q = mcΔt), dây đốt tỏa nhiệt (Q = I²Rt), đốt nhiên liệu (Q = qm), đổi thang nhiệt độ. */
const HeatScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const u = Math.min(1, (time % 5) / 4);
  const scaleConvert = values.F !== undefined || values.T !== undefined;
  const flame = 1 + 0.15 * Math.sin(time * 12);

  if (scaleConvert) {
    const t = values.t;
    return (
      <svg viewBox="0 0 560 150" className="formula-scene">
        <Thermometer x={200} temp={t} label={`${fmt(t)} °C`} />
        <Thermometer x={360} temp={t} label={values.F !== undefined ? `${fmt(values.F)} °F` : `${fmt(values.T)} K`} color="#f97316" />
        <text x="280" y="70" fill={C.text} fontSize="13" textAnchor="middle">=</text>
        <text x="16" y="18" fill={C.dim} fontSize="11">Cùng một nhiệt độ, đọc trên hai thang đo</text>
      </svg>
    );
  }

  const Q = values.Q;
  const dt = values.dt;
  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <path d="M 150 40 L 150 116 Q 150 124 158 124 L 262 124 Q 270 124 270 116 L 270 40" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <rect x="152" y="62" width="116" height="60" fill={`rgba(${Math.round(14 + 200 * u)},${Math.round(165 - 100 * u)},${Math.round(233 - 180 * u)},0.45)`} />
      {values.I !== undefined ? (
        <polyline points="170,110 180,96 190,110 200,96 210,110 220,96 230,110 240,96 250,110" fill="none" stroke={C.force} strokeWidth="3" opacity={0.5 + 0.5 * u} />
      ) : (
        <path d={`M 196 146 Q 186 ${146 - 16 * flame} 202 ${146 - 22 * flame} Q 206 ${146 - 12 * flame} 214 ${146 - 26 * flame} Q 230 ${146 - 12 * flame} 222 146 Z`} fill="#f97316" />
      )}
      {dt !== undefined && <Thermometer x={300} temp={20 + dt * u} label={`+${fmt(dt * u)} °C`} />}
      <text x="340" y="56" fill={C.ok} fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono, monospace">Q = {fmt(Q * u)} J</text>
      <rect x="340" y="66" width="190" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="340" y="66" width={190 * u} height="10" rx="5" fill={C.ok} />
      <text x="340" y="98" fill={C.text} fontSize="11">
        {values.I !== undefined ? `I = ${fmt(values.I)} A, R = ${fmt(values.R)} Ω, t = ${fmt(values.t)} s` : values.q !== undefined ? `Đốt ${fmt(values.m)} kg nhiên liệu, q = ${fmt(values.q)} MJ/kg` : `m = ${fmt(values.m)} kg, c = ${fmt(values.c)} J/(kg·K)`}
      </text>
    </svg>
  );
};

/** Cân bằng nhiệt: vật nóng thả vào chất lỏng lạnh, hai nhiệt kế tiến dần về cùng nhiệt độ t. */
const MixingScene: React.FC<SceneProps> = ({ values }) => {
  const time = useAnimationTime();
  const { t, t1, t2 } = values;
  const u = Math.min(1, (time % 6) / 4.5);
  const ease = 1 - Math.pow(1 - u, 3);
  const hot = t1 + (t - t1) * ease;
  const cold = t2 + (t - t2) * ease;
  const span = Math.max(Math.abs(t1), Math.abs(t2), 1);
  const toScale = (x: number) => (x / span) * 120 - 10;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <path d="M 210 40 L 210 120 Q 210 128 218 128 L 342 128 Q 350 128 350 120 L 350 40" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <rect x="212" y="60" width="136" height="66" fill="rgba(14,165,233,0.35)" />
      <circle cx="280" cy={36 + 62 * ease} r="14" fill={`rgb(${Math.round(239 - 120 * ease)},${Math.round(68 + 60 * ease)},${Math.round(68 + 100 * ease)})`} stroke="#fcd34d" />
      <Thermometer x={120} temp={toScale(hot)} label={`vật nóng ${fmt(hot)} °C`} />
      <Thermometer x={440} temp={toScale(cold)} label={`vật lạnh ${fmt(cold)} °C`} color={C.blue} />
      <text x="280" y="18" fill={C.ok} fontSize="13" fontWeight="bold" textAnchor="middle">Nhiệt độ cân bằng t = {fmt(t)} °C</text>
    </svg>
  );
};

/* ------------------------------------------------------------------
   Áp suất, chất lỏng
   Số liệu trải từ rất nhỏ đến rất lớn (0,1 cm² đến 10 m², vài Pa đến hàng triệu Pa)
   nên kích thước trên hình theo thang logarit.
------------------------------------------------------------------ */

const logScale = (x: number, lo: number, hi: number, outLo: number, outHi: number) => {
  const v = Math.log10(clamp(x, lo, hi));
  return outLo + ((v - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (outHi - outLo);
};

/** Chất lỏng theo trọng lượng riêng: dầu, nước, nước biển, thủy ngân. */
function liquidLook(d: number): { name: string; fill: string } {
  if (d >= 100000) return { name: 'thủy ngân', fill: 'rgba(148,163,184,0.55)' };
  if (d < 9500) return { name: 'dầu', fill: 'rgba(250,204,21,0.3)' };
  if (d > 10150) return { name: 'nước biển', fill: 'rgba(14,116,144,0.5)' };
  return { name: 'nước', fill: 'rgba(14,165,233,0.35)' };
}

/** Vật đè lên mặt đất: mặt tiếp xúc rộng theo S, mặt đất lún theo áp suất p. */
const PressureScene: React.FC<SceneProps> = ({ values }) => {
  const { p, F, S } = values;
  const t = useAnimationTime();
  const ease = Math.min(1, (t % 4) / 1.5); // vật hạ xuống rồi giữ yên, lặp lại
  const w = logScale(S, 0.1, 100000, 24, 230);
  // Lún tối đa 22 để nhãn diện tích bên dưới vẫn nằm trong khung hình cao 150
  const sink = logScale(p, 10, 10000000, 3, 22) * ease;
  const cx = 200, ground = 92;
  const top = ground + sink - 44;
  const arrows = Math.max(2, Math.round(w / 26));

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="pressArrow" color={C.force} /></defs>
      {/* Mặt đất bị lún dưới vật */}
      <path
        d={`M 20 ${ground} L ${cx - w / 2 - 14} ${ground} Q ${cx - w / 2} ${ground} ${cx - w / 2} ${ground + sink} L ${cx + w / 2} ${ground + sink} Q ${cx + w / 2} ${ground} ${cx + w / 2 + 14} ${ground} L 380 ${ground} L 380 146 L 20 146 Z`}
        fill="rgba(180,83,9,0.45)"
        stroke="#d97706"
        strokeWidth="2"
      />
      <rect x={cx - w / 2} y={top} width={w} height="44" rx="4" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x={cx} y={top + 27} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">{w > 70 ? `F = ${fmt(F)} N` : 'F'}</text>
      {/* Áp lực phân bố trên cả mặt tiếp xúc */}
      {Array.from({ length: arrows }, (_, k) => {
        const x = cx - w / 2 + ((k + 0.5) * w) / arrows;
        return <line key={k} x1={x} y1={top - 22} x2={x} y2={top - 3} stroke={C.force} strokeWidth="2.2" markerEnd="url(#pressArrow)" />;
      })}
      <line x1={cx - w / 2} y1={ground + sink + 8} x2={cx + w / 2} y2={ground + sink + 8} stroke={C.warn} strokeWidth="1.5" />
      <text x={cx} y={ground + sink + 22} fill={C.warn} fontSize="12" fontWeight="bold" textAnchor="middle">S = {fmt(S)} cm²</text>
      <text x="400" y="44" fill={C.ok} fontSize="15" fontWeight="bold">p = {fmt(p)} Pa</text>
      <text x="400" y="68" fill={C.text} fontSize="12">Áp lực F = {fmt(F)} N</text>
      <text x="400" y="88" fill={C.text} fontSize="12">Diện tích bị ép S = {fmt(S / 10000)} m²</text>
      <text x="400" y="112" fill={C.dim} fontSize="11">Mặt tiếp xúc càng nhỏ,</text>
      <text x="400" y="126" fill={C.dim} fontSize="11">vật lún càng sâu</text>
    </svg>
  );
};

/** Bình chất lỏng: điểm ở độ sâu h chịu áp suất p tác dụng theo mọi phương. */
const LiquidPressureScene: React.FC<SceneProps> = ({ values }) => {
  const { p, d, h } = values;
  const t = useAnimationTime();
  const look = liquidLook(d);
  const surface = 22, bottom = 140;
  // Độ sâu vẽ theo thang logarit để cả 10 cm lẫn hàng nghìn mét đều nằm trong bình
  const y = logScale(h, 0.01, 11000, surface + 8, bottom - 10);
  const len = logScale(p, 100, 200000000, 10, 30) * (0.9 + 0.1 * Math.sin(t * 3));
  const px = 200;

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="liqArrow" color={C.force} /></defs>
      <rect x="110" y={surface} width="180" height={bottom - surface} fill={look.fill} />
      <path d={`M 110 8 L 110 ${bottom} L 290 ${bottom} L 290 8`} fill="none" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="110" y1={surface} x2="290" y2={surface} stroke="#7dd3fc" strokeWidth="1.5" />
      <text x="116" y={surface - 4} fill={C.dim} fontSize="10">mặt thoáng</text>
      {/* Độ sâu h tính từ mặt thoáng */}
      <line x1="300" y1={surface} x2="300" y2={y} stroke={C.warn} strokeWidth="1.5" />
      <line x1="294" y1={surface} x2="306" y2={surface} stroke={C.warn} strokeWidth="1.5" />
      <line x1="294" y1={y} x2="306" y2={y} stroke={C.warn} strokeWidth="1.5" />
      <text x="310" y={(surface + y) / 2 + 4} fill={C.warn} fontSize="12" fontWeight="bold">h = {fmt(h)} m</text>
      <line x1={px} y1={y} x2="300" y2={y} stroke={C.dim} strokeDasharray="3 3" />
      {/* Áp suất tác dụng theo mọi phương */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <line key={a} x1={px + Math.cos(r) * (len + 6)} y1={y + Math.sin(r) * (len + 6)} x2={px + Math.cos(r) * 6} y2={y + Math.sin(r) * 6} stroke={C.force} strokeWidth="2" markerEnd="url(#liqArrow)" />
        );
      })}
      <circle cx={px} cy={y} r="4" fill="#f8fafc" />
      <text x="400" y="44" fill={C.ok} fontSize="15" fontWeight="bold">p = {fmt(p)} Pa</text>
      <text x="400" y="68" fill={C.text} fontSize="12">Chất lỏng: {look.name}</text>
      <text x="400" y="88" fill={C.text} fontSize="12">d = {fmt(d)} N/m³</text>
      <text x="400" y="112" fill={C.dim} fontSize="11">Càng xuống sâu,</text>
      <text x="400" y="126" fill={C.dim} fontSize="11">áp suất càng lớn</text>
    </svg>
  );
};

/** Vật chìm trong chất lỏng chịu lực đẩy Ác-si-mét hướng lên. */
const BuoyancyScene: React.FC<SceneProps> = ({ values }) => {
  const { FA, d, V } = values;
  const t = useAnimationTime();
  const look = liquidLook(d);
  const size = logScale(V, 1, 10000000, 16, 64);
  const cx = 200, cy = 92 + Math.sin(t * 1.6) * 2;
  const arrow = logScale(FA, 0.01, 100000, 18, 52);

  return (
    <svg viewBox="0 0 560 150" className="formula-scene">
      <defs><Arrow id="buoyArrow" color={C.ok} /></defs>
      <rect x="100" y="30" width="200" height="110" fill={look.fill} />
      <path d="M 100 10 L 100 140 L 300 140 L 300 10" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="100" y1="30" x2="300" y2="30" stroke="#7dd3fc" strokeWidth="1.5" />
      <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} rx="3" fill="#b45309" stroke="#fcd34d" strokeWidth="1.5" />
      <line x1={cx} y1={cy - size / 2 - 2} x2={cx} y2={cy - size / 2 - 2 - arrow} stroke={C.ok} strokeWidth="3" markerEnd="url(#buoyArrow)" />
      <text x={cx + 10} y={cy - size / 2 - arrow + 6} fill={C.ok} fontSize="12" fontWeight="bold">F_A</text>
      <text x={cx + size / 2 + 8} y={cy + 4} fill={C.warn} fontSize="11" fontWeight="bold">V = {fmt(V)} cm³</text>
      <text x="400" y="44" fill={C.ok} fontSize="15" fontWeight="bold">F_A = {fmt(FA)} N</text>
      <text x="400" y="68" fill={C.text} fontSize="12">Chất lỏng: {look.name}</text>
      <text x="400" y="88" fill={C.text} fontSize="12">d = {fmt(d)} N/m³</text>
      <text x="400" y="112" fill={C.dim} fontSize="11">Phần chìm càng lớn,</text>
      <text x="400" y="126" fill={C.dim} fontSize="11">lực đẩy càng lớn</text>
    </svg>
  );
};

/* ------------------------------------------------------------------
   Chọn hình theo công thức
------------------------------------------------------------------ */

export const FormulaScene: React.FC<{ scene?: SceneId; values: Values }> = ({ scene, values }) => {
  switch (scene) {
    case 'motion': return <MotionScene values={values} />;
    case 'push': return <PushScene values={values} />;
    case 'lens': return <LensScene values={values} />;
    case 'lens-diverging': return <LensScene values={values} diverging />;
    case 'echo': return <EchoScene values={values} />;
    case 'wave': return <WaveScene values={values} />;
    case 'lever': return <LeverScene values={values} />;
    case 'spring': return <SpringScene values={values} />;
    case 'hydraulic': return <HydraulicScene values={values} />;
    case 'incline': return <InclineScene values={values} />;
    case 'series': return <SeriesScene values={values} />;
    case 'parallel': return <ParallelScene values={values} />;
    case 'wire': return <WireScene values={values} />;
    case 'heat': return <HeatScene values={values} />;
    case 'mixing': return <MixingScene values={values} />;
    case 'pressure': return <PressureScene values={values} />;
    case 'liquid-pressure': return <LiquidPressureScene values={values} />;
    case 'buoyancy': return <BuoyancyScene values={values} />;
    default: return null;
  }
};
