import { ParamDef } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  cleanedParams: Record<string, number>;
}

export function validateParams(
  defs: Record<string, ParamDef>,
  inputs: Record<string, number | undefined>
): ValidationResult {
  const errors: Record<string, string> = {};
  const cleaned: Record<string, number> = {};

  for (const [key, def] of Object.entries(defs)) {
    const val = inputs[key];
    if (val === undefined || isNaN(val)) {
      errors[key] = `Thiếu tham số ${def.label} (${def.symbol})`;
      cleaned[key] = def.defaultVal;
      continue;
    }

    if (val < def.min) {
      errors[key] = `${def.label} (${val} ${def.unit}) nhỏ hơn giá trị tối thiểu cho phép (${def.min} ${def.unit})`;
      cleaned[key] = def.min;
    } else if (val > def.max) {
      errors[key] = `${def.label} (${val} ${def.unit}) vượt quá giá trị tối đa cho phép (${def.max} ${def.unit})`;
      cleaned[key] = def.max;
    } else {
      cleaned[key] = val;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleanedParams: cleaned
  };
}
