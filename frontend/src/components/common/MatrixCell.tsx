import type { DefectLog } from '../../types/defect';
import type { MatrixAvailability } from '../../types/matrix';
import { radicalOf, strokesOf } from '../../utils/charIndex';
import { dash } from '../../utils/format';
import DefectBadge from './DefectBadge';

export interface MatrixCellProps {
  character: string;
  sizeName?: string;
  sizePt?: number;
  code?: string;
  font?: string;
  material?: string;
  availability?: MatrixAvailability;
  /** 该字模最新一条缺损记录，用于缺损角标 */
  defect?: DefectLog | null;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  testId?: string;
}

const AVAILABILITY_RING: Record<string, string> = {
  可用: 'border-paper-line hover:border-jade',
  停用: 'border-seal/60',
  待补刻: 'border-brass/60',
};

const AVAILABILITY_DOT: Record<string, string> = {
  可用: 'bg-jade',
  停用: 'bg-seal',
  待补刻: 'bg-brass',
};

/** 单字格：渲染字符大样、字号与状态，被总览页 / 字模登记页 / 字模详情页复用 */
export default function MatrixCell({
  character,
  sizeName,
  sizePt,
  code,
  font,
  material,
  availability,
  defect,
  selected = false,
  compact = false,
  onClick,
  testId = 'matrix-cell',
}: MatrixCellProps) {
  const ring = availability ? AVAILABILITY_RING[availability] : 'border-paper-line';
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex w-full flex-col items-center justify-between rounded-md border bg-white/80 p-2 text-center transition ${ring} ${
        selected ? 'ring-2 ring-seal/50' : ''
      } ${onClick ? 'cursor-pointer hover:shadow-card' : ''}`}
      data-testid={testId}
      data-character={character}
      data-availability={availability ?? ''}
    >
      {availability ? (
        <span
          className={`absolute left-2 top-2 h-1.5 w-1.5 rounded-full ${
            AVAILABILITY_DOT[availability] ?? 'bg-ink-mute'
          }`}
          title={availability}
          aria-hidden="true"
        />
      ) : null}
      <span
        className={`font-song leading-none text-ink ${compact ? 'text-2xl' : 'text-4xl'}`}
        data-testid={`${testId}-char`}
      >
        {character || '·'}
      </span>
      <span className="mt-1 w-full truncate font-song text-[11px] text-ink-soft">
        {dash(sizeName)}
        {sizePt ? <span className="text-ink-mute"> {sizePt}pt</span> : null}
      </span>
      {!compact ? (
        <span className="w-full truncate text-[10px] text-ink-mute">
          {dash(font)} · {dash(material)}
        </span>
      ) : null}
      {code ? <span className="w-full truncate text-[10px] tracking-wide text-ink-mute">{code}</span> : null}
      <span className="sr-only">
        部首 {radicalOf(character)} · {strokesOf(character)} 画
      </span>
      {defect ? (
        <span className="absolute -right-1 -top-1">
          <DefectBadge
            type={defect.defectType}
            severity={defect.severity}
            compact
            testId={`${testId}-defect`}
          />
        </span>
      ) : null}
    </div>
  );
}
