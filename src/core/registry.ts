import { ExperimentTemplate } from './types';
import { lucVaChuyenDongTemplate } from '../experiments/luc-va-chuyen-dong';
import { apSuatChatRanTemplate } from '../experiments/ap-suat-chat-ran';
import { phanXaAnhSangTemplate } from '../experiments/phan-xa-anh-sang';
import { machDienDonGianTemplate } from '../experiments/mach-dien-don-gian';

export const EXPERIMENT_REGISTRY: ExperimentTemplate<any>[] = [
  lucVaChuyenDongTemplate,
  apSuatChatRanTemplate,
  phanXaAnhSangTemplate,
  machDienDonGianTemplate
];

export function getExperimentById(id: string): ExperimentTemplate<any> | undefined {
  return EXPERIMENT_REGISTRY.find((exp) => exp.id === id);
}

export function getExperimentsByGroup(group: string): ExperimentTemplate<any>[] {
  return EXPERIMENT_REGISTRY.filter((exp) => exp.group === group);
}
