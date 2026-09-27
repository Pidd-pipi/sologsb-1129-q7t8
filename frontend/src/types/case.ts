/** 字盘（TypeCase）：行列格位组成的字模存放盘 */

/** 字盘类型：常用字盘 / 生僻字盘 */
export const CASE_KINDS = ['常用字盘', '生僻字盘'] as const;
export type CaseKind = (typeof CASE_KINDS)[number];

/** 行数 / 列数合法区间 */
export const ROW_RANGE = { min: 4, max: 16 } as const;
export const COL_RANGE = { min: 4, max: 20 } as const;

/** 一个格位的落位信息（行、列均为 0 基下标） */
export interface CaseSlot {
  row: number;
  col: number;
  character: string;
  matrixId: string;
  /** 落位时间 */
  placedAt: string;
}

export interface TypeCase {
  id: string;
  /** 字盘编号，例：ZP-A-01 */
  code: string;
  kind: CaseKind;
  rows: number;
  cols: number;
  /** 格位布局 */
  slots: CaseSlot[];
  /** 所在工位 */
  workStation: string;
  /**
   * 落位字模 id 集合（多值索引，便于按字模反查字盘）。
   * 由落位操作自动维护，与 slots 中的 matrixId 保持一致。
   */
  matrixId: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseInput {
  code: string;
  kind: CaseKind;
  rows: number;
  cols: number;
  workStation: string;
}

/** 字盘容量 = 行数 × 列数 */
export function capacityOf(rows: number, cols: number): number {
  if (!Number.isFinite(rows) || !Number.isFinite(cols)) return 0;
  return Math.max(0, Math.floor(rows) * Math.floor(cols));
}

/** 字盘基本信息校验 */
export function validateCaseInput(input: Partial<CaseInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!(input.code || '').trim()) errors.code = '字盘编号不能为空';
  if (!input.kind) errors.kind = '请选择字盘类型';
  const rows = Number(input.rows);
  if (!Number.isInteger(rows) || rows < ROW_RANGE.min || rows > ROW_RANGE.max) {
    errors.rows = `行数需在 ${ROW_RANGE.min}–${ROW_RANGE.max} 之间`;
  }
  const cols = Number(input.cols);
  if (!Number.isInteger(cols) || cols < COL_RANGE.min || cols > COL_RANGE.max) {
    errors.cols = `列数需在 ${COL_RANGE.min}–${COL_RANGE.max} 之间`;
  }
  if (!(input.workStation || '').trim()) errors.workStation = '请填写所在工位';
  return errors;
}

/** 字盘容量的文字描述 */
export function describeCapacity(rows: number, cols: number): string {
  return `${rows} 行 × ${cols} 列 = ${capacityOf(rows, cols)} 格`;
}
