/** 活字字模（TypeMatrix）：一枚可复用的单字字模档案 */

/** 字体：宋体 / 楷体 / 仿宋 */
export const MATRIX_FONTS = ['宋体', '楷体', '仿宋'] as const;
export type MatrixFont = (typeof MATRIX_FONTS)[number];

/** 材质：铜模 / 木活字 / 铅合金 */
export const MATRIX_MATERIALS = ['铜模', '木活字', '铅合金'] as const;
export type MatrixMaterial = (typeof MATRIX_MATERIALS)[number];

/** 可用性：可用 / 停用 / 待补刻 */
export const MATRIX_AVAILABILITIES = ['可用', '停用', '待补刻'] as const;
export type MatrixAvailability = (typeof MATRIX_AVAILABILITIES)[number];

/** 字号（初号至八号）与对应磅值 */
export interface TypeSize {
  name: string;
  pt: number;
}

export const TYPE_SIZES: TypeSize[] = [
  { name: '初号', pt: 42 },
  { name: '小初', pt: 36 },
  { name: '一号', pt: 26 },
  { name: '小一', pt: 24 },
  { name: '二号', pt: 22 },
  { name: '小二', pt: 18 },
  { name: '三号', pt: 16 },
  { name: '小三', pt: 15 },
  { name: '四号', pt: 14 },
  { name: '小四', pt: 12 },
  { name: '五号', pt: 10.5 },
  { name: '小五', pt: 9 },
  { name: '六号', pt: 7.5 },
  { name: '小六', pt: 6.5 },
  { name: '七号', pt: 5.5 },
  { name: '八号', pt: 5 },
];

export const MATRIX_SIZE_NAMES = TYPE_SIZES.map((s) => s.name);
export type MatrixSizeName = string;

/** 字面尺寸 / 字身高度（mm）与制作年代的合法区间 */
export const FACE_WIDTH_RANGE = { min: 1, max: 60 } as const;
export const BODY_HEIGHT_RANGE = { min: 1, max: 80 } as const;
export const MADE_YEAR_RANGE = { min: 1900, max: 2030 } as const;

export interface TypeMatrix {
  id: string;
  /** 字模编号，例：ZM-1985-007 */
  code: string;
  /** 字模上的单个汉字 */
  character: string;
  font: MatrixFont;
  /** 字号名，取自 TYPE_SIZES */
  sizeName: MatrixSizeName;
  /** 字号对应磅值（冗余存储，便于排序与检索） */
  sizePt: number;
  material: MatrixMaterial;
  /** 字面尺寸 mm */
  faceWidthMm: number;
  /** 字身高度 mm */
  bodyHeightMm: number;
  /** 制作年代（公元年） */
  madeYear: number;
  /** 刻工 */
  engraver: string;
  /** 可用性 */
  availability: MatrixAvailability;
  /** 登记备注 */
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** 依据字号名取磅值；未收录时回退 10.5（五号） */
export function ptOfSize(sizeName: MatrixSizeName): number {
  return TYPE_SIZES.find((s) => s.name === sizeName)?.pt ?? 10.5;
}

export interface MatrixInput {
  code: string;
  character: string;
  font: MatrixFont;
  sizeName: MatrixSizeName;
  material: MatrixMaterial;
  faceWidthMm: number;
  bodyHeightMm: number;
  madeYear: number;
  engraver: string;
  note?: string;
}

/** 字模登记表单校验：返回逐字段错误信息，空对象表示通过 */
export function validateMatrixInput(input: Partial<MatrixInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  const ch = (input.character || '').trim();
  if (!ch) errors.character = '请填写或从字符选择器中选取一个字符';
  else if (Array.from(ch).length > 1) errors.character = '一次只登记一个字符';

  if (!(input.code || '').trim()) errors.code = '字模编号不能为空';
  if (!input.font) errors.font = '请选择字体';
  if (!input.sizeName) errors.sizeName = '请选择字号';
  if (!input.material) errors.material = '请选择材质';

  const fw = Number(input.faceWidthMm);
  if (!Number.isFinite(fw) || fw < FACE_WIDTH_RANGE.min || fw > FACE_WIDTH_RANGE.max) {
    errors.faceWidthMm = `字面尺寸需在 ${FACE_WIDTH_RANGE.min}–${FACE_WIDTH_RANGE.max} mm 之间`;
  }
  const bh = Number(input.bodyHeightMm);
  if (!Number.isFinite(bh) || bh < BODY_HEIGHT_RANGE.min || bh > BODY_HEIGHT_RANGE.max) {
    errors.bodyHeightMm = `字身高度需在 ${BODY_HEIGHT_RANGE.min}–${BODY_HEIGHT_RANGE.max} mm 之间`;
  }
  const yr = Number(input.madeYear);
  if (!Number.isInteger(yr) || yr < MADE_YEAR_RANGE.min || yr > MADE_YEAR_RANGE.max) {
    errors.madeYear = `制作年代需在 ${MADE_YEAR_RANGE.min}–${MADE_YEAR_RANGE.max} 之间`;
  }
  if (!(input.engraver || '').trim()) errors.engraver = '请填写刻工';
  return errors;
}
