import React from 'react';
import { ExperimentTemplate, ParamDef, ViewProps } from '../../core/types';
import { FORMULAS, FormulaDef } from './formulas';
import { solveFormula, variablesOf } from './model';
import { CongThucView } from './View';

/**
 * Mỗi công thức trong thư viện trở thành một mẫu thí nghiệm đầy đủ:
 * tham số là các đại lượng của công thức, cộng thêm `find` cho biết đề hỏi đại lượng nào.
 */
function makeFormulaTemplate(def: FormulaDef): ExperimentTemplate<Record<string, number>> {
  const vars = variablesOf(def);

  const params: Record<string, ParamDef> = {};
  for (const v of vars) {
    params[v.key] = { label: v.label, symbol: v.symbol, unit: v.unit, min: v.min, max: v.max, step: v.step, defaultVal: v.defaultVal };
  }
  params.find = {
    label: `Đại lượng cần tìm (${vars.map((v, k) => `${k + 1}: ${v.label.toLowerCase()}`).join(', ')})`,
    symbol: 'Tìm',
    unit: '',
    min: 1,
    max: vars.length,
    step: 1,
    defaultVal: 1
  };

  return {
    id: def.id,
    title: def.title,
    group: def.group,
    topic: def.topic,
    grade: null, // chưa đối chiếu sách giáo khoa
    params,
    outputs: vars.map((v) => ({ label: v.label, symbol: v.symbol, unit: v.unit })),
    compute: (p) => {
      const { values } = solveFormula(def, p, p.find);
      const out: Record<string, number> = {};
      for (const v of vars) out[v.symbol] = values[v.key];
      return out;
    },
    formulas: [def.latex],
    conditions: def.conditions,
    aiHint: `${def.aiHint} Đặt "find" theo đại lượng đề hỏi và bỏ trống đại lượng đó.`,
    View: (props: ViewProps<Record<string, number>>) => React.createElement(CongThucView, { ...props, def })
  };
}

export const FORMULA_TEMPLATES = FORMULAS.map(makeFormulaTemplate);
