import React, { useState, useEffect } from 'react';
import { EXPERIMENT_REGISTRY, getExperimentById } from '../core/registry';
import { ExperimentLayout } from '../components/ExperimentLayout';
import { ExperimentRequestResult, requestExperiment } from '../ai/client';

export const App: React.FC = () => {
  // Sync with URL query param if present
  const [currentId, setCurrentId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const expParam = params.get('exp');
    if (expParam && getExperimentById(expParam)) return expParam;
    return 'ap-suat-chat-ran';
  });

  // Tham số nạp sẵn cho thí nghiệm: từ liên kết chia sẻ hoặc trích từ đề bài.
  // Mỗi lần mở một thí nghiệm là một đối tượng mới, nhờ đó bảng tham số được đặt lại.
  const [session, setSession] = useState<{ params: Record<string, number> }>(() => {
    const params: Record<string, number> = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      const num = Number(value);
      if (key !== 'exp' && value !== '' && Number.isFinite(num)) params[key] = num;
    });
    return { params };
  });

  const openExperiment = (id: string, params: Record<string, number> = {}) => {
    setCurrentId(id);
    setSession({ params });
  };

  // Chữ to: ghi nhớ trên máy để lần sau mở lại vẫn giữ cỡ chữ đã chọn
  const [largeText, setLargeText] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aiplab-large-text') === '1';
    } catch {
      return false;
    }
  });
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<{
    source: ExperimentRequestResult['source'];
    unsupported: boolean;
    summary: string;
    filled: string[];
    asks: string[];
    notes: string[];
    suggestion?: { id: string; title: string };
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    try {
      localStorage.setItem('aiplab-large-text', largeText ? '1' : '0');
    } catch {
      // trình duyệt chặn lưu trữ: chỉ áp dụng cho lần mở này
    }
  }, [largeText]);

  const currentTemplate = getExperimentById(currentId) || EXPERIMENT_REGISTRY[0];

  const handleGenerate = async (prompt: string) => {
    if (aiBusy) return;
    setAiBusy(true);
    setAiNotice(null);
    try {
      const res = await requestExperiment(prompt);
      const template = getExperimentById(res.templateId);

      // Đề ngoài danh mục: không dựng bừa, chỉ gợi ý thí nghiệm gần nhất
      if (res.status === 'unsupported' || !template) {
        const suggested = res.suggestedTemplateId ? getExperimentById(res.suggestedTemplateId) : undefined;
        setAiNotice({
          source: res.source,
          unsupported: true,
          summary: res.summary,
          filled: [],
          asks: [],
          notes: res.notes,
          suggestion: suggested ? { id: suggested.id, title: suggested.title } : undefined
        });
        return;
      }

      openExperiment(template.id, res.params);
      // Cho giáo viên thấy những số liệu đã lấy từ đề bài để kiểm tra lại
      const filled = Object.entries(res.params)
        .filter(([key]) => template.params[key])
        .map(([key, value]) => {
          const def = template.params[key];
          return `${def.symbol} = ${String(value).replace('.', ',')}${def.unit ? ' ' + def.unit : ''}`;
        });
      setAiNotice({ source: res.source, unsupported: false, summary: res.summary, filled, asks: res.asks, notes: res.notes });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="app-root">
      {/* APP HEADER */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <svg viewBox="0 0 24 24" className="logo-svg">
              <circle cx="12" cy="12" r="3.2" fill="#38bdf8"/>
              <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(30 12 12)" fill="none" stroke="#38bdf8" strokeWidth="1.8"/>
              <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-30 12 12)" fill="none" stroke="#818cf8" strokeWidth="1.8"/>
            </svg>
          </div>
          <div className="app-title-group">
            <h1 className="app-title">AIPLab Studio</h1>
          </div>
        </div>

        {/* Ô chọn nhanh thí nghiệm */}
        <label className="header-center-selector">
          <span className="selector-label">Thí nghiệm:</span>
          <select
            className="header-dropdown-select"
            value={currentId}
            onChange={(e) => openExperiment(e.target.value)}
          >
            {EXPERIMENT_REGISTRY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.grade ? `Lớp ${t.grade} – ` : ''}{t.title}
              </option>
            ))}
          </select>
        </label>

        <div className="header-right">
          <button
            type="button"
            className={`btn-text-size ${largeText ? 'is-on' : ''}`}
            onClick={() => setLargeText(!largeText)}
            aria-pressed={largeText}
            title="Phóng to hoặc thu nhỏ chữ trên toàn trang"
          >
            <span className="btn-text-size-icon">A+</span>
            <span className="btn-text-size-label">{largeText ? 'Chữ thường' : 'Chữ to'}</span>
          </button>
        </div>
      </header>

      {/* Đang chờ AI đọc đề: báo rõ để giáo viên không tưởng là máy không phản hồi */}
      {aiBusy && (
        <div className="ai-notice-banner ai-busy-banner" role="status">
          <span className="ai-busy-spinner" aria-hidden="true" />
          <div className="ai-notice-body">
            <div><b>Đang đọc đề bài…</b> Máy đang chọn thí nghiệm và lấy số liệu, thường mất 10–30 giây.</div>
          </div>
        </div>
      )}

      {/* AI STATUS NOTIFICATION BANNER */}
      {aiNotice && (
        <div className={`ai-notice-banner ${aiNotice.unsupported ? 'is-unsupported' : ''}`}>
          <span className={`ai-source-tag ${aiNotice.source === 'ai' ? 'is-ai' : ''}`}>
            {aiNotice.source === 'ai' ? 'AI đã đọc đề' : 'Dò từ khóa'}
          </span>
          <div className="ai-notice-body">
            <div>{aiNotice.unsupported ? `Chưa mô phỏng được: ${aiNotice.summary}` : aiNotice.summary}</div>
            {aiNotice.filled.length > 0 && <div><b>Đã điền từ đề:</b> {aiNotice.filled.join('; ')}</div>}
            {aiNotice.asks.length > 0 && <div><b>Cần tìm:</b> {aiNotice.asks.join('; ')}</div>}
            {aiNotice.suggestion && (
              <div>
                <button className="ai-suggest-button" onClick={() => { openExperiment(aiNotice.suggestion!.id); setAiNotice(null); }}>
                  Mở thí nghiệm gần nhất: {aiNotice.suggestion.title}
                </button>
              </div>
            )}
            {aiNotice.notes.map((note, i) => <div key={i} className="ai-notice-note">{note}</div>)}
          </div>
          <button className="btn-close-notice" onClick={() => setAiNotice(null)} title="Đóng thông báo" aria-label="Đóng thông báo">✕</button>
        </div>
      )}

      {/* MAIN WORKSPACE LAYOUT */}
      <ExperimentLayout
        template={currentTemplate}
        presetParams={session.params}
        onSelectExperiment={(id) => openExperiment(id)}
        allTemplates={EXPERIMENT_REGISTRY}
        onGenerateFromContext={handleGenerate}
        generating={aiBusy}
      />
    </div>
  );
};
