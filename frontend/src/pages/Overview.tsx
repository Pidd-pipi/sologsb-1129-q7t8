import { Link } from 'react-router-dom';
import DefectBadge from '../components/common/DefectBadge';
import EmptyState from '../components/common/EmptyState';
import MatrixCell from '../components/common/MatrixCell';
import { useMatrixSearch } from '../hooks/useMatrixSearch';
import { useMatrixStore } from '../stores/matrixStore';
import { useUiStore } from '../stores/uiStore';
import {
  MATRIX_AVAILABILITIES,
  MATRIX_FONTS,
  MATRIX_MATERIALS,
  MATRIX_SIZE_NAMES,
} from '../types/matrix';
import { pinyinOf, radicalOf, strokesOf } from '../utils/charIndex';
import { dash, formatStamp, percent } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'strokes', label: '按部首笔画排序' },
  { value: 'radical', label: '按部首排序' },
  { value: 'pinyin', label: '按拼音排序' },
  { value: 'char', label: '按字符排序' },
  { value: 'code', label: '按字模编号排序' },
] as const;

/** `/` 字模总览：筛选 + 排序 + 卡片大样 + 缺损角标 */
export default function Overview() {
  const matrices = useMatrixStore((s) => s.matrices);
  const defects = useMatrixStore((s) => s.defects);
  const loading = useMatrixStore((s) => s.loading);
  const error = useMatrixStore((s) => s.error);
  const filter = useUiStore((s) => s.filter);
  const setFilter = useUiStore((s) => s.setFilter);
  const resetFilter = useUiStore((s) => s.resetFilter);
  const { results, countByAvailability, latestDefect } = useMatrixSearch();

  const total = matrices.length;
  const available = matrices.filter((m) => m.availability === '可用').length;
  const disabled = matrices.filter((m) => m.availability === '停用').length;
  const repair = matrices.filter((m) => m.availability === '待补刻').length;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-title" data-testid="overview-title">
            字模总览
          </h2>
          <p className="mt-sub">
            按字体、字号、材质与可用性筛选馆藏字模；卡片展示字符大样与缺损角标，可按部首笔画排序。
          </p>
        </div>
        <div className="flex gap-2" data-testid="overview-stats">
          <span className="mt-chip" data-testid="stat-total">
            合计 {total}
          </span>
          <span className="mt-chip border-jade/40 text-jade" data-testid="stat-available">
            可用 {available}
          </span>
          <span className="mt-chip border-seal/40 text-seal" data-testid="stat-disabled">
            停用 {disabled}
          </span>
          <span className="mt-chip border-brass/40 text-brass" data-testid="stat-repair">
            待补刻 {repair}
          </span>
        </div>
      </section>

      <section className="mt-panel" data-testid="filter-panel">
        <div className="mt-panel-head">
          <h3 className="font-song text-sm font-semibold text-ink">检索条件</h3>
          <div className="flex items-center gap-2">
            <span className="mt-sub" data-testid="result-count">
              命中 {results.length} / {total} 枚
            </span>
            <button type="button" className="mt-btn" data-testid="filter-reset" onClick={resetFilter}>
              重置筛选
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mt-label" htmlFor="filter-font">
              字体
            </label>
            <select
              id="filter-font"
              data-testid="filter-font"
              className="mt-input"
              value={filter.font}
              onChange={(e) => setFilter({ font: e.target.value as typeof filter.font })}
            >
              <option value="">全部字体</option>
              {MATRIX_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mt-label" htmlFor="filter-size">
              字号
            </label>
            <select
              id="filter-size"
              data-testid="filter-size"
              className="mt-input"
              value={filter.sizeName}
              onChange={(e) => setFilter({ sizeName: e.target.value })}
            >
              <option value="">全部字号</option>
              {MATRIX_SIZE_NAMES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mt-label" htmlFor="filter-material">
              材质
            </label>
            <select
              id="filter-material"
              data-testid="filter-material"
              className="mt-input"
              value={filter.material}
              onChange={(e) => setFilter({ material: e.target.value as typeof filter.material })}
            >
              <option value="">全部材质</option>
              {MATRIX_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mt-label" htmlFor="filter-availability">
              可用性
            </label>
            <select
              id="filter-availability"
              data-testid="filter-availability"
              className="mt-input"
              value={filter.availability}
              onChange={(e) =>
                setFilter({ availability: e.target.value as typeof filter.availability })
              }
            >
              <option value="">全部状态</option>
              {MATRIX_AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mt-label" htmlFor="filter-keyword">
              字符 / 拼音 / 编号
            </label>
            <input
              id="filter-keyword"
              data-testid="filter-keyword"
              className="mt-input"
              placeholder="例：活 / huo / h / ZM-1985"
              value={filter.keyword}
              onChange={(e) => setFilter({ keyword: e.target.value })}
            />
          </div>
          <div>
            <label className="mt-label" htmlFor="filter-sort">
              排序
            </label>
            <select
              id="filter-sort"
              data-testid="filter-sort"
              className="mt-input"
              value={filter.sortBy}
              onChange={(e) => setFilter({ sortBy: e.target.value as typeof filter.sortBy })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-paper-line px-4 py-2 text-[11px] text-ink-mute">
          {MATRIX_AVAILABILITIES.map((a) => (
            <span key={a}>
              {a} {countByAvailability[a] ?? 0} 枚
            </span>
          ))}
          <span>· 角标为最新缺损记录</span>
        </div>
      </section>

      {error ? (
        <div className="rounded border border-seal/40 bg-seal-pale px-3 py-2 text-sm text-seal" data-testid="overview-error">
          {error}
        </div>
      ) : null}

      {loading && results.length === 0 ? (
        <div className="mt-panel px-4 py-6 text-sm text-ink-mute" data-testid="overview-loading">
          正在读取本机字模档案…
        </div>
      ) : null}

      {!loading && results.length === 0 ? (
        <EmptyState
          title="没有符合条件的字模"
          description="可以放宽字体 / 字号 / 材质条件，或先去「字模登记」录入一枚新字模。"
          action={
            <Link className="mt-btn mt-btn-primary" to="/matrices/new" data-testid="empty-goto-new">
              去登记字模
            </Link>
          }
        />
      ) : null}

      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
        data-testid="matrix-list"
      >
        {results.map((m) => {
          const defect = latestDefect(m.id);
          return (
            <div key={m.id} className="space-y-1">
              <Link to={`/matrices/${m.id}`} data-testid={`matrix-link-${m.id}`} className="block">
                <MatrixCell
                  character={m.character}
                  sizeName={m.sizeName}
                  sizePt={m.sizePt}
                  code={m.code}
                  font={m.font}
                  material={m.material}
                  availability={m.availability}
                  defect={defect}
                  testId={`matrix-card-${m.id}`}
                />
              </Link>
              <div className="flex items-center justify-between px-0.5 text-[10px] text-ink-mute">
                <span>
                  部首 {radicalOf(m.character)} · {strokesOf(m.character) || '—'} 画
                </span>
                <span>{pinyinOf(m.character) || '未收录'}</span>
              </div>
              {defect ? (
                <div className="flex items-center justify-between gap-1 px-0.5">
                  <DefectBadge
                    type={defect.defectType}
                    severity={defect.severity}
                    testId={`overview-defect-${m.id}`}
                  />
                  <span className="text-[10px] text-ink-mute">{defect.foundDate}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="mt-panel" data-testid="overview-summary">
        <div className="mt-panel-head">
          <h3 className="font-song text-sm font-semibold text-ink">档案摘要</h3>
          <span className="mt-sub">缺损记录 {defects.length} 条</span>
        </div>
        <div className="grid grid-cols-1 gap-3 px-4 py-3 text-xs text-ink-soft md:grid-cols-3">
          <p>
            可用率：{percent(available, total)}%（可用 {available} / 合计 {total}）
          </p>
          <p>停用字模：{disabled} 枚，需补刻或重铸后方可回到排字工位</p>
          <p>
            最近更新：
            {matrices[0] ? `${dash(matrices[0].code)} · ${formatStamp(matrices[0].updatedAt)}` : '—'}
          </p>
        </div>
      </section>
    </div>
  );
}
