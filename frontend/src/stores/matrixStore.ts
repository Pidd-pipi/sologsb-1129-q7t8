import { create } from 'zustand';
import { db, ensureSeed } from '../db';
import type { DefectInput, DefectLog } from '../types/defect';
import { shouldDisableMatrix } from '../types/defect';
import type { CaseSlot, TypeCase } from '../types/case';
import type { MatrixInput, TypeMatrix } from '../types/matrix';
import { ptOfSize } from '../types/matrix';
import type { ProofInput, ProofRecord } from '../types/proof';
import { matrixIdsOf } from '../utils/layout';
import { makeId, toPlain, todayStr } from '../utils/format';
import { useCaseStore } from './caseStore';

/** 缺损登记结果：记录本体 + 撤格统计（跨全部字盘） */
export interface DefectRegistration {
  defect: DefectLog;
  /** 撤下的格位总数（同一字模落在多处时累加） */
  removedSlots: number;
  /** 涉及的字盘数 */
  affectedCases: number;
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
   * 登记缺损：缺损入库、字模状态、从所有字盘撤格、落位索引刷新放进同一次
   * 本地事务（defects / matrices / cases 三表 rw），任一步失败整批回滚，
   * 不会留下「已停用却仍占着格位」的半成品。
   * 注意：以 slots 为撤格依据（而非 matrixId 索引），避免历史索引残留导致漏撤。
   */
  addDefect: async (input) => {
    const matrix = get().matrices.find((m) => m.id === input.matrixId);
    if (!matrix) throw new Error('未找到对应字模，无法登记缺损');
    const now = new Date().toISOString();
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
      createdAt: now,
    });
    const disable = shouldDisableMatrix(input.availability);

    // 撤格结果在事务内收集，提交成功后再同步内存状态
    let removedSlots = 0;
    const casePatches: Array<{ id: string; slots: CaseSlot[]; matrixId: string[] }> = [];

    await db.transaction('rw', db.defects, db.matrices, db.cases, async () => {
      // 1) 缺损入库
      await db.defects.add(row);
      if (!disable) return;

      // 2) 字模状态转为停用 / 待补刻
      await db.matrices.update(input.matrixId, {
        availability: input.availability,
        updatedAt: now,
      });

      // 3) 从所有字盘撤下该字模；slots 已无该字模但索引仍残留时，只刷新索引
      const allCases: TypeCase[] = await db.cases.toArray();
      for (const c of allCases) {
        const nextSlots = c.slots.filter((s) => s.matrixId !== input.matrixId);
        const removed = c.slots.length - nextSlots.length;
        const indexStale = c.matrixId.includes(input.matrixId);
        if (removed === 0 && !indexStale) continue;
        removedSlots += removed;
        casePatches.push({ id: c.id, slots: toPlain(nextSlots), matrixId: matrixIdsOf(nextSlots) });
      }

      // 4) 落位索引（matrixId 多值索引）随撤格一起刷新
      for (const p of casePatches) {
        await db.cases.update(p.id, {
          slots: p.slots,
          matrixId: p.matrixId,
          updatedAt: now,
        });
      }
    });

    // 事务已提交，统一刷新内存状态；若中途抛错则一行都不会执行
    set((s) => ({ defects: [row, ...s.defects] }));
    if (disable) {
      set((s) => ({
        matrices: s.matrices
          .map((m) =>
            m.id === input.matrixId
              ? { ...m, availability: input.availability, updatedAt: now }
              : m,
          )
          .sort(byUpdatedDesc),
      }));
      if (casePatches.length > 0) {
        useCaseStore.setState((s) => ({
          cases: s.cases.map((c) => {
            const p = casePatches.find((x) => x.id === c.id);
            return p
              ? { ...c, slots: p.slots, matrixId: p.matrixId, updatedAt: now }
              : c;
          }),
        }));
      }
    }
    return { defect: row, removedSlots, affectedCases: casePatches.length };
  },

  /**
   * 补刻完成：只把字模恢复为可用，并留下一条收尾记录。
   * 不会自动塞回旧格位——撤格期间旧格位可能已放入别的字模，自动回填会
   * 覆盖后来的落位；由工作人员到「字盘布局」页面手动重新落位。
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
      await db.matrices.update(matrixId, { availability: '可用', updatedAt: now });
    });
    set((s) => ({ defects: [row, ...s.defects] }));
    set((s) => ({
      matrices: s.matrices
        .map((m) =>
          m.id === matrixId ? { ...m, availability: '可用' as const, updatedAt: now } : m,
        )
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
