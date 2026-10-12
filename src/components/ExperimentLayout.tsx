import React, { useState, useMemo } from 'react';
import { ExperimentTemplate } from '../core/types';
import { ParamPanel } from './ParamPanel';
import { ResultPanel } from './ResultPanel';
import { validateParams } from '../core/validate';

interface ExperimentLayoutProps {
  template: ExperimentTemplate<any>;
  onSelectExperiment: (id: string) => void;
  allTemplates: ExperimentTemplate<any>[];
  onGenerateFromContext: (prompt: string) => void;
}

export const ExperimentLayout: React.FC<ExperimentLayoutProps> = ({
  template,
  onSelectExperiment,
  allTemplates,
  onGenerateFromContext
}) => {
  // Initialise params with defaults
  const initialParams = useMemo(() => {
    const p: Record<string, number> = {};
    for (const [key, def] of Object.entries(template.params)) {
      p[key] = def.defaultVal;
    }
    return p;
  }, [template]);

  const [paramValues, setParamValues] = useState<Record<string, number>>(initialParams);
  const [contextPrompt, setContextPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'params' | 'results'>('params');

  // Compute outputs
  const validation = useMemo(() => {
    return validateParams(template.params, paramValues);
  }, [template, paramValues]);

  const computedOutputs = useMemo(() => {
    try {
      return template.compute(validation.cleanedParams);
    } catch {
      return {};
    }
  }, [template, validation.cleanedParams]);

  const handleParamChange = (key: any, val: number) => {
    setParamValues((prev) => ({
      ...prev,
      [String(key)]: val
    }));
  };

  const ViewComponent = template.View;

  return (
    <div className="app-workspace">
      {/* LEFT SIDEBAR: AI NGỮ CẢNH & DANH MỤC THÍ NGHIỆM */}
      <aside className="sidebar sidebar-left">
        {/* AI CONTEXT INPUT */}
        <section className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Nhập Ngữ Cảnh Hoặc Đề Bài
            </div>
            <span className="tag-ai">AI ENGINE</span>
          </div>

          <div className="context-input-container">
            <textarea
              className="context-textarea"
              rows={3}
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              placeholder="Nhập đề bài hoặc mô tả (ví dụ: Áp suất một viên gạch m=2kg đặt mặt 10cm2, hoặc Chiếu tia sáng với góc tới 45 độ, hoặc Mạch điện 2 đèn song song...)"
            />
            <div className="context-action-row">
              <button
                className="btn-generate"
                onClick={() => {
                  if (contextPrompt.trim()) onGenerateFromContext(contextPrompt);
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Tạo Thí Nghiệm Tự Động
              </button>
            </div>
          </div>
        </section>

        {/* DANH MỤC THÍ NGHIỆM KHTN THCS */}
        <section className="sidebar-section scrollable-section">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Thư Viện Thí Nghiệm (THCS)
            </div>
          </div>

          <div className="preset-list">
            {allTemplates.map((t) => (
              <div
                key={t.id}
                className={`preset-item ${t.id === template.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectExperiment(t.id);
                  // Reset params to defaults
                  const defaults: Record<string, number> = {};
                  for (const [k, d] of Object.entries(t.params)) {
                    defaults[k] = d.defaultVal;
                  }
                  setParamValues(defaults);
                }}
              >
                <div className="preset-title">
                  <span>{t.title}</span>
                  <span className="preset-category-tag">{t.group}</span>
                </div>
                <div className="preset-desc">{t.aiHint}</div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* CENTER VIEWPORT: INTERACTIVE SIMULATION */}
      <main className="canvas-main-area">
        <ViewComponent
          params={validation.cleanedParams}
          outputs={computedOutputs}
          onParamChange={handleParamChange}
        />
      </main>

      {/* RIGHT SIDEBAR: PARAMETERS, FORMULAS & RESULTS */}
      <aside className="sidebar sidebar-right">
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`}
            onClick={() => setActiveTab('params')}
          >
            Thông Số & Đo Đạc
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Công Thức & Kết Quả
          </button>
        </div>

        {activeTab === 'params' && (
          <div className="tab-pane active">
            <ParamPanel
              paramsDef={template.params}
              values={validation.cleanedParams}
              onChange={handleParamChange}
            />
          </div>
        )}

        {activeTab === 'results' && (
          <div className="tab-pane active">
            <ResultPanel
              outputsDef={template.outputs}
              results={computedOutputs}
              formulas={template.formulas}
              conditions={template.conditions}
            />
          </div>
        )}
      </aside>
    </div>
  );
};
