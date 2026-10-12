import { ExperimentTemplate } from './types';
import { lucVaChuyenDongTemplate } from '../experiments/luc-va-chuyen-dong';
import { apSuatChatRanTemplate } from '../experiments/ap-suat-chat-ran';
import { phanXaAnhSangTemplate } from '../experiments/phan-xa-anh-sang';
import { machDienDonGianTemplate } from '../experiments/mach-dien-don-gian';
import { archimedesTemplate } from '../experiments/luc-day-archimedes';
import { apSuatChatLongTemplate } from '../experiments/ap-suat-chat-long';
import { khoiLuongRiengTemplate } from '../experiments/khoi-luong-rieng';
import { khucXaAnhSangTemplate } from '../experiments/khuc-xa-anh-sang';
import { dinhLuatOhmTemplate } from '../experiments/dinh-luat-ohm';

export const EXPERIMENT_REGISTRY: ExperimentTemplate<any>[] = [
  apSuatChatRanTemplate,
  lucDayArchimedesAlias(archimedesTemplate),
  apSuatChatLongTemplate,
  khoiLuongRiengTemplate,
  phanXaAnhSangTemplate,
  khucXaAnhSangTemplate,
  machDienDonGianTemplate,
  dinhLuatOhmTemplate,
  lucVaChuyenDongTemplate
];

function lucDayArchimedesAlias(t: any) {
  return t;
}

export function getExperimentById(id: string): ExperimentTemplate<any> | undefined {
  return EXPERIMENT_REGISTRY.find((exp) => exp.id === id);
}

export function getExperimentsByGroup(group: string): ExperimentTemplate<any>[] {
  return EXPERIMENT_REGISTRY.filter((exp) => exp.group === group);
}
