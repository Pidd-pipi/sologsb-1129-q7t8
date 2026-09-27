import { useMemo, useState } from 'react';
import {
  lookupChar,
  pinyinOf,
  radicalOf,
  RADICAL_OPTIONS,
  searchChars,
  strokesOf,
  STROKE_OPTIONS,
  type CharMeta,
} from '../../utils/charIndex';

export interface CharacterPickerProps {
  value: string;
  onChange: (char: string, meta?: CharMeta) => void;
  label?: string;
  /** data-testid 前缀，默认 character-picker */
  testId?: string;
  /** 只显示候选，不显示筛选行 */
  compact?: boolean;
}

const CJK_RE = /[\u3400-\u9fff\uf900-\ufaff]/;

/** 按部首、笔画、拼音检索字符的选择器，被字模登记页与字盘页复用 */
export default function CharacterPicker({
  value,
  onChange,
  label = '字符',
  testId = 'character-picker',
  compact = false,
}: CharacterPickerProps) {
  const [text, setText] = useState('');
  const [radical, setRadical] = useState('');
  const [strokes, setStrokes] = useState<number | ''>('');

  const candidates = useMemo(() => searchChars({ text, radical, strokes }, 48), [text, radical, strokes]);
  const meta = lookupChar(value);

  const handleInput = (raw: string) => {
    setText(raw);
    const trimmed = raw.trim();
    const first = Array.from(trimmed)[0] ?? '';
    if (first && CJK_RE.test(first) && Array.from(trimmed).length === 1) {
      onChange(first, lookupChar(first));
    }
  };

  return (
    <div data-testid={testId}>
      {label ? (
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor={`${testId}-input`}>
          {label}
          {value ? (
            <span className="ml-2 font-song text-sm text-seal" data-testid={`${testId}-value`}>
              已选：{value}
            </span>
          ) : null}
        </label>
      ) : null}

      <input
        id={`${testId}-input`}
        data-testid={`${testId}-input`}
        className="mt-input"
        placeholder="输入一个汉字，或输入拼音 / 拼音首字母检索"
        value={text}
        onChange={(e) => handleInput(e.target.value)}
      />

      {!compact ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            className="mt-input w-auto"
            aria-label="按部首筛选"
            data-testid={`${testId}-radical`}
            value={radical}
            onChange={(e) => setRadical(e.target.value)}
          >
            <option value="">全部部首</option>
            {RADICAL_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="mt-input w-auto"
            aria-label="按笔画筛选"
            data-testid={`${testId}-strokes`}
            value={strokes === '' ? '' : String(strokes)}
            onChange={(e) => setStrokes(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">全部笔画</option>
            {STROKE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} 画
              </option>
            ))}
          </select>
          <span className="text-[11px] text-ink-mute" data-testid={`${testId}-count`}>
            候选 {candidates.length} 字
          </span>
        </div>
      ) : null}

      <div className="mt-2 flex max-h-36 flex-wrap gap-1 overflow-y-auto rounded border border-paper-line bg-paper/40 p-2">
        {candidates.length === 0 ? (
          <span className="text-[11px] text-ink-mute">没有匹配的候选字符，请调整部首 / 笔画 / 拼音</span>
        ) : (
          candidates.map((c) => (
            <button
              key={c.char}
              type="button"
              onClick={() => onChange(c.char, c)}
              title={`${c.radical} · ${c.strokes} 画 · ${c.pinyin}`}
              data-testid={`${testId}-option-${c.char}`}
              className={`h-8 w-8 rounded border font-song text-base leading-none transition ${
                value === c.char
                  ? 'border-seal bg-seal text-paper'
                  : 'border-paper-line bg-white text-ink hover:border-seal'
              }`}
            >
              {c.char}
            </button>
          ))
        )}
      </div>

      <p className="mt-2 text-[11px] text-ink-mute" data-testid={`${testId}-meta`}>
        {value
          ? meta
            ? `部首 ${meta.radical} · ${meta.strokes} 画 · 拼音 ${meta.pinyin}`
            : `「${value}」未收录索引：按自定义字符登记，无部首与笔画信息`
          : '尚未选择字符'}
      </p>

      {value ? (
        <p className="text-[11px] text-ink-mute">
          校验：部首 {radicalOf(value)} · 笔画 {strokesOf(value) || '—'} · 拼音 {pinyinOf(value) || '—'}
        </p>
      ) : null}
    </div>
  );
}
