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
      {/* CÔNG THỨC */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Công Thức SGK Áp Dụng
          </div>
        </div>
        <div className="formula-box">
          {formulas.map((f, i) => (
            <div key={i} className="formula-item">
              <FormulaView formula={f} displayMode={true} />
            </div>
          ))}
          {conditions && (
            <div className="condition-note">
              <strong>Điều kiện:</strong> {conditions}
            </div>
          )}
        </div>
      </div>

      {/* KẾT QUẢ ĐO ĐẠC / TÍNH TOÁN */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Kết Quả Đại Lượng Vật Lý
          </div>
        </div>
        <div className="result-grid">
          {outputsDef.map((out) => {
            const val = results[out.symbol] ?? results[out.label] ?? 0;
            const displayVal = Number.isInteger(val) ? val : Number(val.toFixed(2));
            return (
              <div key={out.symbol} className="result-card">
                <div className="result-label">
                  {out.label} ({out.symbol})
                </div>
                <div className="result-value">
                  {displayVal}{' '}
                  <span className="result-unit">{out.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
