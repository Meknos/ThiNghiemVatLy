import { describe, it, expect } from 'vitest';
import cases from './cases.json';
import { dispatchContextToTemplate } from '../../src/ai/dispatcher';

describe('Đánh giá AI trích chọn mẫu trên 30 đề SGK THCS (M7 Benchmark)', () => {
  it('đạt độ chính xác chọn đúng mẫu ≥ 90% trên 30 đề', () => {
    let correctCount = 0;

    for (const item of cases) {
      const res = dispatchContextToTemplate(item.prompt);
      if (res.templateId === item.expectedTemplate) {
        correctCount++;
      }
    }

    const accuracy = (correctCount / cases.length) * 100;
    console.log(`Kết quả đánh giá 30 đề: ${correctCount}/${cases.length} (${accuracy.toFixed(1)}%)`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
