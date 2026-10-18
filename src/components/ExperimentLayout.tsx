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
  /** Đang chờ AI đọc đề */
  generating?: boolean;
  /** Tham số trích từ đề bài, ghi đè lên giá trị mặc định của mẫu. */
  presetParams?: Record<string, number>;
}

const GROUPS = ['Cơ học', 'Quang học', 'Điện học', 'Nhiệt học', 'Mở đầu & Đo lường'];

export const ExperimentLayout: React.FC<ExperimentLayoutProps> = ({
  template,
  onSelectExperiment,
  allTemplates,
  onGenerateFromContext,
  generating = false,
  presetParams
}) => {
  // Giá trị mặc định của mẫu, rồi đến các tham số trích từ đề bài (nếu có)
  const initialParams = useMemo(() => {
    const p: Record<string, number> = {};
    for (const [key, def] of Object.entries(template.params)) {
      p[key] = presetParams?.[key] ?? def.defaultVal;
    }
    return p;
  }, [template, presetParams]);

  // Mở thí nghiệm khác (hoặc nạp đề bài mới) thì bảng tham số quay về bộ giá trị ban đầu tương ứng
  const [store, setStore] = useState({ source: initialParams, values: initialParams });
  let paramValues = store.values;
  if (store.source !== initialParams) {
    paramValues = initialParams;
    setStore({ source: initialParams, values: initialParams });
  }
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
    setStore((prev) => ({
      source: prev.source,
      values: { ...prev.values, [String(key)]: val }
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
        {/* NHẬP ĐỀ BÀI ĐỂ AI DỰNG THÍ NGHIỆM */}
        <section className="sidebar-section ai-section-card">
          <label className="section-title" htmlFor="context-prompt">
            Nhập đề bài
          </label>
          <p className="section-hint">Gõ hoặc dán đề bài trong sách, máy sẽ tự mở thí nghiệm phù hợp.</p>

          <div className="context-input-container">
            <textarea
              id="context-prompt"
              className="context-textarea"
              rows={4}
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              placeholder="Ví dụ: Khối sắt 2 kg đặt trên mặt bàn, diện tích tiếp xúc 10 cm²"
            />

            <div className="context-action-row">
              <button
                className="btn-generate"
                disabled={generating}
                onClick={() => {
                  if (contextPrompt.trim()) onGenerateFromContext(contextPrompt);
                }}
              >
                {generating ? 'Đang đọc đề…' : 'Tạo thí nghiệm'}
              </button>
            </div>
          </div>
        </section>

        {/* DANH MỤC THÍ NGHIỆM KHTN THCS */}
        <section className="sidebar-section scrollable-section catalog-section">
          <div className="section-title">Hoặc chọn thí nghiệm có sẵn</div>

          <div className="catalog-select-row">
            <label>
              Lớp
              <select
                className="simple-select"
                value={gradeFilter ?? ''}
                onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Tất cả</option>
                {[6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </label>
            <label>
              Chủ đề
              <select
                className="simple-select"
                value={groupFilter ?? ''}
                onChange={(e) => setGroupFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                {GROUPS.map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="preset-list">
            {filteredTemplates.length === 0 && (
              <p className="preset-empty">Không có thí nghiệm nào khớp. Hãy chọn "Tất cả".</p>
            )}
            {filteredTemplates.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`preset-item ${t.id === template.id ? 'active' : ''}`}
                onClick={() => onSelectExperiment(t.id)}
                title={t.aiHint}
              >
                <span className="preset-name">{t.title}</span>
                <span className="preset-meta">
                  {t.grade ? `Lớp ${t.grade} · ` : ''}{t.group}
                </span>
              </button>
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
            Điều chỉnh
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Kết quả
          </button>
          <button
            className={`tab-btn ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            Câu hỏi
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
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Tải số liệu về máy (Excel/CSV)
              </button>
              <button
                className="btn-share-link"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.search = '';
                  url.searchParams.set('exp', template.id);
                  for (const [k, v] of Object.entries(validation.cleanedParams)) {
                    url.searchParams.set(k, String(v));
                  }
                  navigator.clipboard.writeText(url.toString());
                  alert('Đã sao chép đường liên kết. Dán (Ctrl + V) vào Zalo hoặc email để gửi cho người khác.');
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Sao chép liên kết để gửi
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
                <span className="learning-badge predict">Bước 1</span>
                <span className="learning-title">Dự đoán</span>
              </div>
              <p className="learning-q">Khi thay đổi số liệu đầu vào, kết quả sẽ tăng hay giảm?</p>
              <p className="learning-a">Cho học sinh ghi dự đoán vào phiếu học tập trước khi kéo thanh điều chỉnh.</p>
            </div>

            <div className="learning-card">
              <div className="learning-card-header">
                <span className="learning-badge observe">Bước 2</span>
                <span className="learning-title">Quan sát</span>
              </div>
              <p className="learning-q">Trên màn hình thí nghiệm xảy ra hiện tượng gì?</p>
              <p className="learning-a">Kéo thanh điều chỉnh, quan sát hình vẽ và đối chiếu với số liệu ở thẻ "Kết quả".</p>
            </div>

            <div className="learning-card">
              <div className="learning-card-header">
                <span className="learning-badge explain">Bước 3</span>
                <span className="learning-title">Kết luận</span>
              </div>
              <p className="learning-q">Rút ra được quy luật hay định luật nào?</p>
              <p className="learning-a">Dùng công thức trong thẻ "Kết quả" để giải thích hiện tượng vừa quan sát.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
