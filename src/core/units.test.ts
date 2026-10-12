import { describe, it, expect } from 'vitest';
import { Units } from './units';
import { validateParams } from './validate';

describe('Units conversion', () => {
  it('converts cm2 to m2 accurately', () => {
    expect(Units.cm2ToM2(10000)).toBe(1);
    expect(Units.cm2ToM2(50)).toBe(0.005);
  });

  it('converts g to kg and weights', () => {
    expect(Units.gToKg(500)).toBe(0.5);
    expect(Units.massToWeight(2, 10)).toBe(20);
  });

  it('converts km/h to m/s', () => {
    expect(Units.kmhToMs(36)).toBe(10);
  });
});

describe('Validate params', () => {
  const defs = {
    m: { label: 'Khối lượng', symbol: 'm', unit: 'kg', min: 0.1, max: 10, step: 0.1, defaultVal: 1 }
  };

  it('validates normal value', () => {
    const res = validateParams(defs, { m: 2.5 });
    expect(res.valid).toBe(true);
    expect(res.cleanedParams.m).toBe(2.5);
  });

  it('clamps and flags out-of-range value', () => {
    const res = validateParams(defs, { m: 25 });
    expect(res.valid).toBe(false);
    expect(res.cleanedParams.m).toBe(10);
  });
});
