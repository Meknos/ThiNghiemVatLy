import React from 'react';
import { OutputDef } from '../core/types';
import { FormulaView } from './FormulaView';

interface ResultPanelProps {
  outputsDef: OutputDef[];
  results: Record<string, number>;
  formulas: string[];
  conditions?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  outputsDef,
  results,
  formulas,
  conditions
}) => {
  return (
    <div className="result-panel-container">
      {/* KẾT QUẢ TÍNH ĐƯỢC */}
      <div className="sidebar-section results-section-card">
        <div className="section-title">Kết quả tính được</div>
        <div className="result-grid">
          {outputsDef.map((out) => {
            const val = results[out.symbol] ?? results[out.label] ?? 0;
            // Giá trị không tồn tại trong trường hợp đang xét (ví dụ góc khúc xạ khi phản xạ toàn phần)
            const displayVal = !Number.isFinite(val) ? '—' : Number.isInteger(val) ? val : Number(val.toFixed(2));
            return (
              <div key={out.symbol} className="result-metric-card">
                <div className="result-header-row">
                  <span className="result-symbol-chip">{out.symbol}</span>
                  <span className="result-label-name">{out.label}</span>
                </div>
                <div className="result-value-display">
                  <span className="metric-number">{displayVal}</span>
                  <span className="metric-unit">{out.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CÔNG THỨC SGK */}
      <div className="sidebar-section formula-section-card">
        <div className="section-title">Công thức</div>
        <div className="formula-box">
          {formulas.map((f, i) => (
            <div key={i} className="formula-item-card">
              <div className="formula-math">
                <FormulaView formula={f} displayMode={true} />
              </div>
            </div>
          ))}
          {conditions && (
            <div className="condition-note-box">
              <div className="condition-title">Lưu ý khi dùng công thức:</div>
              <p>{conditions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
