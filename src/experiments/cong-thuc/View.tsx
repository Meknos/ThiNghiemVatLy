import React, { useEffect, useState } from 'react';
import { ViewProps } from '../../core/types';
import { FormulaView } from '../../components/FormulaView';
import { useSvgDrag } from '../../core/anim';
import { FormulaDef, FormulaVar } from './formulas';
import { expressionLatex, fmt, fmtLatex, interpretSolution, relationPower, relationText, solveFormula, variablesOf } from './model';
import { FormulaScene } from './scenes';

type Values = Record<string, number>;

/** Số viết thường (không LaTeX): số rất nhỏ hoặc rất lớn viết dạng a·10ⁿ. */
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function fmtSci(x: number): string {
  const abs = Math.abs(x);
  if (abs === 0 || (abs >= 1e-3 && abs < 1e7) || !Number.isFinite(x)) return fmt(x);
  const e = Math.floor(Math.log10(abs));
  const mantissa = fmt(Number((x / Math.pow(10, e)).toPrecision(3)));
  return `${mantissa}·10${String(e).split('').map((c) => SUP[c]).join('')}`;
}

const unitSuffix = (unit: string) => (unit ? ` ${unit}` : '');
const withUnit = (v: FormulaVar, value: number) => `${fmtSci(value)}${unitSuffix(v.unit)}`;
/** Phần ghi thêm sau số liệu: giá trị SI khi thanh trượt không dùng đơn vị SI, và đơn vị thường gặp khác */
const altText = (v: FormulaVar, value: number) => {
  let out = '';
  if (v.scale && v.siUnit) out += ` = ${fmtSci(value * v.scale)} ${v.siUnit}`;
  if (v.alt && v.alt.unit !== v.siUnit) out += ` = ${fmtSci(value * v.alt.factor)} ${v.alt.unit}`;
  return out;
};
const unitLatex = (unit: string) => (unit ? `\\text{ ${unit}}` : '');

/* ------------------------------------------------------------------
   Đồ thị: đại lượng cần tìm phụ thuộc thế nào vào một đại lượng đã biết
------------------------------------------------------------------ */

const G = { x: 56, y: 196, w: 250, h: 150 };

const RelationGraph: React.FC<{
  def: FormulaDef;
  find: number;
  values: Values;
  xVar: FormulaVar;
  onChange: (key: string, value: number) => void;
}> = ({ def, find, values, xVar, onChange }) => {
  const sol = solveFormula(def, values, find);
  const current = values[xVar.key];
  // Đại lượng nhận cả giá trị âm (nhiệt độ, vị trí ảnh): xét quanh giá trị hiện tại
  const width = Math.max(Math.abs(current), xVar.step * 10);
  const lo = current > 0 ? Math.max(xVar.min, current * 0.2) : Math.max(xVar.min, current - width);
  const hi = Math.max(lo + xVar.step * 10, Math.min(xVar.max, current > 0 ? current * 2.2 : current + width));
  const yAt = (x: number) => solveFormula(def, { ...values, [xVar.key]: x }, find).values[sol.unknown.key];

  // Giới hạn trục tung quanh đáp số để đường tiệm cận (thấu kính, mạch song song) không đè bẹp đồ thị
  const answer = sol.values[sol.unknown.key];
  const cap = Math.max(Math.abs(answer) * 4, 1e-9);
  const points = Array.from({ length: 61 }, (_, k) => {
    const x = lo + ((hi - lo) * k) / 60;
    return { x, y: yAt(x) };
  }).filter((p) => Number.isFinite(p.y) && Math.abs(p.y) <= cap);
  const ys = points.map((p) => p.y);
  const yMax = Math.max(0, ...ys) * 1.08;
  const yMin = Math.min(0, ...ys) * 1.08;
  const yRange = yMax - yMin || 1;
  const px = (x: number) => G.x + ((x - lo) / (hi - lo)) * G.w;
  const py = (y: number) => G.y - ((y - yMin) / yRange) * G.h;
  const cx = px(Math.min(hi, Math.max(lo, current)));
  const cy = py(Math.max(yMin, Math.min(yMax, Number.isFinite(answer) ? answer : 0)));
  const zeroY = py(0);

  const drag = useSvgDrag(({ x }) => {
    const raw = lo + ((x - G.x) / G.w) * (hi - lo);
    const snapped = Math.round(raw / xVar.step) * xVar.step;
    onChange(xVar.key, Number(Math.max(xVar.min, Math.min(xVar.max, snapped)).toFixed(4)));
  });

  return (
    <svg viewBox="0 0 330 230" className="formula-graph">
      <line x1={G.x} y1={zeroY} x2={G.x + G.w + 10} y2={zeroY} stroke="#94a3b8" strokeWidth="1.3" />
      <line x1={G.x} y1={G.y} x2={G.x} y2={G.y - G.h - 10} stroke="#94a3b8" strokeWidth="1.3" />
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={G.x} y1={G.y - f * G.h} x2={G.x + G.w} y2={G.y - f * G.h} stroke="#1e293b" />
          <text x={G.x - 6} y={G.y - f * G.h + 4} fill="#94a3b8" fontSize="9.5" textAnchor="end">{fmtSci(yMin + yRange * f)}</text>
        </g>
      ))}
      <text x={G.x} y={G.y + 14} fill="#94a3b8" fontSize="9.5" textAnchor="middle">{fmt(lo)}</text>
      <text x={G.x + G.w} y={G.y + 14} fill="#94a3b8" fontSize="9.5" textAnchor="middle">{fmt(hi)}</text>
      <text x={G.x + G.w / 2} y={G.y + 28} fill="#cbd5e1" fontSize="11" textAnchor="middle">{xVar.symbol}{xVar.unit ? ` (${xVar.unit})` : ''}</text>
      <text x={G.x - 4} y={G.y - G.h - 16} fill="#cbd5e1" fontSize="11">{sol.unknown.symbol}{sol.unknown.unit ? ` (${sol.unknown.unit})` : ''}</text>

      <polyline points={points.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')} fill="none" stroke="#34d399" strokeWidth="2.2" />
      <line x1={cx} y1={zeroY} x2={cx} y2={cy} stroke="#facc15" strokeDasharray="3 3" />
      <line x1={G.x} y1={cy} x2={cx} y2={cy} stroke="#facc15" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r="6" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
      <rect x={G.x} y={G.y - G.h} width={G.w} height={G.h + 14} fill="transparent" {...drag} style={{ cursor: 'ew-resize', touchAction: 'none' }} />
    </svg>
  );
};

/* ------------------------------------------------------------------
   Màn hình chung cho mọi công thức
------------------------------------------------------------------ */

export const CongThucView: React.FC<ViewProps<Values> & { def: FormulaDef }> = ({ def, params, onParamChange }) => {
  const vars = variablesOf(def);
  const find = Math.min(vars.length, Math.max(1, Math.round(params.find || 1)));
  const sol = solveFormula(def, params, find);
  const { unknown, values } = sol;
  const known = vars.filter((v) => v.key !== unknown.key);
  const answer = values[unknown.key];

  // Thanh trượt của đại lượng cần tìm đi theo đáp số (trong khoảng thanh trượt cho phép),
  // để bảng tham số không hiện một con số cũ trái với lời giải
  const shown = Number(Math.max(unknown.min, Math.min(unknown.max, answer)).toPrecision(5));
  useEffect(() => {
    if (Number.isFinite(shown) && Math.abs(params[unknown.key] - shown) > 1e-9 * Math.max(1, Math.abs(shown))) {
      onParamChange(unknown.key, shown);
    }
  }, [shown, unknown.key, params, onParamChange]);

  // Lời giải nằm ở thẻ riêng để học sinh tự giải trước; mở thẻ thì hiện dần từng bước cho giáo viên dẫn dắt
  const [tab, setTab] = useState<'lab' | 'solution'>('lab');
  const [step, setStep] = useState(1);
  const [xKey, setXKey] = useState(known[0].key);
  const xVar = known.find((v) => v.key === xKey) ?? known[0];
  const xPower = relationPower(sol, xVar.key, find);
  const note = interpretSolution(sol);

  const symbolic = expressionLatex(sol, (v) => v.latex);
  // Thay số bằng đơn vị SI: đại lượng có thanh trượt không theo SI được đổi trước khi thay
  const numeric = expressionLatex(sol, (v) => fmtLatex(sol.si[v.key]));
  const answerSI = unknown.scale && unknown.siUnit ? ` = ${fmtLatex(sol.si[unknown.key], false)}${unitLatex(unknown.siUnit)}` : '';
  // Dạng tích tìm vế trái thì công thức gốc đã là lời giải; các dạng khác luôn viết lại biểu thức
  const showRearranged = find !== 1 || def.kind === 'sum' || def.kind === 'custom';

  const given = (
    <>
      {known.map((v) => (
        <div key={v.key} className="formula-given">
          <span>{v.label}</span>
          <b>{v.symbol} = {withUnit(v, values[v.key])}<i>{altText(v, values[v.key])}</i></b>
        </div>
      ))}
      <div className="formula-given is-ask"><span>Tìm {unknown.label.toLowerCase()}</span><b>{unknown.symbol} = ?</b></div>
    </>
  );

  const openSolution = () => {
    setStep(1);
    setTab('solution');
  };

  return (
    <div className="experiment-stage-card">
      <div className="stage-header">
        <h3>{def.title}</h3>
        <div className="stage-badges">
          <span className="badge-tag">Tìm {unknown.label.toLowerCase()}</span>
          {/* Đáp số chỉ hiện khi đã mở lời giải, để học sinh tự giải trước */}
          {tab === 'solution' && step >= 4 && <span className="badge-tag tag-success">{unknown.symbol} = {withUnit(unknown, answer)}</span>}
        </div>
      </div>

      <div className="stage-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'lab'} className={`stage-tab ${tab === 'lab' ? 'active' : ''}`} onClick={() => setTab('lab')}>
          Thí nghiệm
        </button>
        <button role="tab" aria-selected={tab === 'solution'} className={`stage-tab ${tab === 'solution' ? 'active' : ''}`} onClick={() => (tab === 'solution' ? undefined : openSolution())}>
          Lời giải
        </button>
      </div>

      {tab === 'lab' ? (
        <>
          <FormulaScene scene={def.scene} values={values} />

          <div className="formula-body">
            {/* ĐỀ BÀI: chỉ dữ kiện và đại lượng cần tìm, chưa có cách giải */}
            <div className="formula-solution">
              <div className="formula-step">
                <div className="formula-step-title">Đề bài</div>
                {given}
              </div>
              <div className="formula-step-actions">
                <button className="quick-pill active" onClick={openSolution}>Xem lời giải từng bước</button>
              </div>
            </div>

            {/* ĐỒ THỊ QUAN HỆ */}
            <div className="formula-graph-box">
              <div className="formula-graph-caption">
                <b>{unknown.label}</b> {relationText(xPower)} <b>{xVar.label.toLowerCase()}</b>
              </div>
              <RelationGraph def={def} find={find} values={values} xVar={xVar} onChange={(key, value) => onParamChange(key, value)} />
              {known.length > 1 && (
                <div className="formula-graph-pick">
                  <span>Xem theo:</span>
                  {known.map((v) => (
                    <button key={v.key} className={`quick-pill ${v.key === xVar.key ? 'active' : ''}`} onClick={() => setXKey(v.key)}>
                      {v.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* LỜI GIẢI TỪNG BƯỚC, chiếm cả khung để chiếu lên bảng */
        <div className="formula-solution formula-solution-full">
          <div className="formula-step">
            <div className="formula-step-title">1. Tóm tắt</div>
            {given}
          </div>

          {step >= 2 && (
            <div className="formula-step">
              <div className="formula-step-title">2. Công thức</div>
              <FormulaView formula={def.latex} displayMode />
              {showRearranged && <FormulaView formula={`\\Rightarrow\\; ${unknown.latex} = ${symbolic}`} displayMode />}
            </div>
          )}
          {step >= 3 && (
            <div className="formula-step">
              <div className="formula-step-title">3. Thay số</div>
              <FormulaView formula={`${unknown.latex} = ${numeric}`} displayMode />
            </div>
          )}
          {step >= 4 && (
            <div className="formula-step is-answer">
              <div className="formula-step-title">4. Đáp số</div>
              <FormulaView formula={`${unknown.latex}${answerSI} = ${fmtLatex(answer, false)}${unitLatex(unknown.unit)}`} displayMode />
              {unknown.alt && unknown.alt.unit !== unknown.siUnit && (
                <div className="formula-alt">{`= ${fmtSci(answer * unknown.alt.factor)} ${unknown.alt.unit}`}</div>
              )}
              {note && <div className="formula-note">{note}</div>}
            </div>
          )}

          <div className="formula-step-actions">
            {step < 4 && <button className="quick-pill active" onClick={() => setStep(step + 1)}>Bước tiếp theo</button>}
            {step < 4 && <button className="quick-pill" onClick={() => setStep(4)}>Hiện cả lời giải</button>}
            {step >= 4 && <button className="quick-pill" onClick={() => setStep(1)}>Giải lại từ đầu</button>}
            <button className="quick-pill" onClick={() => setTab('lab')}>Quay lại thí nghiệm</button>
          </div>
        </div>
      )}

      <div className="quick-orientation-bar">
        <span>Đại lượng cần tìm:</span>
        {vars.map((v, k) => (
          <button key={v.key} className={`quick-pill ${k + 1 === find ? 'active' : ''}`} onClick={() => onParamChange('find', k + 1)}>
            {v.label} ({v.symbol})
          </button>
        ))}
        <span className="stage-note">{tab === 'lab' ? 'Kéo điểm vàng trên đồ thị để đổi số liệu.' : 'Bấm "Bước tiếp theo" để hiện dần lời giải.'}</span>
      </div>
    </div>
  );
};
