import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import DefectBadge from '../components/common/DefectBadge';
import EmptyState from '../components/common/EmptyState';
import { DRAFT_KEYS, useLocalDraft } from '../hooks/useLocalDraft';
import { useMatrixStore } from '../stores/matrixStore';
import { useUiStore } from '../stores/uiStore';
import {
  DEFECT_SEVERITIES,
  DEFECT_TYPES,
  SEVERITY_WEIGHT,
  validateDefectInput,
  type DefectInput,
  type DefectSeverity,
  type DefectType,
} from '../types/defect';
import { MATRIX_AVAILABILITIES, type MatrixAvailability } from '../types/matrix';
import { countBy, dash, formatDate, todayStr } from '../utils/format';

interface DefectFormState {
  matrixId: string;
  defectType: DefectType;
  severity: DefectSeverity;
  foundDate: string;
  handling: string;
  availability: MatrixAvailability;
  operator: string;
  note: string;
}

const INITIAL_FORM: DefectFormState = {
  matrixId: '',
  defectType: '缺笔',
  severity: '中',
  foundDate: todayStr(),
  handling: '',
  availability: '停用',
  operator: '',
  note: '',
};

/** `/defects` 缺损登记：提交后自动停用字模并进入待补刻清单 */
export default function DefectBoard() {
  const matrices = useMatrixStore((s) => s.matrices);
  const defects = useMatrixStore((s) => s.defects);
  const addDefect = useMatrixStore((s) => s.addDefect);
  const repairMatrix = useMatrixStore((s) => s.repairMatrix);
  const pushToast = useUiStore((s) => s.pushToast);

  const { draft, patch, reset, savedAt, existed } = useLocalDraft<DefectFormState>(
    DRAFT_KEYS.defectBoard,
    INITIAL_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!draft.matrixId && matrices.length > 0) patch({ matrixId: matrices[0].id });
  }, [draft.matrixId, matrices, patch]);

  const pendingRepair = useMemo(
    () =>
      matrices
        .filter((m) => m.availability !== '可用')
        .sort(
          (a, b) => (a.availability === b.availability ? 0 : a.availability === '停用' ? -1 : 1),
        ),
    [matrices],
  );

  const latestDefectOf = (matrixId: string) =>
    [...defects]
      .filter((d) => d.matrixId === matrixId)
      .sort(
        (a, b) =>
          SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] || (a.createdAt < b.createdAt ? 1 : -1),
      )[0];

  const typeStats = useMemo(() => countBy(defects, (d) => d.defectType), [defects]);
  const sortedDefects = useMemo(
    () => [...defects].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [defects],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input: DefectInput = {
      matrixId: draft.matrixId,
      defectType: draft.defectType,
      severity: draft.severity,
      foundDate: draft.foundDate,
      handling: draft.handling,
      availability: draft.availability,
      operator: draft.operator,
      note: draft.note,
    };
    const next = validateDefectInput(input);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      pushToast('缺损登记未通过校验，请按提示修正', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const { defect, removedSlots, affectedCases } = await addDefect(input);
      pushToast(
        defect.availability === '可用'
          ? `已登记「${defect.character}」缺损，字模保持可用`
          : removedSlots > 0
            ? `已登记「${defect.character}」缺损，字模转为${defect.availability}，已从 ${affectedCases} 个字盘撤下 ${removedSlots} 处格位`
            : `已登记「${defect.character}」缺损，字模转为${defect.availability}，其当前未落在任何格位`,
      );
      patch({ handling: '', note: '' });
      setErrors({});
    } catch (err) {
      pushToast(err instanceof Error ? err.message : '缺损登记失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-title" data-testid="defect-board-title">
            缺损登记
          </h2>
          <p className="mt-sub">
            选字模与缺损类型、程度，提交后字模自动停用、从所有字盘撤下格位并进入待补刻清单；补刻完成后恢复可用，格位需工作人员手动重新落位。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="mt-chip" data-testid="defect-total">
            缺损记录 {defects.length} 条
          </span>
          <span className="mt-chip border-seal/40 text-seal" data-testid="defect-pending">
            待处理 {pendingRepair.length} 枚
          </span>
        </div>
      </section>

      <section className="mt-panel">
        <div className="mt-panel-head">
          <h3 className="font-song text-sm font-semibold text-ink">登记一条缺损</h3>
          <span className="mt-sub" data-testid="defect-draft-status">
            {existed ? `草稿已恢复 · ${savedAt || '—'}` : `草稿自动保存 ${savedAt || '—'}`}
          </span>
        </div>
        <form className="space-y-3 px-4 py-4" onSubmit={handleSubmit} data-testid="defect-form">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mt-label" htmlFor="defect-matrix-select">
                字模
              </label>
              <select
                id="defect-matrix-select"
                data-testid="defect-matrix-select"
                className="mt-input"
                value={draft.matrixId}
                onChange={(e) => patch({ matrixId: e.target.value })}
              >
                <option value="">请选择字模</option>
                {matrices.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.character} · {m.code} · {m.font}/{m.sizeName} · {m.material} · {m.availability}
                  </option>
                ))}
              </select>
              {errors.matrixId ? (
                <p className="mt-error" data-testid="error-matrixId">
                  {errors.matrixId}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mt-label" htmlFor="defect-type-select">
                缺损类型
              </label>
              <select
                id="defect-type-select"
                data-testid="defect-type-select"
                className="mt-input"
                value={draft.defectType}
                onChange={(e) => patch({ defectType: e.target.value as DefectType })}
              >
                {DEFECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mt-label" htmlFor="defect-severity-select">
                程度
              </label>
              <select
                id="defect-severity-select"
                data-testid="defect-severity-select"
                className="mt-input"
                value={draft.severity}
                onChange={(e) => patch({ severity: e.target.value as DefectSeverity })}
              >
                {DEFECT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mt-label" htmlFor="defect-date-input">
                发现日期
              </label>
              <input
                id="defect-date-input"
                data-testid="defect-date-input"
                type="date"
                className="mt-input"
                value={draft.foundDate}
                onChange={(e) => patch({ foundDate: e.target.value })}
              />
              {errors.foundDate ? (
                <p className="mt-error" data-testid="error-foundDate">
                  {errors.foundDate}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mt-label" htmlFor="defect-availability-select">
                可用性结论
              </label>
              <select
                id="defect-availability-select"
                data-testid="defect-availability-select"
                className="mt-input"
                value={draft.availability}
                onChange={(e) => patch({ availability: e.target.value as MatrixAvailability })}
              >
                {MATRIX_AVAILABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <p className="mt-hint">选择「停用」或「待补刻」时，提交后会自动停用该字模并从所有字盘撤下格位</p>
            </div>
            <div>
              <label className="mt-label" htmlFor="defect-operator-input">
                登记人
              </label>
              <input
                id="defect-operator-input"
                data-testid="defect-operator-input"
                className="mt-input"
                placeholder="例：陈之安"
                value={draft.operator}
                onChange={(e) => patch({ operator: e.target.value })}
              />
              {errors.operator ? (
                <p className="mt-error" data-testid="error-operator">
                  {errors.operator}
                </p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="mt-label" htmlFor="defect-handling-input">
                处理方式
              </label>
              <input
                id="defect-handling-input"
                data-testid="defect-handling-input"
                className="mt-input"
                placeholder="例：字面中部磨损，停用并列入补刻"
                value={draft.handling}
                onChange={(e) => patch({ handling: e.target.value })}
              />
              {errors.handling ? (
                <p className="mt-error" data-testid="error-handling">
                  {errors.handling}
                </p>
              ) : null}
            </div>
            <div className="md:col-span-3">
              <label className="mt-label" htmlFor="defect-note-input">
                备注
              </label>
              <input
                id="defect-note-input"
                data-testid="defect-note-input"
                className="mt-input"
                placeholder="例：磨损深度约 0.15mm"
                value={draft.note}
                onChange={(e) => patch({ note: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="mt-btn mt-btn-primary" data-testid="submit-defect" disabled={submitting}>
              {submitting ? '登记中…' : '登记缺损'}
            </button>
            <button
              type="button"
              className="mt-btn"
              data-testid="reset-defect-draft"
              onClick={() => {
                reset();
                setErrors({});
                pushToast('已清空缺损登记草稿', 'warn');
              }}
            >
              清空草稿
            </button>
            <span className="mt-hint">类型分布：{DEFECT_TYPES.map((t) => `${t} ${typeStats[t] ?? 0}`).join(' · ')}</span>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="mt-panel">
          <div className="mt-panel-head">
            <h3 className="font-song text-sm font-semibold text-ink">待补刻清单</h3>
            <span className="mt-sub">补刻完成后恢复可用，再到字盘布局手动落位</span>
          </div>
          {pendingRepair.length === 0 ? (
            <div className="px-4 py-4">
              <EmptyState title="没有停用或待补刻的字模" description="所有字模均处于可用状态。" testId="pending-empty" />
            </div>
          ) : (
            <ul className="divide-y divide-paper-line" data-testid="pending-list">
              {pendingRepair.map((m) => {
                const d = latestDefectOf(m.id);
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-song text-lg text-ink">{m.character}</span>
                        <span className="text-[11px] text-ink-mute">{m.code}</span>
                        <span className="mt-chip">{m.availability}</span>
                      </div>
                      {d ? (
                        <DefectBadge
                          type={d.defectType}
                          severity={d.severity}
                          testId={`pending-defect-${m.id}`}
                        />
                      ) : (
                        <span className="text-[11px] text-ink-mute">暂无缺损记录</span>
                      )}
                      {d ? <p className="text-[11px] text-ink-soft">{d.handling}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link className="mt-btn" to={`/matrices/${m.id}`} data-testid={`pending-detail-${m.id}`}>
                        查看详情
                      </Link>
                      <button
                        type="button"
                        className="mt-btn mt-btn-primary"
                        data-testid={`repair-${m.id}`}
                        onClick={async () => {
                          await repairMatrix(m.id, draft.operator || '补刻工 陈之安');
                          pushToast(
                            `「${m.character}」补刻完成，恢复可用；旧格位不会自动回填，请到「字盘布局」手动落位`,
                          );
                        }}
                      >
                        补刻完成
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-panel">
          <div className="mt-panel-head">
            <h3 className="font-song text-sm font-semibold text-ink">缺损记录</h3>
            <span className="mt-sub">按登记时间倒序</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full" data-testid="defect-table">
              <thead className="border-b border-paper-line bg-paper/60">
                <tr>
                  <th className="mt-th">字模</th>
                  <th className="mt-th">类型 / 程度</th>
                  <th className="mt-th">发现日期</th>
                  <th className="mt-th">处理方式</th>
                  <th className="mt-th">登记人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {sortedDefects.length === 0 ? (
                  <tr>
                    <td className="mt-td text-ink-mute" colSpan={5}>
                      暂无缺损记录。
                    </td>
                  </tr>
                ) : (
                  sortedDefects.map((d) => (
                    <tr key={d.id} data-testid={`defect-row-${d.id}`}>
                      <td className="mt-td">
                        <Link className="font-song text-base text-ink hover:text-seal" to={`/matrices/${d.matrixId}`}>
                          {d.character}
                        </Link>
                        <div className="text-[11px] text-ink-mute">{dash(d.matrixCode)}</div>
                      </td>
                      <td className="mt-td">
                        <DefectBadge
                          type={d.defectType}
                          severity={d.severity}
                          availability={d.availability}
                          testId={`defect-row-badge-${d.id}`}
                        />
                      </td>
                      <td className="mt-td">{formatDate(d.foundDate)}</td>
                      <td className="mt-td">{d.handling}</td>
                      <td className="mt-td">{dash(d.operator)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
