import type { MatrixAvailability } from './matrix';

/** 缺损记录（DefectLog）：字模缺笔、磨损等损耗与处理结果 */

/** 缺损类型 */
export const DEFECT_TYPES = ['缺笔', '磨损', '变形', '锈蚀', '断裂'] as const;
export type DefectType = (typeof DEFECT_TYPES)[number];

/** 程度 */
export const DEFECT_SEVERITIES = ['轻', '中', '重'] as const;
export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];

export interface DefectLog {
  id: string;
  /** 关联字模 id */
  matrixId: string;
  /** 冗余保存字符与编号，便于清单直接展示 */
  character: string;
  matrixCode: string;
  defectType: DefectType;
  severity: DefectSeverity;
  /** 发现日期 YYYY-MM-DD */
  foundDate: string;
  /** 处理方式 */
  handling: string;
  /** 可用性结论：可用 / 停用 / 待补刻 */
  availability: MatrixAvailability;
  /** 登记人 */
  operator: string;
  note: string;
  createdAt: string;
}

export interface DefectInput {
  matrixId: string;
  defectType: DefectType;
  severity: DefectSeverity;
  foundDate: string;
  handling: string;
  availability: MatrixAvailability;
  operator: string;
  note?: string;
}

/** 缺损程度对应的严重度权重，用于排序 */
export const SEVERITY_WEIGHT: Record<DefectSeverity, number> = { 重: 3, 中: 2, 轻: 1 };

/** 缺损登记表单校验 */
export function validateDefectInput(input: Partial<DefectInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!(input.matrixId || '').trim()) errors.matrixId = '请选择需要登记缺损的字模';
  if (!input.defectType) errors.defectType = '请选择缺损类型';
  if (!input.severity) errors.severity = '请选择缺损程度';
  const foundDate = (input.foundDate || '').trim();
  if (!foundDate) errors.foundDate = '请填写发现日期';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(foundDate)) errors.foundDate = '日期格式需为 YYYY-MM-DD';
  if (!(input.handling || '').trim()) errors.handling = '请填写处理方式';
  if (!input.availability) errors.availability = '请选择可用性结论';
  if (!(input.operator || '').trim()) errors.operator = '请填写登记人';
  return errors;
}

/** 是否需要在登记后自动停用字模（可用性结论不是「可用」时） */
export function shouldDisableMatrix(availability: MatrixAvailability): boolean {
  return availability !== '可用';
}
