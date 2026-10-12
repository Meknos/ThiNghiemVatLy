import React from 'react';

export interface ParamDef {
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
}

export interface OutputDef {
  label: string;
  symbol: string;
  unit: string;
}

export interface ViewProps<P = Record<string, number>> {
  params: P;
  outputs: Record<string, number>;
  onParamChange: (key: keyof P, val: number) => void;
}

export interface ExperimentTemplate<P = Record<string, number>> {
  id: string;                 // e.g. 'ap-suat-chat-ran'
  title: string;
  group: 'Cơ học' | 'Quang học' | 'Điện học' | 'Nhiệt học' | 'Âm học' | 'Mở đầu & Đo lường';
  topic: string;
  grade: 6 | 7 | 8 | 9 | null; // null cho đến khi đối chiếu SGK chính thức
  params: { [K in keyof P]: ParamDef };
  outputs: OutputDef[];
  compute(p: P): Record<string, number>; // Hàm thuần toán học
  formulas: string[];         // Chuỗi LaTeX
  conditions: string;         // Điều kiện áp dụng cho giáo viên
  aiHint: string;             // Gợi ý cho AI nhận diện đề bài
  View: React.ComponentType<ViewProps<P>>;
}
