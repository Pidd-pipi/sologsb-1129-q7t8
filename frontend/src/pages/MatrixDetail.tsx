import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DefectBadge from '../components/common/DefectBadge';
import EmptyState from '../components/common/EmptyState';
import LayoutGrid from '../components/common/LayoutGrid';
import MatrixCell from '../components/common/MatrixCell';
import { useMatrixStore } from '../stores/matrixStore';
import { findCaseHolding, useCaseStore } from '../stores/caseStore';
import { useUiStore } from '../stores/uiStore';
import { DEFECT_SEVERITIES, DEFECT_TYPES, validateDefectInput } from '../types/defect';
import type { DefectSeverity, DefectType } from '../types/defect';
import {
  MATRIX_AVAILABILITIES,
  MATRIX_FONTS,
  MATRIX_MATERIALS,
  TYPE_SIZES,
  type MatrixAvailability,
} from '../types/matrix';
import { CLARITY_LEVELS, IMPRESSION_RANGE, PRESSURE_RANGE } from '../types/proof';
import type { ClarityLevel } from '../types/proof';
import { pinyinOf, radicalOf, strokesOf } from '../utils/charIndex';
import { dash, formatDate, formatStamp, suggestSampleNo, todayStr } from '../utils/format';
import { rcKey } from '../utils/layout';

const INFO_ROWS: Array<{ label: string; key: string }> = [
  { label: '字模编号', key: 'code' },
  { label: '字体', key: 'font' },
  { label: '字号 / 磅值', key: 'size' },
  { label: '材质', key: 'material' },
  { label: '字面尺寸', key: 'face' },
  { label: '字身高度', key: 'body' },
  { label: '制作年代', key: 'year' },
  { label: '刻工', key: 'engraver' },
  { label: '登记时间', key: 'created' },
  { label: '最近更新', key: 'updated' },
];

/** `/matrices/:id` 字模详情：字面信息 + 所在字盘格位 + 缺损历史 + 试印记录 */
export default function MatrixDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matrices = useMatrixStore((s) => s.matrices);
  const defects = useMatrixStore((s) => s.defects);
  const proofs = useMatrixStore((s) => s.proofs);
  const loaded = useMatrixStore((s) => s.loaded);
  const updateMatrix = useMatrixStore((s) => s.updateMatrix);
  const addDefect = useMatrixStore((s) => s.addDefect);
  const addProof = useMatrixStore((s) => s.addProof);
  const repairMatrix = useMatrixStore((s) => s.repairMatrix);
  const removeMatrix = useMatrixStore((s) => s.removeMatrix);
  const cases = useCaseStore((s) => s.cases);
  const pushToast = useUiStore((s) => s.pushToast);

  const matrix = matrices.find((m) => m.id === id);
  const matrixDefects = useMemo(
    () => defects.filter((d) => d.matrixId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [defects, id],
  );
  const matrixProofs = useMemo(
    () => proofs.filter((p) => p.matrixId === id).sort((a, b) => (a.proofDate < b.proofDate ? 1 : -1)),
    [proofs, id],
  );
  const holdings = useMemo(() => findCaseHolding(cases, id), [cases, id]);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    engraver: matrix?.engraver ?? '',
    note: matrix?.note ?? '',
    availability: (matrix?.availability ?? '可用') as MatrixAvailability,
  });
  const [defectForm, setDefectForm] = useState({
    defectType: '缺笔' as DefectType,
    severity: '中' as DefectSeverity,
    foundDate: todayStr(),
    handling: '',
    availability: '停用' as MatrixAvailability,
    operator: '',
    note: '',
  });
  const [defectErrors, setDefectErrors] = useState<Record<string, string>>({});
  const [proofForm, setProofForm] = useState({
    pressureKg: '12.5',
    ink: '油烟墨 101',
    impressions: '40',
    sampleNo: suggestSampleNo(todayStr(), matrixProofs.length + 1),
    clarity: '清晰' as ClarityLevel,
    proofDate: todayStr(),
    note: '',
  });
  const [proofErrors, setProofErrors] = useState<Record<string, string>>({});

  if (!matrix) {
    return (
      <EmptyState
        title={loaded ? '没有找到这枚字模' : '正在读取字模档案…'}
        description={
          loaded
            ? '该字模可能已被删除，或链接中的编号不正确。可返回总览重新选择。'
            : '首次进入会写入示例档案，请稍候。'
        }
        action={
          <Link className="mt-btn" to="/" data-testid="detail-back">
            返回字模总览
          </Link>
        }
        testId="matrix-not-found"
      />
    );
  }

  const infoValue: Record<string, string> = {
    code: matrix.code,
    font: matrix.font,
    size: `${matrix.sizeName} · ${matrix.sizePt} pt`,
    material: matrix.material,
    face: `${matrix.faceWidthMm} mm`,
    body: `${matrix.bodyHeightMm} mm`,
    year: `${matrix.madeYear} 年`,
    engraver: matrix.engraver,
    created: formatStamp(matrix.createdAt),
    updated: formatStamp(matrix.updatedAt),
  };

  const handleSaveInfo = async () => {
    await updateMatrix(matrix.id, {
      engraver: editForm.engraver.trim(),
      note: editForm.note.trim(),
      availability: editForm.availability,
    });
    setEditing(false);
    pushToast('字面信息已更新');
  };

  const handleAddDefect = async (e: FormEvent) => {
    e.preventDefault();
    const input = {
      matrixId: matrix.id,
      defectType: defectForm.defectType,
      severity: defectForm.severity,
      foundDate: defectForm.foundDate,
      handling: defectForm.handling,
      availability: defectForm.availability,
      operator: defectForm.operator,
      note: defectForm.note,
    };
    const errors = validateDefectInput(input);
    setDefectErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast('缺损登记未通过校验，请按提示修正', 'warn');
      return;
    }
    const { removedSlots, affectedCases } = await addDefect(input);
    if (defectForm.availability === '可用') {
      pushToast('已登记缺损，字模保持可用');
    } else if (removedSlots > 0) {
      pushToast(
        `已登记缺损，「${matrix.character}」已转为${defectForm.availability}，并从 ${affectedCases} 个字盘撤下 ${removedSlots} 处格位`,
      );
    } else {
      pushToast(
        `已登记缺损，「${matrix.character}」已转为${defectForm.availability}，其当前未落在任何格位`,
      );
    }
    setDefectForm((prev) => ({ ...prev, handling: '', note: '' }));
    setDefectErrors({});
  };

  const handleAddProof = async (e: FormEvent) => {
    e.preventDefault();
    const input = {
      targetKind: '字符' as const,
      targetRef: matrix.character,
      matrixId: matrix.id,
      pressureKg: Number(proofForm.pressureKg),
      ink: proofForm.ink,
      impressions: Number(proofForm.impressions),
      sampleNo: proofForm.sampleNo,
      clarity: proofForm.clarity,
      proofDate: proofForm.proofDate,
      note: proofForm.note,
    };
    const errors: Record<string, string> = {};
    if (!Number.isFinite(input.pressureKg) || input.pressureKg < PRESSURE_RANGE.min || input.pressureKg > PRESSURE_RANGE.max) {
      errors.pressureKg = `压力需在 ${PRESSURE_RANGE.min}–${PRESSURE_RANGE.max} kg 之间`;
    }
    if (
      !Number.isInteger(input.impressions) ||
      input.impressions < IMPRESSION_RANGE.min ||
      input.impressions > IMPRESSION_RANGE.max
    ) {
      errors.impressions = `印次需在 ${IMPRESSION_RANGE.min}–${IMPRESSION_RANGE.max} 之间`;
    }
    if (!input.sampleNo.trim()) errors.sampleNo = '样张编号不能为空';
    setProofErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast('试印登记未通过校验，请按提示修正', 'warn');
      return;
    }
    await addProof(input);
    pushToast(`已记录试印样张 ${input.sampleNo}`);
    setProofForm((prev) => ({
      ...prev,
      sampleNo: suggestSampleNo(todayStr(), matrixProofs.length + 2),
      note: '',
    }));
  };

  const handleRepair = async () => {
    await repairMatrix(matrix.id, '补刻工 陈之安');
    pushToast(`「${matrix.character}」补刻完成，恢复可用；旧格位不会自动回填，需手动落位`);
  };

  const handleRemove = async () => {
    await removeMatrix(matrix.id);
    pushToast(`已删除字模「${matrix.character}」的档案`, 'warn');
    navigate('/');
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-title" data-testid="matrix-detail-title">
            字模详情 · {matrix.character}
          </h2>
          <p className="mt-sub">
            部首 {radicalOf(matrix.character)} · {strokesOf(matrix.character) || '—'} 画 · 拼音{' '}
            {pinyinOf(matrix.character) || '未收录'} · 编号 {matrix.code}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mt-chip" data-testid="detail-availability">
            当前状态：{matrix.availability}
          </span>
          {matrix.availability !== '可用' ? (
            <button type="button" className="mt-btn mt-btn-primary" data-testid="repair-btn" onClick={handleRepair}>
              补刻完成，恢复可用
            </button>
          ) : null}
          <button
            type="button"
            className="mt-btn"
            data-testid="edit-toggle"
            onClick={() => {
              setEditForm({
                engraver: matrix.engraver,
                note: matrix.note,
                availability: matrix.availability,
              });
              setEditing((v) => !v);
            }}
          >
            {editing ? '取消编辑' : '编辑基础信息'}
          </button>
          {matrix.availability !== '可用' ? (
            <button type="button" className="mt-btn" data-testid="remove-matrix" onClick={handleRemove}>
              删除档案
            </button>
          ) : null}
          <Link className="mt-btn" to="/" data-testid="detail-back">
            返回总览
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="mt-panel px-4 py-4">
          <MatrixCell
            character={matrix.character}
            sizeName={matrix.sizeName}
            sizePt={matrix.sizePt}
            code={matrix.code}
            font={matrix.font}
            material={matrix.material}
            availability={matrix.availability}
            defect={matrixDefects[0] ?? null}
            testId="detail-cell"
          />
          <div className="mt-3 space-y-1 text-xs text-ink-soft">
            <p>缺损记录 {matrixDefects.length} 条</p>
            <p>试印记录 {matrixProofs.length} 条</p>
            <p>所在字盘 {holdings.length} 处</p>
          </div>
          {editing ? (
            <div className="mt-3 space-y-2 border-t border-paper-line pt-3">
              <div>
                <label className="mt-label" htmlFor="edit-engraver">
                  刻工
                </label>
                <input
                  id="edit-engraver"
                  data-testid="edit-engraver"
                  className="mt-input"
                  value={editForm.engraver}
                  onChange={(e) => setEditForm((p) => ({ ...p, engraver: e.target.value }))}
                />
              </div>
              <div>
                <label className="mt-label" htmlFor="edit-availability">
                  可用性
                </label>
                <select
                  id="edit-availability"
                  data-testid="edit-availability"
                  className="mt-input"
                  value={editForm.availability}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, availability: e.target.value as MatrixAvailability }))
                  }
                >
                  {MATRIX_AVAILABILITIES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mt-label" htmlFor="edit-note">
                  备注
                </label>
                <input
                  id="edit-note"
                  data-testid="edit-note"
                  className="mt-input"
                  value={editForm.note}
                  onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
              <button type="button" className="mt-btn mt-btn-primary" data-testid="save-info-btn" onClick={handleSaveInfo}>
                保存基础信息
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-panel">
          <div className="mt-panel-head">
            <h3 className="font-song text-sm font-semibold text-ink">字面信息与所在格位</h3>
            <span className="mt-sub">字面尺寸 / 字身高度单位 mm</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-xs md:grid-cols-3" data-testid="detail-info">
            {INFO_ROWS.map((row) => (
              <div key={row.key} className="flex flex-col gap-0.5">
                <dt className="text-ink-mute">{row.label}</dt>
                <dd className="text-ink-soft" data-testid={`detail-${row.key}`}>
                  {infoValue[row.key]}
                </dd>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-0.5 md:col-span-3">
              <dt className="text-ink-mute">备注</dt>
              <dd className="text-ink-soft" data-testid="detail-note">
                {dash(matrix.note)}
              </dd>
            </div>
          </dl>

          <div className="border-t border-paper-line px-4 py-3">
            <h4 className="mb-2 font-song text-sm font-semibold text-ink">所在字盘格位</h4>
            {holdings.length === 0 ? (
              <p className="text-xs text-ink-mute" data-testid="no-holding">
                该字模当前未落在任何字盘格位上，可到「字盘布局」页面落位。
              </p>
            ) : (
              <div className="space-y-4">
                {holdings.map((h) => (
                  <div key={h.typeCase.id} className="space-y-2">
                    <p className="text-xs text-ink-soft">
                      {h.typeCase.code}（{h.typeCase.kind} · {h.typeCase.workStation}）落位格位：
                      {h.slots
                        .map((s) => `${String.fromCharCode(65 + s.row)}${s.col + 1}`)
                        .join('、')}
                    </p>
                    <LayoutGrid
                      rows={h.typeCase.rows}
                      cols={h.typeCase.cols}
                      slots={h.typeCase.slots}
                      highlightKeys={h.slots.map((s) => rcKey(s.row, s.col))}
                      readOnly
                      testIdPrefix="detail-slot"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="mt-panel">
          <div className="mt-panel-head">
            <h3 className="font-song text-sm font-semibold text-ink">缺损历史</h3>
            <span className="mt-sub">登记停用后自动从所有字盘撤格，补刻恢复后需手动重新落位</span>
          </div>
          <ul className="divide-y divide-paper-line" data-testid="defect-history">
            {matrixDefects.length === 0 ? (
              <li className="px-4 py-4 text-xs text-ink-mute">暂无缺损记录，字面状态良好。</li>
            ) : (
              matrixDefects.map((d) => (
                <li key={d.id} className="space-y-1 px-4 py-3" data-testid={`defect-item-${d.id}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <DefectBadge
                      type={d.defectType}
                      severity={d.severity}
                      availability={d.availability}
                      testId={`detail-defect-badge-${d.id}`}
                    />
                    <span className="text-xs text-ink-mute">{formatDate(d.foundDate)}</span>
                    <span className="text-xs text-ink-mute">登记人 {dash(d.operator)}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-soft">{d.handling}</p>
                  {d.note ? <p className="text-[11px] text-ink-mute">备注：{d.note}</p> : null}
                </li>
              ))
            )}
          </ul>
          <form className="space-y-3 border-t border-paper-line px-4 py-3" onSubmit={handleAddDefect} data-testid="inline-defect-form">
            <h4 className="font-song text-sm font-semibold text-ink">就地新增缺损</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mt-label" htmlFor="inline-defect-type">
                  缺损类型
                </label>
                <select
                  id="inline-defect-type"
                  data-testid="inline-defect-type"
                  className="mt-input"
                  value={defectForm.defectType}
                  onChange={(e) => setDefectForm((p) => ({ ...p, defectType: e.target.value as DefectType }))}
                >
                  {DEFECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-defect-severity">
                  程度
                </label>
                <select
                  id="inline-defect-severity"
                  data-testid="inline-defect-severity"
                  className="mt-input"
                  value={defectForm.severity}
                  onChange={(e) =>
                    setDefectForm((p) => ({ ...p, severity: e.target.value as DefectSeverity }))
                  }
                >
                  {DEFECT_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-defect-date">
                  发现日期
                </label>
                <input
                  id="inline-defect-date"
                  data-testid="inline-defect-date"
                  type="date"
                  className="mt-input"
                  value={defectForm.foundDate}
                  onChange={(e) => setDefectForm((p) => ({ ...p, foundDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-defect-availability">
                  可用性结论
                </label>
                <select
                  id="inline-defect-availability"
                  data-testid="inline-defect-availability"
                  className="mt-input"
                  value={defectForm.availability}
                  onChange={(e) =>
                    setDefectForm((p) => ({ ...p, availability: e.target.value as MatrixAvailability }))
                  }
                >
                  {MATRIX_AVAILABILITIES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mt-label" htmlFor="inline-defect-handling">
                处理方式
              </label>
              <input
                id="inline-defect-handling"
                data-testid="inline-defect-handling"
                className="mt-input"
                placeholder="例：字面中部磨损，停用并列入补刻"
                value={defectForm.handling}
                onChange={(e) => setDefectForm((p) => ({ ...p, handling: e.target.value }))}
              />
              {defectErrors.handling ? <p className="mt-error">{defectErrors.handling}</p> : null}
            </div>
            <div>
              <label className="mt-label" htmlFor="inline-defect-operator">
                登记人
              </label>
              <input
                id="inline-defect-operator"
                data-testid="inline-defect-operator"
                className="mt-input"
                placeholder="例：陈之安"
                value={defectForm.operator}
                onChange={(e) => setDefectForm((p) => ({ ...p, operator: e.target.value }))}
              />
              {defectErrors.operator ? <p className="mt-error">{defectErrors.operator}</p> : null}
            </div>
            <button type="submit" className="mt-btn mt-btn-primary" data-testid="inline-defect-submit">
              登记缺损
            </button>
          </form>
        </div>

        <div className="mt-panel">
          <div className="mt-panel-head">
            <h3 className="font-song text-sm font-semibold text-ink">试印记录</h3>
            <span className="mt-sub">按样张编号可回溯试印批次</span>
          </div>
          <ul className="divide-y divide-paper-line" data-testid="proof-history">
            {matrixProofs.length === 0 ? (
              <li className="px-4 py-4 text-xs text-ink-mute">暂无试印记录。</li>
            ) : (
              matrixProofs.map((p) => (
                <li key={p.id} className="space-y-1 px-4 py-3" data-testid={`proof-item-${p.id}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    <span className="font-song text-sm text-ink">{p.sampleNo}</span>
                    <span className="mt-chip">{p.clarity}</span>
                    <span className="text-ink-mute">{formatDate(p.proofDate)}</span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    压力 {p.pressureKg} kg · 用墨 {p.ink} · 印次 {p.impressions}
                  </p>
                  {p.note ? <p className="text-[11px] text-ink-mute">备注：{p.note}</p> : null}
                </li>
              ))
            )}
          </ul>
          <form className="space-y-3 border-t border-paper-line px-4 py-3" onSubmit={handleAddProof} data-testid="inline-proof-form">
            <h4 className="font-song text-sm font-semibold text-ink">就地新增试印</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mt-label" htmlFor="inline-proof-pressure">
                  压力 kg
                </label>
                <input
                  id="inline-proof-pressure"
                  data-testid="inline-proof-pressure"
                  className="mt-input"
                  type="number"
                  min={PRESSURE_RANGE.min}
                  max={PRESSURE_RANGE.max}
                  step={0.5}
                  value={proofForm.pressureKg}
                  onChange={(e) => setProofForm((p) => ({ ...p, pressureKg: e.target.value }))}
                />
                {proofErrors.pressureKg ? <p className="mt-error">{proofErrors.pressureKg}</p> : null}
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-proof-impressions">
                  印次
                </label>
                <input
                  id="inline-proof-impressions"
                  data-testid="inline-proof-impressions"
                  className="mt-input"
                  type="number"
                  min={IMPRESSION_RANGE.min}
                  max={IMPRESSION_RANGE.max}
                  step={1}
                  value={proofForm.impressions}
                  onChange={(e) => setProofForm((p) => ({ ...p, impressions: e.target.value }))}
                />
                {proofErrors.impressions ? <p className="mt-error">{proofErrors.impressions}</p> : null}
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-proof-ink">
                  用墨
                </label>
                <input
                  id="inline-proof-ink"
                  data-testid="inline-proof-ink"
                  className="mt-input"
                  value={proofForm.ink}
                  onChange={(e) => setProofForm((p) => ({ ...p, ink: e.target.value }))}
                />
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-proof-clarity">
                  清晰度评价
                </label>
                <select
                  id="inline-proof-clarity"
                  data-testid="inline-proof-clarity"
                  className="mt-input"
                  value={proofForm.clarity}
                  onChange={(e) => setProofForm((p) => ({ ...p, clarity: e.target.value as ClarityLevel }))}
                >
                  {CLARITY_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-proof-sampleno">
                  样张编号
                </label>
                <input
                  id="inline-proof-sampleno"
                  data-testid="inline-proof-sampleno"
                  className="mt-input"
                  value={proofForm.sampleNo}
                  onChange={(e) => setProofForm((p) => ({ ...p, sampleNo: e.target.value }))}
                />
                {proofErrors.sampleNo ? <p className="mt-error">{proofErrors.sampleNo}</p> : null}
              </div>
              <div>
                <label className="mt-label" htmlFor="inline-proof-date">
                  试印日期
                </label>
                <input
                  id="inline-proof-date"
                  data-testid="inline-proof-date"
                  type="date"
                  className="mt-input"
                  value={proofForm.proofDate}
                  onChange={(e) => setProofForm((p) => ({ ...p, proofDate: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="mt-btn mt-btn-primary" data-testid="inline-proof-submit">
              登记试印
            </button>
          </form>
        </div>
      </section>

      <p className="text-[11px] text-ink-mute">
        字号档位共 {TYPE_SIZES.length} 档（初号 42pt 至八号 5pt）；材质枚举：
        {MATRIX_MATERIALS.join(' / ')}；字体枚举：{MATRIX_FONTS.join(' / ')}。
      </p>
    </div>
  );
}
