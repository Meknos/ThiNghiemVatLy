import { describe, it, expect } from 'vitest';
import { computeMachDien } from './model';

describe('Thí nghiệm Mạch điện đơn giản', () => {
  it('công tắc mở => mạch hở, đèn không sáng', () => {
    const res = computeMachDien({ voltage: 6, switchClosed: 0, topology: 1, wireBroken: 0 });
    expect(res.isClosed).toBe(0);
    expect(res.bulb1Lit).toBe(0);
    expect(res.currentEst).toBe(0);
  });

  it('công tắc đóng + 1 đèn => mạch kín, đèn sáng', () => {
    const res = computeMachDien({ voltage: 6, switchClosed: 1, topology: 1, wireBroken: 0 });
    expect(res.isClosed).toBe(1);
    expect(res.bulb1Lit).toBe(1);
    expect(res.currentEst).toBe(0.6); // 6V / 10Ω = 0.6A
  });

  it('hai đèn nối tiếp => dòng điện nhỏ hơn 1 đèn', () => {
    const single = computeMachDien({ voltage: 6, switchClosed: 1, topology: 1, wireBroken: 0 });
    const series = computeMachDien({ voltage: 6, switchClosed: 1, topology: 2, wireBroken: 0 });
    expect(series.bulb1Lit).toBe(1);
    expect(series.bulb2Lit).toBe(1);
    expect(series.currentEst).toBeLessThan(single.currentEst);
  });

  it('hai đèn song song => dòng điện lớn hơn nối tiếp', () => {
    const series = computeMachDien({ voltage: 6, switchClosed: 1, topology: 2, wireBroken: 0 });
    const parallel = computeMachDien({ voltage: 6, switchClosed: 1, topology: 3, wireBroken: 0 });
    expect(parallel.currentEst).toBeGreaterThan(series.currentEst);
  });

  it('phát hiện đoản mạch (short circuit) và cảnh báo nguy hiểm', () => {
    const res = computeMachDien({ voltage: 6, switchClosed: 1, topology: 4, wireBroken: 0 });
    expect(res.isShortCircuit).toBe(1);
  });
});
