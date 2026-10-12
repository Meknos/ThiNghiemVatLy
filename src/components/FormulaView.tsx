import React, { useMemo } from 'react';
import katex from 'katex';

interface FormulaViewProps {
  formula: string;
  displayMode?: boolean;
}

export const FormulaView: React.FC<FormulaViewProps> = ({ formula, displayMode = false }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false
      });
    } catch {
      return formula;
    }
  }, [formula, displayMode]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};
