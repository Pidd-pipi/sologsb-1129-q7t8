import type { DefectSeverity, DefectType } from '../../types/defect';

export interface DefectBadgeProps {
  type: DefectType | string;
  severity: DefectSeverity | string;
  /** 可用性结论：可用 / 停用 / 待补刻 */
  availability?: string;
  compact?: boolean;
  testId?: string;
}

const SEVERITY_STYLE: Record<string, string> = {
  重: 'border-seal/40 bg-seal-pale text-seal',
  中: 'border-brass/40 bg-brass-pale text-brass',
  轻: 'border-jade/40 bg-jade-pale text-jade',
};

const AVAILABILITY_STYLE: Record<string, string> = {
  可用: 'border-jade/40 bg-white text-jade',
  停用: 'border-seal/50 bg-seal text-paper',
  待补刻: 'border-brass/50 bg-brass text-paper',
};

/** 缺损类型与程度标签：被总览页、字模详情页与缺损登记页复用 */
export default function DefectBadge({
  type,
  severity,
  availability,
  compact = false,
  testId = 'defect-badge',
}: DefectBadgeProps) {
  const sevStyle = SEVERITY_STYLE[severity] ?? 'border-paper-line bg-white text-ink-soft';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } ${sevStyle}`}
      data-testid={testId}
      data-defect-type={type}
      data-severity={severity}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      <span>
        {type}·{severity}
      </span>
      {availability ? (
        <span
          className={`ml-0.5 rounded-full border px-1.5 ${
            AVAILABILITY_STYLE[availability] ?? 'border-paper-line text-ink-mute'
          }`}
          data-testid={`${testId}-availability`}
        >
          {availability}
        </span>
      ) : null}
    </span>
  );
}
