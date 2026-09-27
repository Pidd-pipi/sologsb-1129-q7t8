import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PREFIX = 'gbmovabletype-draft:';

export interface LocalDraftResult<T> {
  draft: T;
  /** 合并式更新，自动写入 localStorage */
  patch: (next: Partial<T>) => void;
  replace: (next: T) => void;
  reset: () => void;
  /** 最近一次落盘时间（本地时间字符串），空串表示尚未保存 */
  savedAt: string;
  /** 进入页面时是否已存在草稿 */
  existed: boolean;
}

/**
 * 表单 / 布局编辑草稿：localStorage 持久化（业务数据仍走 IndexedDB）。
 * 刷新页面后草稿自动回填，避免登记到一半或落位改到一半丢失。
 * 被字盘页（`/cases`）与字模登记页（`/matrices/new`）复用。
 */
export function useLocalDraft<T extends object>(key: string, initial: T): LocalDraftResult<T> {
  const storageKey = `${PREFIX}${key}`;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const readStorage = useCallback((): Partial<T> | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as Partial<T>;
    } catch {
      return null;
    }
  }, [storageKey]);

  const [draft, setDraft] = useState<T>(() => {
    const saved = readStorage();
    return saved ? { ...initial, ...saved } : initial;
  });
  const [savedAt, setSavedAt] = useState('');
  const [existed, setExisted] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      setExisted(true);
    } catch {
      /* 存储不可用时静默降级为纯内存草稿 */
    }
  }, [storageKey, draft]);

  const patch = useCallback((next: Partial<T>) => {
    setDraft((cur) => ({ ...cur, ...next }));
  }, []);

  const replace = useCallback((next: T) => setDraft(next), []);

  const reset = useCallback(() => {
    setDraft(initialRef.current);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* 忽略 */
    }
    setSavedAt('');
    setExisted(false);
  }, [storageKey]);

  const patchMemo = useMemo(() => patch, [patch]);

  return { draft, patch: patchMemo, replace, reset, savedAt, existed };
}

/** 草稿键常量，便于审核与排查 */
export const DRAFT_KEYS = {
  matrixNew: 'matrix-new',
  caseEditor: (caseId: string) => `case-${caseId}`,
  defectBoard: 'defect-new',
  proofNew: 'proof-new',
} as const;
