import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EXPERIMENT_REGISTRY, getExperimentById } from '../core/registry';
import { ExperimentLayout } from '../components/ExperimentLayout';
import { MissingDataForm } from '../components/MissingDataForm';
import { ExperimentRequestResult, partsOf, requestExperiment } from '../ai/client';
import { ProblemPart, resolvePartParams } from '../core/parts';
import { ParamDef } from '../core/types';

/** Một đề bài đã dựng: các câu hỏi, số liệu giáo viên tự chọn cho từng câu, câu đang mở. */
interface Problem {
  parts: ProblemPart[];
  chosen: Record<string, number>[];
  active: number;
}

/** "t = 30 s" theo cách viết số của Việt Nam */
function describeParam(def: ParamDef, value: number): string {
  return `${def.symbol} = ${String(Number(value.toPrecision(6))).replace('.', ',')}${def.unit ? ' ' + def.unit : ''}`;
}

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
    asks: string[];
    notes: string[];
    suggestion?: { id: string; title: string };
  } | null>(null);

  // Đề bài đang dựng (có thể nhiều câu) và đề đang chờ giáo viên bổ sung số liệu thiếu
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pendingParts, setPendingParts] = useState<ProblemPart[] | null>(null);
  // Số liệu hiện tại của từng câu (giáo viên có thể đã kéo thanh trượt); câu sau lấy kết quả từ đây
  const partValues = useRef<(Record<string, number> | undefined)[]>([]);
  const activePart = useRef(0);

  const handleValuesChange = useCallback((values: Record<string, number>) => {
    partValues.current[activePart.current] = values;
  }, []);

  const openPart = (parts: ProblemPart[], chosen: Record<string, number>[], index: number) => {
    activePart.current = index;
    openExperiment(parts[index].templateId, resolvePartParams(parts, partValues.current, index));
    setProblem({ parts, chosen, active: index });
  };

  /** Bắt đầu dựng đề: số liệu giáo viên chọn cho phần thiếu được ghép vào số liệu của từng câu. */
  const startProblem = (parts: ProblemPart[], chosen: Record<string, number>[]) => {
    const merged = parts.map((part, i) => ({ ...part, params: { ...part.params, ...chosen[i] } }));
    partValues.current = [];
    openPart(merged, chosen, 0);
  };

  // Giáo viên tự chọn thí nghiệm khác: thôi theo đề bài cũ
  const selectExperiment = (id: string) => {
    setProblem(null);
    openExperiment(id);
  };

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
    setPendingParts(null);
    setProblem(null);
    try {
      const res = await requestExperiment(prompt);
      const template = getExperimentById(res.templateId);

      // Đề ngoài danh mục: không dựng bừa, chỉ gợi ý thí nghiệm gần nhất
      const parts = partsOf(res);
      if (res.status === 'unsupported' || !template || parts.length === 0) {
        const suggested = res.suggestedTemplateId ? getExperimentById(res.suggestedTemplateId) : undefined;
        setAiNotice({
          source: res.source,
          unsupported: true,
          summary: res.summary,
          asks: [],
          notes: res.notes,
          suggestion: suggested ? { id: suggested.id, title: suggested.title } : undefined
        });
        return;
      }

      setAiNotice({ source: res.source, unsupported: false, summary: res.summary, asks: res.asks, notes: res.notes });
      // Đề thiếu số liệu: hỏi giáo viên trước (đã điền sẵn giá trị ngẫu nhiên); đủ rồi thì dựng ngay
      if (parts.some((part) => part.missing.length > 0)) setPendingParts(parts);
      else startProblem(parts, parts.map(() => ({})));
    } finally {
      setAiBusy(false);
    }
  };

  // Số liệu của câu đang mở, chia theo nguồn: đề cho, lấy từ câu trước, giáo viên tự chọn
  const partDetails = (() => {
    if (!problem) return null;
    const part = problem.parts[problem.active];
    const template = getExperimentById(part.templateId);
    if (!template) return null;
    const chosen = problem.chosen[problem.active] ?? {};
    const line = (key: string, value: number) => describeParam(template.params[key], value);
    return {
      given: Object.entries(part.params)
        .filter(([key]) => template.params[key] && key !== 'find' && chosen[key] === undefined)
        .map(([key, value]) => line(key, value)),
      linked: Object.entries(part.links)
        .filter(([key]) => session.params[key] !== undefined)
        .map(([key, link]) => `${line(key, session.params[key])} (kết quả câu ${link.from + 1})`),
      chosen: Object.entries(chosen).filter(([key]) => template.params[key]).map(([key, value]) => line(key, value))
    };
  })();

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
            <h1 className="app-title">AILab Studio</h1>
          </div>
        </div>

        {/* Ô chọn nhanh thí nghiệm */}
        <label className="header-center-selector">
          <span className="selector-label">Thí nghiệm:</span>
          <select
            className="header-dropdown-select"
            value={currentId}
            onChange={(e) => selectExperiment(e.target.value)}
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
            {aiNotice.asks.length > 0 && <div><b>Cần tìm:</b> {aiNotice.asks.join('; ')}</div>}
            {partDetails && partDetails.given.length > 0 && <div><b>Đã điền từ đề:</b> {partDetails.given.join('; ')}</div>}
            {partDetails && partDetails.linked.length > 0 && <div><b>Lấy từ câu trước:</b> {partDetails.linked.join('; ')}</div>}
            {partDetails && partDetails.chosen.length > 0 && (
              <div className="ai-notice-chosen"><b>Giá trị tự chọn (đề không cho):</b> {partDetails.chosen.join('; ')}. Kéo thanh trượt để đổi.</div>
            )}
            {aiNotice.suggestion && (
              <div>
                <button className="ai-suggest-button" onClick={() => { selectExperiment(aiNotice.suggestion!.id); setAiNotice(null); }}>
                  Mở thí nghiệm gần nhất: {aiNotice.suggestion.title}
                </button>
              </div>
            )}
            {aiNotice.notes.map((note, i) => <div key={i} className="ai-notice-note">{note}</div>)}
          </div>
          <button className="btn-close-notice" onClick={() => setAiNotice(null)} title="Đóng thông báo" aria-label="Đóng thông báo">✕</button>
        </div>
      )}

      {/* Đề nhiều câu: mỗi câu một thí nghiệm, bấm để chuyển */}
      {problem && problem.parts.length > 1 && (
        <nav className="problem-steps" aria-label="Các câu hỏi của đề bài">
          <span className="problem-steps-label">Đề có {problem.parts.length} câu:</span>
          {problem.parts.map((part, i) => (
            <button
              key={i}
              type="button"
              className={`problem-step ${i === problem.active ? 'active' : ''}`}
              aria-current={i === problem.active ? 'step' : undefined}
              onClick={() => openPart(problem.parts, problem.chosen, i)}
            >
              <span className="problem-step-number">{i + 1}</span>
              {part.title}
            </button>
          ))}
        </nav>
      )}

      {pendingParts && (
        <MissingDataForm
          parts={pendingParts}
          onCancel={() => setPendingParts(null)}
          onConfirm={(chosen) => {
            startProblem(pendingParts, chosen);
            setPendingParts(null);
          }}
        />
      )}

      {/* MAIN WORKSPACE LAYOUT */}
      <ExperimentLayout
        template={currentTemplate}
        presetParams={session.params}
        onSelectExperiment={selectExperiment}
        onValuesChange={handleValuesChange}
        allTemplates={EXPERIMENT_REGISTRY}
        onGenerateFromContext={handleGenerate}
        generating={aiBusy}
      />
    </div>
  );
};
