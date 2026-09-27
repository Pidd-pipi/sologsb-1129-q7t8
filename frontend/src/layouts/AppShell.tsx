import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import { useMatrixStore } from '../stores/matrixStore';
import { useUiStore } from '../stores/uiStore';

const NAV = [
  { to: '/', label: '字模总览', testId: 'nav-overview', end: true },
  { to: '/matrices/new', label: '字模登记', testId: 'nav-matrix-new', end: false },
  { to: '/cases', label: '字盘布局', testId: 'nav-cases', end: false },
  { to: '/defects', label: '缺损登记', testId: 'nav-defects', end: false },
  { to: '/proofs', label: '试印记录', testId: 'nav-proofs', end: false },
];

const TOAST_STYLE: Record<string, string> = {
  ok: 'border-jade/50 bg-jade-pale text-jade',
  warn: 'border-brass/50 bg-brass-pale text-brass',
  error: 'border-seal/50 bg-seal-pale text-seal',
};

export default function AppShell() {
  const location = useLocation();
  const loadMatrices = useMatrixStore((s) => s.load);
  const loadCases = useCaseStore((s) => s.load);
  const matrixCount = useMatrixStore((s) => s.matrices.length);
  const disabledCount = useMatrixStore(
    (s) => s.matrices.filter((m) => m.availability === '停用').length,
  );
  const repairCount = useMatrixStore(
    (s) => s.matrices.filter((m) => m.availability === '待补刻').length,
  );
  const caseCount = useCaseStore((s) => s.cases.length);
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    void loadMatrices();
    void loadCases();
  }, [loadMatrices, loadCases]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => clearToast(), 3600);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-paper-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded border border-ink/20 bg-seal font-song text-lg text-paper shadow-press">
              字
            </span>
            <div className="leading-tight">
              <h1 className="font-song text-base font-semibold tracking-wide text-ink">
                活字字模与铅字档案
              </h1>
              <p className="text-[11px] tracking-[0.22em] text-ink-mute">GBMOVABLETYPE ARCHIVE</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1 md:ml-6" data-testid="main-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={item.testId}
                className={({ isActive }) =>
                  `mt-nav-link ${isActive ? 'mt-nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="mt-chip" data-testid="count-matrices">
              字模 {matrixCount}
            </span>
            <span className="mt-chip" data-testid="count-cases">
              字盘 {caseCount}
            </span>
            <span className="mt-chip border-seal/40 text-seal" data-testid="count-disabled">
              停用 {disabledCount}
            </span>
            <span className="mt-chip border-brass/40 text-brass" data-testid="count-repair">
              待补刻 {repairCount}
            </span>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="mx-auto w-full max-w-[1220px] px-5 pt-3">
          <div
            className={`rounded border px-3 py-2 text-sm ${TOAST_STYLE[toast.kind] ?? TOAST_STYLE.ok}`}
            data-testid="toast"
            role="status"
          >
            {toast.text}
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[1220px] flex-1 px-5 pb-12 pt-4">
        <Outlet />
      </main>

      <footer className="border-t border-paper-line bg-paper-deep/60">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-2 px-5 py-3 text-[11px] text-ink-mute">
          <span>数据全部保存在本机浏览器（IndexedDB：gbmovabletype-db；草稿：localStorage）</span>
          <span>纯前端单页应用 · 无需后端服务 · gbmovabletype</span>
        </div>
      </footer>
    </div>
  );
}
