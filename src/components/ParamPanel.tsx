import React from 'react';
import { ParamDef } from '../core/types';

interface ParamPanelProps {
  paramsDef: Record<string, ParamDef>;
  values: Record<string, number>;
  onChange: (key: string, val: number) => void;
}

export const ParamPanel: React.FC<ParamPanelProps> = ({ paramsDef, values, onChange }) => {
  return (
    <div className="sidebar-section param-section-wrapper">
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Điều Khiển Tham Số Thí Nghiệm
        </div>
      </div>

      <div className="param-controls-list">
        {Object.entries(paramsDef).map(([key, def]) => {
          const currentVal = values[key] ?? def.defaultVal;
          const step = def.step || 1;

          const handleStep = (delta: number) => {
            const nextVal = Math.min(def.max, Math.max(def.min, Number((currentVal + delta).toFixed(2))));
            onChange(key, nextVal);
          };

          return (
            <div key={key} className="form-row param-card">
              <div className="label-with-val">
                <span className="param-label-text">
                  <span className="param-symbol-badge">{def.symbol}</span>
                  <span className="param-title">{def.label}:</span>
                </span>
                <span className="val-display-pill">
                  {currentVal} <span className="val-unit">{def.unit}</span>
                </span>
              </div>

              <div className="slider-with-steppers">
                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => handleStep(-step)}
                  title="Giảm giá trị"
                >
                  −
                </button>

                <input
                  type="range"
                  className="modern-range-slider"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={currentVal}
                  onChange={(e) => onChange(key, parseFloat(e.target.value))}
                />

                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => handleStep(step)}
                  title="Tăng giá trị"
                >
                  +
                </button>
              </div>

              <div className="slider-limits">
                <span>{def.min} {def.unit}</span>
                <span>{def.max} {def.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
