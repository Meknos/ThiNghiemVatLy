import React, { useState, useEffect } from 'react';
import { EXPERIMENT_REGISTRY, getExperimentById } from '../core/registry';
import { ExperimentLayout } from '../components/ExperimentLayout';
import { dispatchContextToTemplate } from '../ai/dispatcher';

export const App: React.FC = () => {
  // Sync with URL query param if present
  const [currentId, setCurrentId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const expParam = params.get('exp');
    if (expParam && getExperimentById(expParam)) return expParam;
    return 'ap-suat-chat-ran';
  });

  const [projectorMode, setProjectorMode] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.toggle('projector-mode', projectorMode);
  }, [projectorMode]);

  const currentTemplate = getExperimentById(currentId) || EXPERIMENT_REGISTRY[0];

  const handleGenerate = (prompt: string) => {
    const res = dispatchContextToTemplate(prompt);
    setCurrentId(res.templateId);
    setAiNotice(res.message);
    setTimeout(() => setAiNotice(null), 5000);
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
            <div className="app-title-row">
              <h1 className="app-title">AIPLab Studio</h1>
              <span className="app-version-badge">KHTN THCS</span>
            </div>
            <p className="app-subtitle">Phòng Thí Nghiệm Vật Lý Tương Tác Trực Quan</p>
          </div>
        </div>

        {/* ELEGANT QUICK EXPERIMENT SELECTOR DROPDOWN */}
        <div className="header-center-selector">
          <div className="selector-label">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Thí nghiệm đang mở:</span>
          </div>
          <select
            className="header-dropdown-select"
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
          >
            {EXPERIMENT_REGISTRY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.grade ? `[Lớp ${t.grade}] ` : ''}{t.title} ({t.group})
              </option>
            ))}
          </select>
        </div>

        {/* HEADER CONTROLS (PROJECTOR, GRADE BADGE, HELP) */}
        <div className="header-right">
          <button
            className={`ctrl-btn ${projectorMode ? 'btn-projector-active' : 'btn-secondary'}`}
            onClick={() => setProjectorMode(!projectorMode)}
            title="Chuyển đổi giao diện sáng cho máy chiếu lớp học"
          >
            <span className="icon-indicator">{projectorMode ? '☀️' : '🌙'}</span>
            <span>{projectorMode ? 'Chế độ Máy Chiếu' : 'Chế độ Phòng Lab'}</span>
          </button>

          <div className="env-badge" title="Chủ đề và khối lớp">
            <span className="badge-dot" />
            <span>{currentTemplate.group} {currentTemplate.grade ? `(Lớp ${currentTemplate.grade})` : ''}</span>
          </div>
        </div>
      </header>

      {/* AI STATUS NOTIFICATION BANNER */}
      {aiNotice && (
        <div className="ai-notice-banner">
          <span className="ai-icon">✨</span>
          <span>{aiNotice}</span>
          <button className="btn-close-notice" onClick={() => setAiNotice(null)}>✕</button>
        </div>
      )}

      {/* MAIN WORKSPACE LAYOUT */}
      <ExperimentLayout
        template={currentTemplate}
        onSelectExperiment={(id) => setCurrentId(id)}
        allTemplates={EXPERIMENT_REGISTRY}
        onGenerateFromContext={handleGenerate}
      />
    </div>
  );
};
