import { create } from 'zustand';
import { db, ensureSeed } from '../db';
import { useCaseStore } from './caseStore';
import type { CaseSlot, TypeCase } from '../types/case';
import type { DefectInput, DefectLog } from '../types/defect';
import { shouldDisableMatrix } from '../types/defect';
import type { MatrixInput, TypeMatrix } from '../types/matrix';
import { ptOfSize } from '../types/matrix';
import type { ProofInput, ProofRecord } from '../types/proof';
import { makeId, toPlain, todayStr } from '../utils/format';
import { matrixIdsOf, withdrawMatrix } from '../utils/layout';

/** 缺损登记结果：defect 为入库记录，withdrawnSlots 为本次撤下的格位数 */
export interface DefectRegistration {
  defect: DefectLog;
  /** 从所有字盘撤下的格位总数（0 表示该字模原本就不在任何字盘里） */
  withdrawnSlots: number;
  /** 本次刷新过落位索引的字盘数 */
  affectedCases: number;
}

interface WithdrawnCaseUpdate {
  id: string;
  slots: CaseSlot[];
  matrixId: string[];
  updatedAt: string;
}

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
  addDefect: (input: DefectInput) => Promise<DefectRegistration>;
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

  /**
   * 登记缺损（月度清点）：一次本地事务内完成
   *   1) 缺损记录入库；
   *   2) 字模状态改为停用 / 待补刻；
   *   3) 从所有字盘撤下该字模的格位；
   *   4) 刷新受影响字盘的 matrixId 落位索引。
   * 任一步失败整批回滚，不留半截数据；内存状态仅在提交成功后更新。
   */
  addDefect: async (input) => {
    const matrix = get().matrices.find((m) => m.id === input.matrixId);
    if (!matrix) throw new Error('未找到对应字模，无法登记缺损');

    const now = new Date().toISOString();
    const defectRow: DefectLog = toPlain({
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
      createdAt: now,
    });

    const disable = shouldDisableMatrix(input.availability);
    const matrixPatch: Partial<TypeMatrix> = disable
      ? { availability: input.availability, updatedAt: now }
      : {};

    // 事务内累积的撤格结果，提交成功后才用于刷新内存
    let caseUpdates: WithdrawnCaseUpdate[] = [];
    let withdrawnSlots = 0;

    await db.transaction('rw', db.defects, db.matrices, db.cases, async () => {
      // 1) 缺损入库
      await db.defects.add(defectRow);

      if (!disable) return;

      // 2) 字模状态（停用 / 待补刻）
      const updated = await db.matrices.update(input.matrixId, matrixPatch);
      if (updated === 0) throw new Error('未找到对应字模，无法更新状态');

      // 3)+4) 遍历所有字盘撤下该字模，并刷新 matrixId 落位索引
      caseUpdates = [];
      withdrawnSlots = 0;
      const allCases: TypeCase[] = await db.cases.toArray();
      for (const c of allCases) {
        const held = (c.slots ?? []).some((s) => s.matrixId === input.matrixId);
        const indexed = (c.matrixId ?? []).includes(input.matrixId);
        // 该字盘既没落位也没索引引用，跳过
        if (!held && !indexed) continue;

        const { slots: nextSlots, withdrawn } = withdrawMatrix(c.slots ?? [], input.matrixId);
        const nextIds = matrixIdsOf(nextSlots);
        withdrawnSlots += withdrawn;
        await db.cases.update(c.id, {
          slots: toPlain(nextSlots),
          matrixId: nextIds,
          updatedAt: now,
        });
        caseUpdates.push({
          id: c.id,
          slots: toPlain(nextSlots),
          matrixId: nextIds,
          updatedAt: now,
        });
      }
    });

    // —— 事务已提交，以下只更新内存状态 ——
    set((s) => ({ defects: [defectRow, ...s.defects] }));
    if (disable) {
      set((s) => ({
        matrices: s.matrices
          .map((m) => (m.id === input.matrixId ? { ...m, ...matrixPatch } : m))
          .sort(byUpdatedDesc),
      }));
      useCaseStore.getState().applyWithdrawnSlots(caseUpdates);
    }

    return { defect: defectRow, withdrawnSlots, affectedCases: caseUpdates.length };
  },

  /**
   * 补刻完成：一次本地事务内写入收尾缺损记录并把字模恢复为「可用」。
   * 注意：不写 cases 表、不自动塞回旧格位——旧格位后来可能已放入别的字模，
   * 一律由工作人员到「字盘布局」页手动重新落位。
   */
  repairMatrix: async (matrixId, operator) => {
    const matrix = get().matrices.find((m) => m.id === matrixId);
    if (!matrix) throw new Error('未找到对应字模，无法补刻');
    const history = get()
      .defects.filter((d) => d.matrixId === matrixId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const last = history[0];
    const now = new Date().toISOString();
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
      createdAt: now,
    });

    await db.transaction('rw', db.defects, db.matrices, async () => {
      await db.defects.add(row);
      const updated = await db.matrices.update(matrixId, { availability: '可用', updatedAt: now });
      if (updated === 0) throw new Error('未找到对应字模，无法恢复可用');
    });

    // —— 事务已提交，再更新内存状态；字盘格位保持原样 ——
    const repairedPatch: Partial<TypeMatrix> = { availability: '可用', updatedAt: now };
    set((s) => ({ defects: [row, ...s.defects] }));
    set((s) => ({
      matrices: s.matrices
        .map((m) => (m.id === matrixId ? { ...m, ...repairedPatch } : m))
        .sort(byUpdatedDesc),
    }));
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
