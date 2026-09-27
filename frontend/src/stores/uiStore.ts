import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MatrixAvailability, MatrixFont, MatrixMaterial } from '../types/matrix';
import type { CharSortMode } from '../utils/charIndex';

/** 总览页筛选与排序条件 */
export interface MatrixFilter {
  font: MatrixFont | '';
  sizeName: string;
  material: MatrixMaterial | '';
  availability: MatrixAvailability | '';
  /** 字符 / 拼音 / 拼音首字母 / 字模编号 */
  keyword: string;
  /** 字符 / 笔画 / 部首 / 拼音 / 编号 */
  sortBy: CharSortMode | 'code';
}

export const EMPTY_FILTER: MatrixFilter = {
  font: '',
  sizeName: '',
  material: '',
  availability: '',
  keyword: '',
  sortBy: 'strokes',
};

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'warn' | 'error';
}

interface UiState {
  filter: MatrixFilter;
  /** 字盘页当前选中的字盘 */
  selectedCaseId: string;
  /** 试印页用于回溯的样张编号 */
  sampleQuery: string;
  toast: Toast | null;
  setFilter: (patch: Partial<MatrixFilter>) => void;
  resetFilter: () => void;
  setSelectedCaseId: (id: string) => void;
  setSampleQuery: (q: string) => void;
  pushToast: (text: string, kind?: Toast['kind']) => void;
  clearToast: () => void;
}

let toastSeq = 0;

/** UI 偏好走 localStorage 持久化（zustand persist），业务数据走 IndexedDB */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      filter: { ...EMPTY_FILTER },
      selectedCaseId: '',
      sampleQuery: '',
      toast: null,
      setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
      resetFilter: () => set({ filter: { ...EMPTY_FILTER } }),
      setSelectedCaseId: (id) => set({ selectedCaseId: id }),
      setSampleQuery: (q) => set({ sampleQuery: q }),
      pushToast: (text, kind = 'ok') => {
        toastSeq += 1;
        set({ toast: { id: toastSeq, text, kind } });
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'gbmovabletype-ui',
      partialize: (s) => ({ filter: s.filter, selectedCaseId: s.selectedCaseId }),
    },
  ),
);
