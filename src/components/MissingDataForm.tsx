import React, { useEffect, useState } from 'react';
import { ProblemPart, suggestValue } from '../core/parts';
import { getExperimentById } from '../core/registry';
import { ParamDef } from '../core/types';

interface MissingDataFormProps {
  parts: ProblemPart[];
  /** Giáo viên bấm "Dựng thí nghiệm": giá trị đã chọn cho từng câu */
  onConfirm: (chosen: Record<string, number>[]) => void;
  onCancel: () => void;
}

type Draft = Record<string, string>[];

const toText = (x: number) => String(x).replace('.', ',');
const parse = (s: string) => Number(s.trim().replace(/\s/g, '').replace(',', '.'));

/** Gợi ý ngẫu nhiên cho mọi số liệu còn thiếu của mọi câu. */
function randomDraft(parts: ProblemPart[]): Draft {
  return parts.map((part) => {
    const template = getExperimentById(part.templateId);
    const out: Record<string, string> = {};
    for (const key of part.missing) {
      const def = template?.params[key] as ParamDef | undefined;
      if (def) out[key] = toText(suggestValue(def));
    }
    return out;
  });
}

/**
 * Đề bài không cho đủ số liệu: hiện các ô nhập đã điền sẵn giá trị ngẫu nhiên hợp lý,
 * giáo viên sửa hoặc giữ nguyên rồi mới dựng thí nghiệm.
 */
export const MissingDataForm: React.FC<MissingDataFormProps> = ({ parts, onConfirm, onCancel }) => {
  const [draft, setDraft] = useState<Draft>(() => randomDraft(parts));
  const many = parts.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Kiểm tra từng ô: phải là số và nằm trong khoảng của thanh trượt
  const errors: Record<string, string> = {};
  parts.forEach((part, i) => {
    const template = getExperimentById(part.templateId);
    for (const key of part.missing) {
      const def = template?.params[key] as ParamDef | undefined;
      if (!def) continue;
      const value = parse(draft[i]?.[key] ?? '');
      if (!Number.isFinite(value)) errors[`${i}.${key}`] = 'Hãy nhập một số.';
      else if (value < def.min || value > def.max) errors[`${i}.${key}`] = `Chỉ nhận từ ${toText(def.min)} đến ${toText(def.max)}.`;
    }
  });
  const valid = Object.keys(errors).length === 0;

  const confirm = () => {
    if (!valid) return;
    onConfirm(draft.map((values) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, parse(v)]))));
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <form
        className="missing-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="missing-form-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          confirm();
        }}
      >
        <h2 id="missing-form-title" className="missing-form-title">Đề bài chưa cho đủ số liệu</h2>
        <p className="missing-form-hint">
          Máy đã chọn sẵn <b>giá trị ngẫu nhiên</b> cho các số liệu dưới đây. Bạn có thể sửa lại cho đúng ý
          rồi bấm "Dựng thí nghiệm". Sau khi dựng vẫn chỉnh được bằng thanh trượt.
        </p>

        <div className="missing-form-list">
          {parts.map((part, i) => {
            if (part.missing.length === 0) return null;
            const template = getExperimentById(part.templateId);
            return (
              <fieldset key={i} className="missing-form-part">
                {many && <legend>Câu {i + 1}: {part.title}</legend>}
                {part.missing.map((key) => {
                  const def = template?.params[key] as ParamDef | undefined;
                  if (!def) return null;
                  const id = `missing-${i}-${key}`;
                  const error = errors[`${i}.${key}`];
                  return (
                    <div key={key} className="missing-form-row">
                      <label htmlFor={id} className="missing-form-label">
                        <span className="param-symbol-badge">{def.symbol}</span>
                        {def.label}
                      </label>
                      <div className="missing-form-input">
                        <input
                          id={id}
                          type="text"
                          inputMode="decimal"
                          value={draft[i]?.[key] ?? ''}
                          aria-invalid={!!error}
                          onChange={(e) => {
                            const text = e.target.value;
                            setDraft((prev) => prev.map((values, k) => (k === i ? { ...values, [key]: text } : values)));
                          }}
                        />
                        <span className="val-unit">{def.unit}</span>
                      </div>
                      <div className={`missing-form-range ${error ? 'is-error' : ''}`}>
                        {error ?? `Từ ${toText(def.min)} đến ${toText(def.max)} ${def.unit}`}
                      </div>
                    </div>
                  );
                })}
              </fieldset>
            );
          })}
        </div>

        <div className="missing-form-actions">
          <button type="button" className="btn-plain" onClick={() => setDraft(randomDraft(parts))}>
            Chọn ngẫu nhiên lại
          </button>
          <button type="button" className="btn-plain" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn-generate" disabled={!valid}>
            Dựng thí nghiệm
          </button>
        </div>
      </form>
    </div>
  );
};
