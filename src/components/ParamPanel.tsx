import React from 'react';
import { ParamDef } from '../core/types';

interface ParamPanelProps {
  paramsDef: Record<string, ParamDef>;
  values: Record<string, number>;
  onChange: (key: string, val: number) => void;
}

export const ParamPanel: React.FC<ParamPanelProps> = ({ paramsDef, values, onChange }) => {
  return (
    <div className="sidebar-section">
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Tham Số Thí Nghiệm
        </div>
      </div>

      <div className="param-controls">
        {Object.entries(paramsDef).map(([key, def]) => {
          const currentVal = values[key] ?? def.defaultVal;
          return (
            <div key={key} className="form-row">
              <div className="label-with-val">
                <span>
                  <strong>{def.symbol}</strong> ({def.label}):
                </span>
                <span className="val-display">
                  {currentVal} {def.unit}
                </span>
              </div>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={currentVal}
                onChange={(e) => onChange(key, parseFloat(e.target.value))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
