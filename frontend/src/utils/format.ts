/** 通用格式化与小工具 */

/** 生成带前缀的本地唯一 id */
export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}

/** 今天的日期，YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 在指定日期上增加天数 */
export function addDays(dateStr: string, days: number): string {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  const m = `${base.getMonth() + 1}`.padStart(2, '0');
  const day = `${base.getDate()}`.padStart(2, '0');
  return `${base.getFullYear()}-${m}-${day}`;
}

/** 日期字符串比较，a 早于 b 返回负数 */
export function compareDate(a: string, b: string): number {
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** YYYY-MM-DD → YYYY年M月D日 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${y}年${Number(m)}月${Number(d)}日`;
}

/** 时间戳 → YYYY-MM-DD HH:mm */
export function formatStamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 空值统一显示为破折号 */
export function dash(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '—';
  const s = String(text).trim();
  return s ? s : '—';
}

/** 百分比，保留一位小数 */
export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/** 数字保留指定小数位（去掉多余的 0） */
export function num(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${Number(value.toFixed(digits))}`;
}

/** 生成字模编号建议，例：ZM-1985-007 */
export function suggestMatrixCode(year: number, seq: number): string {
  return `ZM-${year}-${`${seq}`.padStart(3, '0')}`;
}

/** 生成字盘编号建议，例：ZP-A-01 */
export function suggestCaseCode(seq: number): string {
  const letter = String.fromCharCode(65 + ((seq - 1) % 26));
  const num2 = `${seq}`.padStart(2, '0');
  return `ZP-${letter}-${num2}`;
}

/** 生成样张编号建议，例：YZ-20250520-03 */
export function suggestSampleNo(dateStr: string, seq: number): string {
  const compact = (dateStr || todayStr()).replace(/-/g, '');
  return `YZ-${compact}-${`${seq}`.padStart(2, '0')}`;
}

/** 简单文本截断 */
export function truncate(text: string, len: number): string {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

/** 按字符分组（用于统计） */
export function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyOf(item) || '未填写';
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * 脱代理：Zustand / React 状态对象直接写 IndexedDB 会抛 DataCloneError，
 * 落库前统一做一次纯对象深拷贝。
 */
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
