import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}

/** 空态面板：档案为空、字盘未选中、字模不存在时统一展示 */
export default function EmptyState({ title, description, action, testId = 'empty-state' }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-paper-line bg-white/50 px-6 py-10 text-center"
      data-testid={testId}
    >
      <div className="font-song text-3xl text-paper-line">字</div>
      <div className="font-song text-sm font-semibold text-ink-soft">{title}</div>
      {description ? <p className="max-w-md text-xs leading-relaxed text-ink-mute">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
