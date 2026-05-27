/**
 * 字段映射系统
 * 支持不同表头自动识别、缺失字段兼容
 */

/** 必要字段 */
export type RequiredField = 'longitude' | 'latitude' | 'siteName';

/** 可选字段 */
export type OptionalField =
  | 'pci'
  | 'azimuth'
  | 'band'
  | 'arfcn'
  | 'bandwidth'
  | 'height'
  | 'tech'
  | 'tac'
  | 'sectorId'
  | 'cellId'
  | 'enodebId'
  | 'gNBId';

/**
 * 字段映射结果
 */
export interface FieldMappingResult {
  /** 已识别的字段映射：内部字段名 -> 原始表头名 */
  mapping: Record<string, string | undefined>;
  /** 缺失的必要字段列表 */
  missing: RequiredField[];
  /** 已识别的可选字段列表 */
  foundOptionals: OptionalField[];
}

// ==================== 字段别名配置 ====================

const REQUIRED_FIELD_ALIASES: Record<RequiredField, string[]> = {
  longitude: [
    '经度',
    '小区经度',
    'longitude',
    'lng',
    'lon',
    'long',
    'LONGITUDE',
    'LNG',
    'LON',
    'LONG',
    'X',
    'x',
    'WGS84_LON',
    'WGS84_LNG',
    '经度(°)',
    '经度(度)',
  ],
  latitude: [
    '纬度',
    '小区纬度',
    'latitude',
    'lat',
    'LATITUDE',
    'LAT',
    'y',
    'Y',
    'WGS84_LAT',
    '纬度(°)',
    '纬度(度)',
  ],
  siteName: [
    '站名',
    '小区名称',
    'cellname',
    'name',
    '站点名称',
    'site_name',
    'SITE_NAME',
    'NAME',
    'CELLNAME',
    'eNodeBName',
    'ENODEBNAME',
    'gNBName',
    'GNBNAME',
    '基站名称',
    '站点名',
    'SiteName',
  ],
};

const OPTIONAL_FIELD_ALIASES: Record<OptionalField, string[]> = {
  pci: ['PCI', 'pci', 'Pci', '物理小区标识', 'PCI(物理小区标识)'],
  azimuth: ['方位角', 'azimuth', 'AZIMUTH', '方向角', '天线方向角', '方位角(度)', 'Azimuth'],
  band: ['Band', 'band', 'BAND', '频段', '频带', '频段号', 'Band号'],
  arfcn: [
    '中心频点',
    '频点号',
    'arfcn',
    'ARFCN',
    'earfcn',
    'EARFCN',
    'nrarfcn',
    'NRARFCN',
    '频点',
    '绝对频点号',
  ],
  bandwidth: ['带宽', 'bandwidth', 'BANDWIDTH', 'BW', 'bw', 'Bandwidth', '带宽(MHz)'],
  height: ['挂高', 'height', 'HEIGHT', '天线挂高', '天线高度', 'Height', '挂高(m)'],
  tech: ['制式', 'tech', 'TECH', '网络制式', 'rat', 'RAT', 'type', 'TYPE', '网络类型', 'Tech'],
  tac: ['TAC', 'tac', 'Tac', '跟踪区码', 'Tracking Area Code'],
  sectorId: ['SectorID', 'sector_id', 'SECTOR_ID', '扇区ID', '扇区标识', 'sectorid', 'SECTORID', 'SectorId'],
  cellId: ['CellID', 'cell_id', 'CELL_ID', '小区ID', '小区标识', 'cellid', 'CELLID', 'CellId', 'CI', 'ci'],
  enodebId: ['eNodeBID', 'enodeb_id', 'ENODEB_ID', 'eNBId', '基站ID'],
  gNBId: ['gNBID', 'gnb_id', 'GNB_ID', 'gNBId', 'gNodeBID'],
};

// ==================== 字段识别 ====================

/**
 * 判断表头是否匹配某组别名（大小写不敏感，trim 后比较）
 */
function headerMatches(header: string, candidates: string[]): boolean {
  const h = header.trim().toLowerCase();
  return candidates.some((c) => c.trim().toLowerCase() === h);
}

/**
 * 从表头列表中识别字段映射
 */
export function detectFieldMapping(headers: string[]): FieldMappingResult {
  const mapping: Record<string, string | undefined> = {};
  const missing: RequiredField[] = [];
  const foundOptionals: OptionalField[] = [];

  // 识别必要字段
  for (const field of Object.keys(REQUIRED_FIELD_ALIASES) as RequiredField[]) {
    const found = headers.find((h) => headerMatches(h, REQUIRED_FIELD_ALIASES[field]));
    if (found) {
      mapping[field] = found;
    } else {
      missing.push(field);
    }
  }

  // 识别可选字段
  for (const field of Object.keys(OPTIONAL_FIELD_ALIASES) as OptionalField[]) {
    const found = headers.find((h) => headerMatches(h, OPTIONAL_FIELD_ALIASES[field]));
    if (found) {
      mapping[field] = found;
      foundOptionals.push(field);
    }
  }

  return { mapping, missing, foundOptionals };
}

/**
 * 根据映射从行数据中提取字段值
 */
export function extractField(
  row: Record<string, unknown>,
  mapping: Record<string, string | undefined>,
  field: string
): unknown {
  const header = mapping[field];
  if (!header) return undefined;
  return row[header];
}

/**
 * 解析字符串/数字值
 */
export function parseScalar(raw: unknown): string | number | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'NA') return undefined;
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;
    return trimmed;
  }
  return String(raw);
}

/**
 * 解析数字
 */
export function parseNumber(raw: unknown): number | undefined {
  const val = parseScalar(raw);
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

/**
 * 解析字符串
 */
export function parseString(raw: unknown): string | undefined {
  const val = parseScalar(raw);
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return undefined;
}

/**
 * 解析制式字段，统一为 '4G' 或 '5G'
 */
export function parseTech(raw: unknown): string | undefined {
  const val = parseString(raw);
  if (!val) return undefined;
  const upper = val.toUpperCase();
  if (upper.includes('LTE') || upper.includes('4G')) return '4G';
  if (upper.includes('NR') || upper.includes('5G')) return '5G';
  return val;
}

/**
 * 获取字段映射的友好描述（用于日志/提示）
 */
export function describeFieldMapping(result: FieldMappingResult): string {
  const lines: string[] = [];
  if (result.missing.length === 0) {
    lines.push('已识别所有必要字段');
  } else {
    lines.push(`缺少必要字段: ${result.missing.join(', ')}`);
  }
  if (result.foundOptionals.length > 0) {
    lines.push(`已识别可选字段: ${result.foundOptionals.join(', ')}`);
  }
  return lines.join('；');
}
