import { useMemo } from 'react';
import { useMatrixStore } from '../stores/matrixStore';
import { useUiStore, type MatrixFilter } from '../stores/uiStore';
import type { DefectLog } from '../types/defect';
import { SEVERITY_WEIGHT } from '../types/defect';
import type { MatrixAvailability, TypeMatrix } from '../types/matrix';
import { charSortValue, pinyinOf, radicalOf, radicalStrokeValue, strokesOf } from '../utils/charIndex';

export interface MatrixSearchResult {
  results: TypeMatrix[];
  total: number;
  /** 结果集中各可用性的数量 */
  countByAvailability: Record<string, number>;
  /** 最新一条缺损记录，按字模 id 索引 */
  latestDefect: (matrixId: string) => DefectLog | undefined;
  /** 当前生效的筛选条件 */
  filter: MatrixFilter;
}

export interface MatrixSearchOptions {
  /** 只在这些可用性中检索；不传表示全部 */
  availability?: MatrixAvailability[];
  /** 忽略关键字条件（字盘页按已选字符定位时使用） */
  ignoreKeyword?: boolean;
}

/** 关键字命中：字符 / 拼音 / 拼音首字母 / 字模编号 / 刻工 */
export function matchKeyword(matrix: TypeMatrix, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  const py = pinyinOf(matrix.character);
  return (
    matrix.character === keyword.trim() ||
    matrix.code.toLowerCase().includes(k) ||
    (py && py.startsWith(k)) ||
    (py && py.charAt(0) === k) ||
    matrix.engraver.toLowerCase().includes(k) ||
    radicalOf(matrix.character).includes(keyword.trim())
  );
}

/** 组合筛选 + 排序（纯函数，便于复用于 hooks 与页面统计） */
export function searchMatrices(
  matrices: TypeMatrix[],
  filter: MatrixFilter,
  options: MatrixSearchOptions = {},
): TypeMatrix[] {
  const scoped = options.availability
    ? matrices.filter((m) => options.availability!.includes(m.availability))
    : matrices;
  const keyword = options.ignoreKeyword ? '' : filter.keyword;
  const filtered = scoped.filter((m) => {
    if (filter.font && m.font !== filter.font) return false;
    if (filter.sizeName && m.sizeName !== filter.sizeName) return false;
    if (filter.material && m.material !== filter.material) return false;
    if (filter.availability && m.availability !== filter.availability) return false;
    return matchKeyword(m, keyword);
  });
  const sorted = [...filtered];
  switch (filter.sortBy) {
    case 'strokes':
      sorted.sort(
        (a, b) =>
          (charSortValue(a.character, 'strokes') as number) -
            (charSortValue(b.character, 'strokes') as number) ||
          radicalStrokeValue(a.character) - radicalStrokeValue(b.character) ||
          a.code.localeCompare(b.code),
      );
      break;
    case 'radical':
      sorted.sort(
        (a, b) =>
          String(charSortValue(a.character, 'radical')).localeCompare(
            String(charSortValue(b.character, 'radical')),
          ) || strokesOf(a.character) - strokesOf(b.character),
      );
      break;
    case 'pinyin':
      sorted.sort(
        (a, b) => String(charSortValue(a.character, 'pinyin')).localeCompare(String(charSortValue(b.character, 'pinyin'))),
      );
      break;
    case 'code':
      sorted.sort((a, b) => a.code.localeCompare(b.code));
      break;
    default:
      sorted.sort((a, b) => a.character.localeCompare(b.character, 'zh-Hans-CN'));
  }
  return sorted;
}

/**
 * 组合字体、字号、材质与可用性条件并返回结果集。
 * 被总览页（`/`）与字盘页（`/cases`）复用。
 */
export function useMatrixSearch(options: MatrixSearchOptions = {}): MatrixSearchResult {
  const matrices = useMatrixStore((s) => s.matrices);
  const defects = useMatrixStore((s) => s.defects);
  const filter = useUiStore((s) => s.filter);

  const latestDefectMap = useMemo(() => {
    const map = new Map<string, DefectLog>();
    [...defects]
      .sort(
        (a, b) =>
          SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] || (a.createdAt < b.createdAt ? 1 : -1),
      )
      .forEach((d) => {
        if (!map.has(d.matrixId)) map.set(d.matrixId, d);
      });
    return map;
  }, [defects]);

  const results = useMemo(
    () => searchMatrices(matrices, filter, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrices, filter, options.availability?.join(','), options.ignoreKeyword],
  );

  const countByAvailability = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of results) out[m.availability] = (out[m.availability] ?? 0) + 1;
    return out;
  }, [results]);

  return {
    results,
    total: results.length,
    countByAvailability,
    latestDefect: (matrixId: string) => latestDefectMap.get(matrixId),
    filter,
  };
}
