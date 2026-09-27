/**
 * 字符索引：部首、笔画数与拼音。
 * 用于活字登记时的校验、候选推荐，以及总览页按部首 / 笔画排序。
 */

export interface CharMeta {
  char: string;
  radical: string;
  strokes: number;
  pinyin: string;
}

export const CHAR_INDEX: CharMeta[] = [
  { char: '活', radical: '氵', strokes: 9, pinyin: 'huo' },
  { char: '字', radical: '子', strokes: 6, pinyin: 'zi' },
  { char: '印', radical: '卩', strokes: 5, pinyin: 'yin' },
  { char: '刷', radical: '刂', strokes: 8, pinyin: 'shua' },
  { char: '铅', radical: '钅', strokes: 10, pinyin: 'qian' },
  { char: '排', radical: '扌', strokes: 11, pinyin: 'pai' },
  { char: '版', radical: '片', strokes: 8, pinyin: 'ban' },
  { char: '模', radical: '木', strokes: 14, pinyin: 'mo' },
  { char: '铸', radical: '钅', strokes: 12, pinyin: 'zhu' },
  { char: '刻', radical: '刂', strokes: 8, pinyin: 'ke' },
  { char: '铜', radical: '钅', strokes: 11, pinyin: 'tong' },
  { char: '木', radical: '木', strokes: 4, pinyin: 'mu' },
  { char: '宋', radical: '宀', strokes: 7, pinyin: 'song' },
  { char: '楷', radical: '木', strokes: 13, pinyin: 'kai' },
  { char: '仿', radical: '亻', strokes: 6, pinyin: 'fang' },
  { char: '体', radical: '亻', strokes: 7, pinyin: 'ti' },
  { char: '盘', radical: '皿', strokes: 11, pinyin: 'pan' },
  { char: '缺', radical: '缶', strokes: 10, pinyin: 'que' },
  { char: '笔', radical: '竹', strokes: 10, pinyin: 'bi' },
  { char: '磨', radical: '石', strokes: 16, pinyin: 'mo' },
  { char: '损', radical: '扌', strokes: 10, pinyin: 'sun' },
  { char: '变', radical: '又', strokes: 8, pinyin: 'bian' },
  { char: '形', radical: '彡', strokes: 7, pinyin: 'xing' },
  { char: '锈', radical: '钅', strokes: 12, pinyin: 'xiu' },
  { char: '蚀', radical: '饣', strokes: 9, pinyin: 'shi' },
  { char: '断', radical: '斤', strokes: 11, pinyin: 'duan' },
  { char: '裂', radical: '衣', strokes: 12, pinyin: 'lie' },
  { char: '补', radical: '衤', strokes: 7, pinyin: 'bu' },
  { char: '可', radical: '口', strokes: 5, pinyin: 'ke' },
  { char: '用', radical: '用', strokes: 5, pinyin: 'yong' },
  { char: '停', radical: '亻', strokes: 11, pinyin: 'ting' },
  { char: '轻', radical: '车', strokes: 9, pinyin: 'qing' },
  { char: '中', radical: '丨', strokes: 4, pinyin: 'zhong' },
  { char: '重', radical: '里', strokes: 9, pinyin: 'zhong' },
  { char: '清', radical: '氵', strokes: 11, pinyin: 'qing' },
  { char: '晰', radical: '日', strokes: 12, pinyin: 'xi' },
  { char: '偏', radical: '亻', strokes: 11, pinyin: 'pian' },
  { char: '淡', radical: '氵', strokes: 11, pinyin: 'dan' },
  { char: '糊', radical: '米', strokes: 15, pinyin: 'hu' },
  { char: '纸', radical: '纟', strokes: 7, pinyin: 'zhi' },
  { char: '墨', radical: '土', strokes: 15, pinyin: 'mo' },
  { char: '压', radical: '厂', strokes: 6, pinyin: 'ya' },
  { char: '力', radical: '力', strokes: 2, pinyin: 'li' },
  { char: '样', radical: '木', strokes: 10, pinyin: 'yang' },
  { char: '张', radical: '弓', strokes: 7, pinyin: 'zhang' },
  { char: '记', radical: '讠', strokes: 5, pinyin: 'ji' },
  { char: '录', radical: '彐', strokes: 8, pinyin: 'lu' },
  { char: '工', radical: '工', strokes: 3, pinyin: 'gong' },
  { char: '坊', radical: '土', strokes: 7, pinyin: 'fang' },
  { char: '馆', radical: '饣', strokes: 11, pinyin: 'guan' },
  { char: '典', radical: '八', strokes: 8, pinyin: 'dian' },
  { char: '藏', radical: '艹', strokes: 17, pinyin: 'cang' },
  { char: '案', radical: '木', strokes: 10, pinyin: 'an' },
  { char: '格', radical: '木', strokes: 10, pinyin: 'ge' },
  { char: '局', radical: '尸', strokes: 7, pinyin: 'ju' },
  { char: '布', radical: '巾', strokes: 5, pinyin: 'bu' },
  { char: '位', radical: '亻', strokes: 7, pinyin: 'wei' },
  { char: '容', radical: '宀', strokes: 10, pinyin: 'rong' },
  { char: '量', radical: '里', strokes: 12, pinyin: 'liang' },
  { char: '检', radical: '木', strokes: 11, pinyin: 'jian' },
  { char: '测', radical: '氵', strokes: 9, pinyin: 'ce' },
  { char: '索', radical: '糸', strokes: 10, pinyin: 'suo' },
  { char: '引', radical: '弓', strokes: 4, pinyin: 'yin' },
  { char: '首', radical: '首', strokes: 9, pinyin: 'shou' },
  { char: '拼', radical: '扌', strokes: 9, pinyin: 'pin' },
  { char: '音', radical: '音', strokes: 9, pinyin: 'yin' },
  { char: '部', radical: '阝', strokes: 10, pinyin: 'bu' },
  { char: '画', radical: '田', strokes: 8, pinyin: 'hua' },
  { char: '数', radical: '攵', strokes: 13, pinyin: 'shu' },
  { char: '顺', radical: '页', strokes: 9, pinyin: 'shun' },
  { char: '序', radical: '广', strokes: 7, pinyin: 'xu' },
  { char: '生', radical: '生', strokes: 5, pinyin: 'sheng' },
  { char: '僻', radical: '亻', strokes: 15, pinyin: 'pi' },
  { char: '常', radical: '巾', strokes: 11, pinyin: 'chang' },
  { char: '登', radical: '癶', strokes: 12, pinyin: 'deng' },
  { char: '编', radical: '纟', strokes: 12, pinyin: 'bian' },
  { char: '号', radical: '口', strokes: 5, pinyin: 'hao' },
  { char: '年', radical: '干', strokes: 6, pinyin: 'nian' },
  { char: '代', radical: '亻', strokes: 5, pinyin: 'dai' },
  { char: '材', radical: '木', strokes: 7, pinyin: 'cai' },
  { char: '质', radical: '贝', strokes: 8, pinyin: 'zhi' },
  { char: '尺', radical: '尸', strokes: 4, pinyin: 'chi' },
  { char: '寸', radical: '寸', strokes: 3, pinyin: 'cun' },
  { char: '身', radical: '身', strokes: 7, pinyin: 'shen' },
  { char: '高', radical: '高', strokes: 10, pinyin: 'gao' },
  { char: '度', radical: '广', strokes: 9, pinyin: 'du' },
  { char: '制', radical: '刂', strokes: 8, pinyin: 'zhi' },
  { char: '作', radical: '亻', strokes: 7, pinyin: 'zuo' },
  { char: '匠', radical: '匚', strokes: 6, pinyin: 'jiang' },
  { char: '研', radical: '石', strokes: 9, pinyin: 'yan' },
  { char: '究', radical: '穴', strokes: 7, pinyin: 'jiu' },
  { char: '试', radical: '讠', strokes: 8, pinyin: 'shi' },
  { char: '验', radical: '马', strokes: 10, pinyin: 'yan' },
  { char: '恢', radical: '忄', strokes: 9, pinyin: 'hui' },
  { char: '复', radical: '夂', strokes: 9, pinyin: 'fu' },
  { char: '更', radical: '曰', strokes: 7, pinyin: 'geng' },
  { char: '换', radical: '扌', strokes: 10, pinyin: 'huan' },
  { char: '调', radical: '讠', strokes: 10, pinyin: 'tiao' },
  { char: '取', radical: '又', strokes: 8, pinyin: 'qu' },
  { char: '出', radical: '凵', strokes: 5, pinyin: 'chu' },
  { char: '空', radical: '穴', strokes: 8, pinyin: 'kong' },
  { char: '冲', radical: '冫', strokes: 6, pinyin: 'chong' },
  { char: '突', radical: '穴', strokes: 9, pinyin: 'tu' },
  { char: '大', radical: '大', strokes: 3, pinyin: 'da' },
  { char: '小', radical: '小', strokes: 3, pinyin: 'xiao' },
  { char: '一', radical: '一', strokes: 1, pinyin: 'yi' },
  { char: '二', radical: '二', strokes: 2, pinyin: 'er' },
  { char: '三', radical: '三', strokes: 3, pinyin: 'san' },
  { char: '四', radical: '囗', strokes: 5, pinyin: 'si' },
  { char: '五', radical: '二', strokes: 4, pinyin: 'wu' },
  { char: '六', radical: '八', strokes: 4, pinyin: 'liu' },
  { char: '七', radical: '一', strokes: 2, pinyin: 'qi' },
  { char: '八', radical: '八', strokes: 2, pinyin: 'ba' },
  { char: '九', radical: '丿', strokes: 2, pinyin: 'jiu' },
  { char: '十', radical: '十', strokes: 2, pinyin: 'shi' },
  { char: '人', radical: '人', strokes: 2, pinyin: 'ren' },
  { char: '口', radical: '口', strokes: 3, pinyin: 'kou' },
  { char: '日', radical: '日', strokes: 4, pinyin: 'ri' },
  { char: '月', radical: '月', strokes: 4, pinyin: 'yue' },
  { char: '山', radical: '山', strokes: 3, pinyin: 'shan' },
  { char: '水', radical: '水', strokes: 4, pinyin: 'shui' },
  { char: '火', radical: '火', strokes: 4, pinyin: 'huo' },
  { char: '土', radical: '土', strokes: 3, pinyin: 'tu' },
  { char: '田', radical: '田', strokes: 5, pinyin: 'tian' },
  { char: '目', radical: '目', strokes: 5, pinyin: 'mu' },
  { char: '耳', radical: '耳', strokes: 6, pinyin: 'er' },
  { char: '手', radical: '手', strokes: 4, pinyin: 'shou' },
  { char: '足', radical: '足', strokes: 7, pinyin: 'zu' },
  { char: '心', radical: '心', strokes: 4, pinyin: 'xin' },
  { char: '刀', radical: '刀', strokes: 2, pinyin: 'dao' },
];

const CHAR_MAP: Map<string, CharMeta> = new Map(CHAR_INDEX.map((m) => [m.char, m]));

/** 部首候选（去重，按笔画数升序） */
export const RADICAL_OPTIONS: string[] = Array.from(new Set(CHAR_INDEX.map((m) => m.radical)));

/** 笔画候选（去重，升序） */
export const STROKE_OPTIONS: number[] = Array.from(new Set(CHAR_INDEX.map((m) => m.strokes))).sort(
  (a, b) => a - b,
);

/** 查询字符索引；未收录返回 undefined */
export function lookupChar(char: string): CharMeta | undefined {
  if (!char) return undefined;
  return CHAR_MAP.get(Array.from(char.trim())[0] ?? '');
}

/** 是否已收录索引 */
export function isIndexed(char: string): boolean {
  return Boolean(lookupChar(char));
}

/** 部首，未收录返回「未收录」 */
export function radicalOf(char: string): string {
  return lookupChar(char)?.radical ?? '未收录';
}

/** 笔画数，未收录返回 0 */
export function strokesOf(char: string): number {
  return lookupChar(char)?.strokes ?? 0;
}

/** 拼音，未收录返回空串 */
export function pinyinOf(char: string): string {
  return lookupChar(char)?.pinyin ?? '';
}

/** 拼音首字母（大写），未收录返回 '#' */
export function pinyinInitialOf(char: string): string {
  const py = pinyinOf(char);
  return py ? py.charAt(0).toUpperCase() : '#';
}

export interface CharQuery {
  /** 字符本身、拼音或拼音首字母 */
  text?: string;
  radical?: string;
  strokes?: number | '';
}

/** 按部首、笔画、拼音 / 字符检索候选字符 */
export function searchChars(query: CharQuery, limit = 48): CharMeta[] {
  const text = (query.text || '').trim().toLowerCase();
  const radical = (query.radical || '').trim();
  const strokes = query.strokes === '' || query.strokes === undefined ? null : Number(query.strokes);
  const result = CHAR_INDEX.filter((m) => {
    if (radical && m.radical !== radical) return false;
    if (strokes !== null && m.strokes !== strokes) return false;
    if (text) {
      const hit =
        m.char === text ||
        m.pinyin.startsWith(text) ||
        m.pinyin.charAt(0) === text ||
        radicalOf(m.char).includes(text);
      if (!hit) return false;
    }
    return true;
  });
  return result.slice(0, limit);
}

export type CharSortMode = 'strokes' | 'radical' | 'pinyin' | 'char';

/** 排序键：总览页可按部首笔画排序 */
export function charSortValue(char: string, mode: CharSortMode): string | number {
  const meta = lookupChar(char);
  switch (mode) {
    case 'strokes':
      return meta ? meta.strokes : 999;
    case 'radical':
      return meta ? meta.radical : 'zzz';
    case 'pinyin':
      return meta ? meta.pinyin : 'zzzz';
    default:
      return char;
  }
}

/** 部首页码（笔画数 + 部首笔画近似值），用于部首笔画排序的次级键 */
export function radicalStrokeValue(char: string): number {
  const meta = lookupChar(char);
  if (!meta) return 999;
  return meta.strokes * 100 + meta.radical.length;
}
