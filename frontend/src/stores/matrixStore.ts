import { create } from 'zustand';
import { db, ensureSeed } from '../db';
import type { DefectInput, DefectLog } from '../types/defect';
import { shouldDisableMatrix } from '../types/defect';
import type { MatrixInput, TypeMatrix } from '../types/matrix';
import { ptOfSize } from '../types/matrix';
import type { ProofInput, ProofRecord } from '../types/proof';
import { makeId, toPlain, todayStr } from '../utils/format';

interface MatrixState {
  matrices: TypeMatrix[];
  defects: DefectLog[];
  proofs: ProofRecord[];
  loaded: boolean;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  createMatrix: (input: MatrixInput) => Promise<TypeMatrix>;
  updateMatrix: (id: string, patch: Partial<TypeMatrix>) => Promise<void>;
  removeMatrix: (id: string) => Promise<void>;
  addDefect: (input: DefectInput) => Promise<DefectLog>;
  repairMatrix: (matrixId: string, operator: string) => Promise<void>;
  addProof: (input: ProofInput) => Promise<ProofRecord>;
}

const byUpdatedDesc = (a: TypeMatrix, b: TypeMatrix) => (a.updatedAt < b.updatedAt ? 1 : -1);

export const useMatrixStore = create<MatrixState>((set, get) => ({
  matrices: [],
  defects: [],
  proofs: [],
  loaded: false,
  loading: false,
  error: '',

  /** 首次进入时写入示例档案并读回全部数据 */
  load: async () => {
    set({ loading: true, error: '' });
    try {
      await ensureSeed();
      const [matrices, defects, proofs] = await Promise.all([
        db.matrices.toArray(),
        db.defects.toArray(),
        db.proofs.toArray(),
      ]);
      set({
        matrices: matrices.sort(byUpdatedDesc),
        defects,
        proofs,
        loaded: true,
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : '本地档案读取失败' });
    }
  },

  createMatrix: async (input) => {
    const now = new Date().toISOString();
    const row: TypeMatrix = toPlain({
      id: makeId('mtx'),
      code: input.code.trim(),
      character: input.character.trim(),
      font: input.font,
      sizeName: input.sizeName,
      sizePt: ptOfSize(input.sizeName),
      material: input.material,
      faceWidthMm: Number(input.faceWidthMm),
      bodyHeightMm: Number(input.bodyHeightMm),
      madeYear: Number(input.madeYear),
      engraver: input.engraver.trim(),
      availability: '可用' as const,
      note: (input.note ?? '').trim(),
      createdAt: now,
      updatedAt: now,
    });
    await db.matrices.add(row);
    set((s) => ({ matrices: [row, ...s.matrices] }));
    return row;
  },

  updateMatrix: async (id, patch) => {
    const plain = toPlain(patch);
    const next: Partial<TypeMatrix> = { ...plain, updatedAt: new Date().toISOString() };
    if (plain.sizeName) next.sizePt = ptOfSize(plain.sizeName);
    await db.matrices.update(id, next);
    set((s) => ({
      matrices: s.matrices
        .map((m) => (m.id === id ? { ...m, ...next } : m))
        .sort(byUpdatedDesc),
    }));
  },

  removeMatrix: async (id) => {
    await db.transaction('rw', db.matrices, db.defects, db.proofs, async () => {
      await db.matrices.delete(id);
      const defectIds = (await db.defects.where('matrixId').equals(id).toArray()).map((d) => d.id);
      const proofIds = (await db.proofs.where('matrixId').equals(id).toArray()).map((p) => p.id);
      await db.defects.bulkDelete(defectIds);
      await db.proofs.bulkDelete(proofIds);
    });
    set((s) => ({
      matrices: s.matrices.filter((m) => m.id !== id),
      defects: s.defects.filter((d) => d.matrixId !== id),
      proofs: s.proofs.filter((p) => p.matrixId !== id),
    }));
  },

  /** 登记缺损：写入缺损记录，并按结论自动停用字模 */
  addDefect: async (input) => {
    const matrix = get().matrices.find((m) => m.id === input.matrixId);
    if (!matrix) throw new Error('未找到对应字模，无法登记缺损');
    const row: DefectLog = toPlain({
      id: makeId('dft'),
      matrixId: input.matrixId,
      character: matrix.character,
      matrixCode: matrix.code,
      defectType: input.defectType,
      severity: input.severity,
      foundDate: input.foundDate || todayStr(),
      handling: input.handling.trim(),
      availability: input.availability,
      operator: input.operator.trim(),
      note: (input.note ?? '').trim(),
      createdAt: new Date().toISOString(),
    });
    await db.defects.add(row);
    set((s) => ({ defects: [row, ...s.defects] }));
    if (shouldDisableMatrix(input.availability)) {
      await get().updateMatrix(input.matrixId, { availability: input.availability });
    }
    return row;
  },

  /** 补刻完成：恢复可用，并留下一条收尾记录 */
  repairMatrix: async (matrixId, operator) => {
    const matrix = get().matrices.find((m) => m.id === matrixId);
    if (!matrix) throw new Error('未找到对应字模，无法补刻');
    const history = get()
      .defects.filter((d) => d.matrixId === matrixId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const last = history[0];
    const row: DefectLog = toPlain({
      id: makeId('dft'),
      matrixId,
      character: matrix.character,
      matrixCode: matrix.code,
      defectType: last?.defectType ?? '磨损',
      severity: last?.severity ?? '轻',
      foundDate: todayStr(),
      handling: `补刻完成，字面复测合格（原处理：${last?.handling ?? '未记录'}）`,
      availability: '可用' as const,
      operator: operator.trim() || '补刻工',
      note: '补刻收尾记录',
      createdAt: new Date().toISOString(),
    });
    await db.defects.add(row);
    set((s) => ({ defects: [row, ...s.defects] }));
    await get().updateMatrix(matrixId, { availability: '可用' });
  },

  addProof: async (input) => {
    const matrix = input.matrixId ? get().matrices.find((m) => m.id === input.matrixId) : undefined;
    const row: ProofRecord = toPlain({
      id: makeId('pfr'),
      targetKind: input.targetKind,
      targetRef: input.targetRef.trim(),
      matrixId: input.matrixId,
      pressureKg: Number(input.pressureKg),
      ink: input.ink.trim(),
      impressions: Number(input.impressions),
      sampleNo: input.sampleNo.trim(),
      clarity: input.clarity,
      proofDate: input.proofDate || todayStr(),
      note: (input.note ?? '').trim(),
      createdAt: new Date().toISOString(),
    });
    if (matrix && input.targetKind === '字符' && !row.targetRef) row.targetRef = matrix.character;
    await db.proofs.add(row);
    set((s) => ({ proofs: [row, ...s.proofs] }));
    return row;
  },
}));

/** 单条字模（组件内使用，避免整表订阅） */
export function selectMatrix(id: string) {
  return (s: MatrixState) => s.matrices.find((m) => m.id === id);
}
