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

const SAMPLE_PROMPTS = [
  { label: '🧱 Áp suất gạch 2kg (10cm²)', prompt: 'Khối sắt m = 2kg đặt trên đệm xốp với diện tích tiếp xúc 10cm2' },
  { label: '🌊 Vật nổi 500cm³ trong nước', prompt: 'Nhúng một vật có thể tích 500cm3 vào trong nước, tính lực đẩy Ác-si-mét' },
  { label: '🔦 Phản xạ góc 45°', prompt: 'Chiếu tia sáng tới gương phẳng với góc tới i = 45 độ, tính góc phản xạ' },
  { label: '💡 Mạch 2 đèn song song', prompt: 'Mắc 2 bóng đèn song song vào nguồn điện 12V' },
  { label: '⚡ Khảo sát định luật Ôm', prompt: 'Đoạn mạch có hiệu điện thế U = 12V và điện trở R = 6 ôm theo định luật Ôm' },
  { label: '⚖️ Đòn bẩy cân bằng', prompt: 'Khảo sát điều kiện cân bằng của đòn bẩy quanh điểm tựa' }
];

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
  const [activeTab, setActiveTab] = useState<'params' | 'results' | 'learning'>('params');

  // Filter state for catalog
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

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

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      if (gradeFilter !== null && t.grade !== gradeFilter) return false;
      if (groupFilter !== null && t.group !== groupFilter) return false;
      return true;
    });
  }, [allTemplates, gradeFilter, groupFilter]);

  const ViewComponent = template.View;

  return (
    <div className="app-workspace">
      {/* LEFT SIDEBAR: AI NGỮ CẢNH & DANH MỤC THÍ NGHIỆM */}
      <aside className="sidebar sidebar-left">
        {/* AI CONTEXT INPUT */}
        <section className="sidebar-section ai-section-card">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              AI Trích Xuất & Tạo Thí Nghiệm
            </div>
            <span className="tag-ai">AI ENGINE</span>
          </div>

          <div className="context-input-container">
            <textarea
              className="context-textarea"
              rows={3}
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              placeholder="Nhập đề bài hoặc hiện tượng SGK (ví dụ: 'Khối sắt 2kg đặt mặt 10cm2', 'Chiếu tia sáng góc 30 độ', 'Mạch 2 đèn song song')..."
            />

            {/* Quick Sample Prompts */}
            <div className="sample-prompts-row">
              <span className="sample-hint">Gợi ý nhanh:</span>
              <div className="sample-chips">
                {SAMPLE_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-chip"
                    onClick={() => {
                      setContextPrompt(sp.prompt);
                      onGenerateFromContext(sp.prompt);
                    }}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="context-action-row">
              <button
                className="btn-generate"
                onClick={() => {
                  if (contextPrompt.trim()) onGenerateFromContext(contextPrompt);
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Tạo Thí Nghiệm Ngay
              </button>
            </div>
          </div>
        </section>

        {/* DANH MỤC THÍ NGHIỆM KHTN THCS */}
        <section className="sidebar-section scrollable-section catalog-section">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Thư Viện Thí Nghiệm ({filteredTemplates.length})
            </div>
          </div>

          {/* Grade Filter Pills */}
          <div className="catalog-filters">
            <div className="filter-group">
              <button
                className={`filter-pill ${gradeFilter === null ? 'active' : ''}`}
                onClick={() => setGradeFilter(null)}
              >
                Tất cả
              </button>
              {[6, 7, 8, 9].map((g) => (
                <button
                  key={g}
                  className={`filter-pill ${gradeFilter === g ? 'active' : ''}`}
                  onClick={() => setGradeFilter(gradeFilter === g ? null : g)}
                >
                  Lớp {g}
                </button>
              ))}
            </div>

            {/* Group Filter */}
            <div className="filter-group group-pills">
              {['Cơ học', 'Quang học', 'Điện học', 'Mở đầu & Đo lường'].map((grp) => (
                <button
                  key={grp}
                  className={`filter-pill-small ${groupFilter === grp ? 'active' : ''}`}
                  onClick={() => setGroupFilter(groupFilter === grp ? null : grp)}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="preset-list">
            {filteredTemplates.map((t) => (
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
                  <div className="preset-badge-group">
                    {t.grade && <span className="grade-badge">Lớp {t.grade}</span>}
                    <span className="preset-category-tag">{t.group}</span>
                  </div>
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
            Thông Số
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Công Thức
          </button>
          <button
            className={`tab-btn ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            Câu Hỏi SGK
          </button>
        </div>

        {activeTab === 'params' && (
          <div className="tab-pane active">
            <ParamPanel
              paramsDef={template.params}
              values={validation.cleanedParams}
              onChange={handleParamChange}
            />

            {/* ACTION BUTTONS (CSV EXPORT & SHARE) */}
            <div className="sidebar-actions-panel">
              <button
                className="btn-export-csv"
                onClick={() => {
                  const headers = Object.keys(template.params).concat(template.outputs.map(o => o.symbol));
                  const values = Object.values(validation.cleanedParams).concat(template.outputs.map(o => computedOutputs[o.symbol] ?? ''));
                  const csv = `${headers.join(',')}\n${values.join(',')}`;
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AIPLab_${template.id}_data.csv`;
                  a.click();
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Xuất Dữ Liệu Thực Nghiệm (CSV)
              </button>
              <button
                className="btn-share-link"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('exp', template.id);
                  navigator.clipboard.writeText(url.toString());
                  alert('Đã sao chép liên kết thí nghiệm vào Clipboard để chia sẻ bài giảng!');
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Sao Chép Liên Kết Thí Nghiệm
              </button>
            </div>
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

        {activeTab === 'learning' && (
          <div className="tab-pane active learning-pane">
            <div className="learning-card">
              <div className="learning-card-header">
                <span className="learning-badge predict">BƯỚC 1</span>
                <span className="learning-title">Dự Đoán (Predict)</span>
              </div>
              <p className="learning-q">Khi thay đổi đại lượng đầu vào, các đại lượng đầu ra sẽ biến đổi theo chiều hướng nào?</p>
              <p className="learning-a">💡 Hãy ghi nhận dự đoán của học sinh vào phiếu học tập trước khi kéo thanh trượt mô phỏng.</p>
            </div>

            <div className="learning-card">
              <div className="learning-card-header">
                <span className="learning-badge observe">BƯỚC 2</span>
                <span className="learning-title">Quan Sát (Observe)</span>
              </div>
              <p className="learning-q">Hiện tượng vật lý nào xuất hiện trực tiếp trên màn hình thí nghiệm ảo?</p>
              <p className="learning-a">🔍 Quan sát sự thay đổi tỉ lệ thuận / nghịch và kiểm chứng số liệu đo đạc hiển thị ở bảng kết quả.</p>
            </div>

            <div className="learning-card">
              <div className="learning-card-header">
                <span className="learning-badge explain">BƯỚC 3</span>
                <span className="learning-title">Kết Luận (Explain)</span>
              </div>
              <p className="learning-q">Quy tắc và định luật vật lý rút ra từ thí nghiệm là gì?</p>
              <p className="learning-a">🎯 Áp dụng công thức SGK tại tab "Công Thức" để giải thích chính xác bản chất hiện tượng.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
