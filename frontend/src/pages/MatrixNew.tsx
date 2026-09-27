import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterPicker from '../components/common/CharacterPicker';
import MatrixCell from '../components/common/MatrixCell';
import { DRAFT_KEYS, useLocalDraft } from '../hooks/useLocalDraft';
import { useMatrixStore } from '../stores/matrixStore';
import { useUiStore } from '../stores/uiStore';
import {
  BODY_HEIGHT_RANGE,
  FACE_WIDTH_RANGE,
  MADE_YEAR_RANGE,
  MATRIX_FONTS,
  MATRIX_MATERIALS,
  TYPE_SIZES,
  ptOfSize,
  validateMatrixInput,
  type MatrixFont,
  type MatrixInput,
  type MatrixMaterial,
} from '../types/matrix';
import { lookupChar } from '../utils/charIndex';
import { suggestMatrixCode } from '../utils/format';

interface MatrixFormState {
  character: string;
  code: string;
  font: MatrixFont;
  sizeName: string;
  material: MatrixMaterial;
  faceWidthMm: string;
  bodyHeightMm: string;
  madeYear: string;
  engraver: string;
  note: string;
}

const INITIAL_FORM: MatrixFormState = {
  character: '',
  code: '',
  font: '宋体',
  sizeName: '五号',
  material: '铅合金',
  faceWidthMm: '3.7',
  bodyHeightMm: '5.6',
  madeYear: '1985',
  engraver: '',
  note: '',
};

/** `/matrices/new` 字模登记：字符选择器校验部首笔画，草稿落 localStorage */
export default function MatrixNew() {
  const navigate = useNavigate();
  const matrices = useMatrixStore((s) => s.matrices);
  const createMatrix = useMatrixStore((s) => s.createMatrix);
  const pushToast = useUiStore((s) => s.pushToast);
  const { draft, patch, reset, savedAt, existed } = useLocalDraft<MatrixFormState>(
    DRAFT_KEYS.matrixNew,
    INITIAL_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const suggestedCode = useMemo(
    () => suggestMatrixCode(Number(draft.madeYear) || new Date().getFullYear(), matrices.length + 1),
    [draft.madeYear, matrices.length],
  );

  const meta = lookupChar(draft.character);
  const previewSizePt = ptOfSize(draft.sizeName);

  const buildInput = (): Partial<MatrixInput> => ({
    character: draft.character,
    code: draft.code,
    font: draft.font,
    sizeName: draft.sizeName,
    material: draft.material,
    faceWidthMm: Number(draft.faceWidthMm),
    bodyHeightMm: Number(draft.bodyHeightMm),
    madeYear: Number(draft.madeYear),
    engraver: draft.engraver,
    note: draft.note,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateMatrixInput(buildInput());
    setErrors(next);
    if (Object.keys(next).length > 0) {
      pushToast('登记未通过校验，请按提示修正', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const row = await createMatrix(buildInput() as MatrixInput);
      pushToast(`已登记字模「${row.character}」${row.code}`);
      reset();
      navigate(`/matrices/${row.id}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : '登记失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-title" data-testid="matrix-new-title">
            字模登记
          </h2>
          <p className="mt-sub">
            输入字符后按部首与笔画校验并给出候选，再填写字体、字号、材质与制作年代。
          </p>
        </div>
        <span className="mt-sub" data-testid="draft-status">
          {existed ? `草稿已恢复 · 最近保存 ${savedAt || '—'}` : `草稿自动保存 ${savedAt || '—'}`}
        </span>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <form className="mt-panel space-y-4 px-4 py-4" onSubmit={handleSubmit} data-testid="matrix-form">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <CharacterPicker
                value={draft.character}
                onChange={(char) => {
                  patch({ character: char });
                  setErrors((prev) => ({ ...prev, character: '' }));
                }}
                label="字符"
                testId="character-picker"
              />
              {errors.character ? (
                <p className="mt-error" data-testid="error-character">
                  {errors.character}
                </p>
              ) : null}
              <p className="mt-hint" data-testid="char-index-hint">
                {draft.character
                  ? meta
                    ? `索引：部首 ${meta.radical} · ${meta.strokes} 画 · 拼音 ${meta.pinyin}`
                    : `「${draft.character}」未收录索引，将按自定义字符登记`
                  : '请输入或点选一个字符'}
              </p>
            </div>

            <div>
              <label className="mt-label" htmlFor="code-input">
                字模编号
              </label>
              <div className="flex gap-2">
                <input
                  id="code-input"
                  data-testid="code-input"
                  className="mt-input"
                  value={draft.code}
                  placeholder={suggestedCode}
                  onChange={(e) => patch({ code: e.target.value })}
                />
                <button
                  type="button"
                  className="mt-btn whitespace-nowrap"
                  data-testid="suggest-code-btn"
                  onClick={() => patch({ code: suggestedCode })}
                >
                  用建议编号
                </button>
              </div>
              {errors.code ? (
                <p className="mt-error" data-testid="error-code">
                  {errors.code}
                </p>
              ) : (
                <p className="mt-hint">建议编号：{suggestedCode}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mt-label" htmlFor="font-select">
                字体
              </label>
              <select
                id="font-select"
                data-testid="font-select"
                className="mt-input"
                value={draft.font}
                onChange={(e) => patch({ font: e.target.value as MatrixFont })}
              >
                {MATRIX_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {errors.font ? (
                <p className="mt-error" data-testid="error-font">
                  {errors.font}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mt-label" htmlFor="size-select">
                字号（含对应磅值）
              </label>
              <select
                id="size-select"
                data-testid="size-select"
                className="mt-input"
                value={draft.sizeName}
                onChange={(e) => patch({ sizeName: e.target.value })}
              >
                {TYPE_SIZES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} · {s.pt} pt
                  </option>
                ))}
              </select>
              {errors.sizeName ? (
                <p className="mt-error" data-testid="error-sizeName">
                  {errors.sizeName}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mt-label" htmlFor="material-select">
                材质
              </label>
              <select
                id="material-select"
                data-testid="material-select"
                className="mt-input"
                value={draft.material}
                onChange={(e) => patch({ material: e.target.value as MatrixMaterial })}
              >
                {MATRIX_MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.material ? (
                <p className="mt-error" data-testid="error-material">
                  {errors.material}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mt-label" htmlFor="face-width-input">
                字面尺寸 mm
              </label>
              <input
                id="face-width-input"
                data-testid="face-width-input"
                className="mt-input"
                type="number"
                min={FACE_WIDTH_RANGE.min}
                max={FACE_WIDTH_RANGE.max}
                step={0.1}
                value={draft.faceWidthMm}
                onChange={(e) => patch({ faceWidthMm: e.target.value })}
              />
              {errors.faceWidthMm ? (
                <p className="mt-error" data-testid="error-faceWidthMm">
                  {errors.faceWidthMm}
                </p>
              ) : (
                <p className="mt-hint">
                  {FACE_WIDTH_RANGE.min}–{FACE_WIDTH_RANGE.max} mm
                </p>
              )}
            </div>
            <div>
              <label className="mt-label" htmlFor="body-height-input">
                字身高度 mm
              </label>
              <input
                id="body-height-input"
                data-testid="body-height-input"
                className="mt-input"
                type="number"
                min={BODY_HEIGHT_RANGE.min}
                max={BODY_HEIGHT_RANGE.max}
                step={0.1}
                value={draft.bodyHeightMm}
                onChange={(e) => patch({ bodyHeightMm: e.target.value })}
              />
              {errors.bodyHeightMm ? (
                <p className="mt-error" data-testid="error-bodyHeightMm">
                  {errors.bodyHeightMm}
                </p>
              ) : (
                <p className="mt-hint">
                  {BODY_HEIGHT_RANGE.min}–{BODY_HEIGHT_RANGE.max} mm
                </p>
              )}
            </div>
            <div>
              <label className="mt-label" htmlFor="made-year-input">
                制作年代
              </label>
              <input
                id="made-year-input"
                data-testid="made-year-input"
                className="mt-input"
                type="number"
                min={MADE_YEAR_RANGE.min}
                max={MADE_YEAR_RANGE.max}
                step={1}
                value={draft.madeYear}
                onChange={(e) => patch({ madeYear: e.target.value })}
              />
              {errors.madeYear ? (
                <p className="mt-error" data-testid="error-madeYear">
                  {errors.madeYear}
                </p>
              ) : (
                <p className="mt-hint">
                  {MADE_YEAR_RANGE.min}–{MADE_YEAR_RANGE.max}
                </p>
              )}
            </div>
            <div>
              <label className="mt-label" htmlFor="engraver-input">
                刻工
              </label>
              <input
                id="engraver-input"
                data-testid="engraver-input"
                className="mt-input"
                placeholder="例：王守仁"
                value={draft.engraver}
                onChange={(e) => patch({ engraver: e.target.value })}
              />
              {errors.engraver ? (
                <p className="mt-error" data-testid="error-engraver">
                  {errors.engraver}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mt-label" htmlFor="note-input">
              备注
            </label>
            <input
              id="note-input"
              data-testid="note-input"
              className="mt-input"
              placeholder="例：馆藏一号铜模，字面平整"
              value={draft.note}
              onChange={(e) => patch({ note: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-paper-line pt-3">
            <button
              type="submit"
              className="mt-btn mt-btn-primary"
              data-testid="submit-matrix"
              disabled={submitting}
            >
              {submitting ? '登记中…' : '登记字模'}
            </button>
            <button
              type="button"
              className="mt-btn"
              data-testid="reset-draft"
              onClick={() => {
                reset();
                setErrors({});
                pushToast('已清空登记草稿', 'warn');
              }}
            >
              清空草稿
            </button>
            <span className="mt-sub">提交后自动进入该字模详情页</span>
          </div>
        </form>

        <aside className="space-y-3">
          <div className="mt-panel px-4 py-4">
            <h3 className="font-song text-sm font-semibold text-ink">字面预览</h3>
            <p className="mt-sub">按当前填写的字号与状态渲染单字格</p>
            <div className="mt-3 max-w-[200px]">
              <MatrixCell
                character={draft.character || '字'}
                sizeName={draft.sizeName}
                sizePt={previewSizePt}
                code={draft.code || suggestedCode}
                font={draft.font}
                material={draft.material}
                availability="可用"
                testId="preview-cell"
              />
            </div>
            <dl className="mt-3 space-y-1 text-xs text-ink-soft">
              <div className="flex justify-between gap-2">
                <dt>字号磅值</dt>
                <dd data-testid="preview-pt">{previewSizePt} pt</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>字面尺寸</dt>
                <dd>{draft.faceWidthMm || '—'} mm</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>字身高度</dt>
                <dd>{draft.bodyHeightMm || '—'} mm</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>制作年代</dt>
                <dd>{draft.madeYear || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-panel px-4 py-4 text-xs leading-relaxed text-ink-soft">
            <h3 className="font-song text-sm font-semibold text-ink">登记说明</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>字符必须为单个汉字，未收录索引的字符按自定义字符登记。</li>
              <li>字面尺寸与字身高度决定能否装入选定字盘格位。</li>
              <li>登记后字模默认「可用」，可在详情页登记缺损并停用。</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
