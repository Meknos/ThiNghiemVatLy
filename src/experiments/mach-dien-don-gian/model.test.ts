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

describe('Độ sáng của đèn', () => {
  const base = { switchClosed: 1, wireBroken: 0 };

  it('đèn 6 V mắc vào nguồn 6 V thì sáng bình thường', () => {
    const res = computeMachDien({ ...base, voltage: 6, topology: 1 });
    expect(res.brightness).toBeCloseTo(1, 5);
    expect(res.overVoltage).toBe(0);
  });

  it('hai đèn nối tiếp: mỗi đèn chỉ nhận nửa hiệu điện thế nên sáng yếu hơn', () => {
    const res = computeMachDien({ ...base, voltage: 6, topology: 2 });
    expect(res.bulbVoltage).toBe(3);
    expect(res.brightness).toBeCloseTo(0.25, 5);
  });

  it('hai đèn song song: mỗi đèn vẫn sáng bình thường, dòng qua nguồn gấp đôi', () => {
    const one = computeMachDien({ ...base, voltage: 6, topology: 1 });
    const par = computeMachDien({ ...base, voltage: 6, topology: 3 });
    expect(par.brightness).toBeCloseTo(one.brightness, 5);
    expect(par.currentEst).toBeCloseTo(2 * one.currentEst, 5);
  });

  it('đứt dây thì mạch hở dù công tắc đóng', () => {
    const res = computeMachDien({ voltage: 6, switchClosed: 1, topology: 1, wireBroken: 1 });
    expect(res.isClosed).toBe(0);
    expect(res.currentEst).toBe(0);
  });

  it('đoản mạch: đèn không sáng, dòng điện lớn hơn nhiều so với mạch có đèn', () => {
    const normal = computeMachDien({ ...base, voltage: 6, topology: 1 });
    const short = computeMachDien({ ...base, voltage: 6, topology: 4 });
    expect(short.bulb1Lit).toBe(0);
    expect(short.currentEst).toBeGreaterThan(normal.currentEst * 10);
  });

  it('cảnh báo khi hiệu điện thế vượt xa định mức của đèn', () => {
    expect(computeMachDien({ ...base, voltage: 12, topology: 1 }).overVoltage).toBe(1);
    expect(computeMachDien({ ...base, voltage: 12, topology: 2 }).overVoltage).toBe(0);
  });
});

describe('Tháo bóng đèn khỏi đui', () => {
  const base = { voltage: 6, switchClosed: 1, wireBroken: 0 };

  it('nối tiếp: tháo một đèn thì đèn còn lại cũng tắt', () => {
    const res = computeMachDien({ ...base, topology: 2, bulb1Out: 1 });
    expect(res.isClosed).toBe(0);
    expect(res.bulb2Lit).toBe(0);
    expect(res.currentEst).toBe(0);
  });

  it('song song: tháo một đèn thì đèn kia vẫn sáng bình thường, dòng qua nguồn giảm một nửa', () => {
    const both = computeMachDien({ ...base, topology: 3 });
    const one = computeMachDien({ ...base, topology: 3, bulb1Out: 1 });
    expect(one.isClosed).toBe(1);
    expect(one.bulb1Lit).toBe(0);
    expect(one.bulb2Lit).toBe(1);
    expect(one.brightness).toBeCloseTo(both.brightness, 5);
    expect(one.currentEst).toBeCloseTo(both.currentEst / 2, 5);
  });

  it('song song: tháo cả hai đèn thì mạch hở', () => {
    expect(computeMachDien({ ...base, topology: 3, bulb1Out: 1, bulb2Out: 1 }).isClosed).toBe(0);
  });
});
