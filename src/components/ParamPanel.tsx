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
      <p className="section-hint">Kéo thanh trượt hoặc bấm nút − / + để thay đổi số liệu.</p>

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
                  <span className="param-title">{def.label}</span>
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
                  aria-label={`Giảm ${def.label}`}
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
                  aria-label={def.label}
                />

                <button
                  type="button"
                  className="btn-stepper"
                  onClick={() => handleStep(step)}
                  title="Tăng giá trị"
                  aria-label={`Tăng ${def.label}`}
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
