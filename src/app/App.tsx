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
            <h1 className="app-title">AIPLab Studio (THCS)</h1>
            <p className="app-subtitle">Mô Phỏng Thí Nghiệm & Bám Sát SGK Khoa Học Tự Nhiên</p>
          </div>
        </div>

        {/* QUICK EXPERIMENT SELECTOR TABS IN HEADER */}
        <div className="playback-controls">
          {EXPERIMENT_REGISTRY.map((t) => (
            <button
              key={t.id}
              className={`ctrl-btn ${t.id === currentId ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentId(t.id)}
            >
              <span>{t.title.split('&')[0].trim()}</span>
            </button>
          ))}
        </div>

        <div className="header-right">
          <button
            className={`ctrl-btn ${projectorMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => setProjectorMode(!projectorMode)}
            title="Chuyển đổi giao diện sáng cho máy chiếu lớp học"
          >
            {projectorMode ? '☀️ Máy Chiếu (Bật)' : '🌙 Phòng Lab (Tối)'}
          </button>
          <div className="env-badge" title="Chủ đề thí nghiệm hiện tại">
            <span className="badge-dot" />
            <span>{currentTemplate.group} (Lớp {currentTemplate.grade ?? '6-9'})</span>
          </div>
        </div>
      </header>

      {/* AI STATUS NOTIFICATION BANNER */}
      {aiNotice && (
        <div className="ai-notice-banner">
          <span className="ai-icon">✨</span>
          <span>{aiNotice}</span>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <ExperimentLayout
        template={currentTemplate}
        onSelectExperiment={(id) => setCurrentId(id)}
        allTemplates={EXPERIMENT_REGISTRY}
        onGenerateFromContext={handleGenerate}
      />
    </div>
  );
};
