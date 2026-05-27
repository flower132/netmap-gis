import * as XLSX from 'xlsx';
import type { Site, Sector, ImportStats } from '@/types';
import { generateId } from '@/utils/geo';

// ==================== 字段映射配置 ====================

const LONGITUDE_FIELDS = ['经度', '小区经度', 'longitude', 'lng', 'lon', 'LONGITUDE', 'LNG', 'LON'];
const LATITUDE_FIELDS = ['纬度', '小区纬度', 'latitude', 'lat', 'LATITUDE', 'LAT'];
const SITE_NAME_FIELDS = ['站名', '小区名称', 'cellname', 'name', '站点名称', 'site_name', 'SITE_NAME', 'NAME', 'CELLNAME'];

const OPTIONAL_FIELD_MAP: Record<string, string[]> = {
  pci: ['PCI', 'pci', 'Pci', '物理小区标识'],
  azimuth: ['方位角', 'azimuth', 'AZIMUTH', '方向角', '天线方向角'],
  band: ['Band', 'band', 'BAND', '频段', '频带'],
  arfcn: ['中心频点', '频点号', 'arfcn', 'ARFCN', 'earfcn', 'EARFCN', 'nrarfcn', 'NRARFCN'],
  bandwidth: ['带宽', 'bandwidth', 'BANDWIDTH', 'BW', 'bw'],
  height: ['挂高', 'height', 'HEIGHT', '天线挂高', '天线高度'],
  tech: ['制式', 'tech', 'TECH', '网络制式', 'rat', 'RAT', 'type', 'TYPE'],
  tac: ['TAC', 'tac', 'Tac', '跟踪区码'],
  sectorId: [' SectorID', 'sector_id', 'SECTOR_ID', '扇区ID', '扇区标识', 'sectorid', 'SECTORID'],
};

interface FieldMapping {
  siteName: string;
  latitude: string;
  longitude: string;
  optionals: Record<string, string | undefined>;
}

interface ParsedRow {
  siteName: string;
  latitude: number;
  longitude: number;
  raw: Record<string, unknown>;
}

// ==================== 字段识别 ====================

/**
 * 识别 Excel 表头字段映射
 */
function detectFieldMapping(headers: string[]): { mapping: FieldMapping; missing: string[] } {
  const mapping: FieldMapping = {
    siteName: '',
    latitude: '',
    longitude: '',
    optionals: {},
  };

  const missing: string[] = [];

  // 识别经度
  mapping.longitude = headers.find((h) => LONGITUDE_FIELDS.includes(h)) || '';
  if (!mapping.longitude) missing.push('经度');

  // 识别纬度
  mapping.latitude = headers.find((h) => LATITUDE_FIELDS.includes(h)) || '';
  if (!mapping.latitude) missing.push('纬度');

  // 识别站名
  mapping.siteName = headers.find((h) => SITE_NAME_FIELDS.includes(h)) || '';
  if (!mapping.siteName) missing.push('站名');

  // 识别可选字段
  for (const [key, candidates] of Object.entries(OPTIONAL_FIELD_MAP)) {
    const found = headers.find((h) => candidates.includes(h));
    if (found) {
      mapping.optionals[key] = found;
    }
  }

  return { mapping, missing };
}

// ==================== 数据解析 ====================

function parseValue(raw: unknown): string | number | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === 'N/A') return undefined;
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;
    return trimmed;
  }
  return String(raw);
}

function parseNumber(raw: unknown): number | undefined {
  const val = parseValue(raw);
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

function parseString(raw: unknown): string | undefined {
  const val = parseValue(raw);
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return undefined;
}

function parseTech(raw: unknown): string | undefined {
  const val = parseString(raw);
  if (!val) return undefined;
  const upper = val.toUpperCase();
  if (upper.includes('LTE') || upper.includes('4G')) return '4G';
  if (upper.includes('NR') || upper.includes('5G')) return '5G';
  return val;
}

/**
 * 解析单行数据
 */
function parseRow(
  row: Record<string, unknown>,
  mapping: FieldMapping,
  rowIndex: number
): { parsed: ParsedRow | null; error: string | null } {
  const siteName = parseString(row[mapping.siteName]);
  const lat = parseNumber(row[mapping.latitude]);
  const lng = parseNumber(row[mapping.longitude]);

  if (!siteName) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 站名不能为空` };
  }
  if (lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 纬度无效 (${row[mapping.latitude]})` };
  }
  if (lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 经度无效 (${row[mapping.longitude]})` };
  }

  return {
    parsed: {
      siteName,
      latitude: lat,
      longitude: lng,
      raw: row,
    },
    error: null,
  };
}

// ==================== 站点聚合 ====================

/**
 * 将行数据聚合成 Site（按站名分组）
 */
function aggregateSites(rows: ParsedRow[], mapping: FieldMapping): Site[] {
  const siteMap = new Map<string, { siteName: string; lat: number; lng: number; rows: ParsedRow[] }>();

  for (const row of rows) {
    const existing = siteMap.get(row.siteName);
    if (existing) {
      existing.rows.push(row);
      // 使用第一个出现的坐标作为站点坐标
    } else {
      siteMap.set(row.siteName, {
        siteName: row.siteName,
        lat: row.latitude,
        lng: row.longitude,
        rows: [row],
      });
    }
  }

  const sites: Site[] = [];

  for (const [, group] of siteMap) {
    const sectors: Sector[] = group.rows.map((row, idx) => {
      const sector: Sector = {
        id: generateId(),
      };

      // 解析可选字段
      if (mapping.optionals.pci) {
        sector.pci = parseNumber(row.raw[mapping.optionals.pci]);
      }
      if (mapping.optionals.azimuth) {
        sector.azimuth = parseNumber(row.raw[mapping.optionals.azimuth]);
      }
      if (mapping.optionals.band) {
        sector.band = parseString(row.raw[mapping.optionals.band]);
      }
      if (mapping.optionals.arfcn) {
        sector.arfcn = parseNumber(row.raw[mapping.optionals.arfcn]);
      }
      if (mapping.optionals.bandwidth) {
        sector.bandwidth = parseString(row.raw[mapping.optionals.bandwidth]);
      }
      if (mapping.optionals.height) {
        sector.height = parseNumber(row.raw[mapping.optionals.height]);
      }
      if (mapping.optionals.tech) {
        sector.tech = parseTech(row.raw[mapping.optionals.tech]);
      }
      if (mapping.optionals.tac) {
        sector.tac = parseNumber(row.raw[mapping.optionals.tac]);
      }
      if (mapping.optionals.sectorId) {
        sector.sectorId = parseString(row.raw[mapping.optionals.sectorId]);
      }

      // 如果没有扇区ID，使用序号
      if (!sector.sectorId) {
        sector.sectorId = `S${idx + 1}`;
      }

      return sector;
    });

    sites.push({
      id: generateId(),
      siteName: group.siteName,
      latitude: group.lat,
      longitude: group.lng,
      status: 'active',
      sectors,
    });
  }

  return sites;
}

// ==================== 主入口 ====================

/**
 * 从 Excel/CSV 文件导入站点数据
 * 支持 .xlsx, .xls, .csv
 */
export function importSitesFromExcel(file: File): Promise<{ sites: Site[]; stats: ImportStats }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ sites: [], stats: { totalRows: 0, successCount: 0, failedCount: 0, errors: ['文件读取失败'] } });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 解析为 JSON，保留原始表头
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
          resolve({ sites: [], stats: { totalRows: 0, successCount: 0, failedCount: 0, errors: ['文件为空或格式不正确'] } });
          return;
        }

        const headers = (jsonData[0]).map((h) => String(h).trim());
        const { mapping, missing } = detectFieldMapping(headers);

        if (missing.length > 0) {
          resolve({
            sites: [],
            stats: {
              totalRows: 0,
              successCount: 0,
              failedCount: 0,
              errors: [`缺少必要字段: ${missing.join(', ')}`],
            },
          });
          return;
        }

        const errors: string[] = [];
        const parsedRows: ParsedRow[] = [];

        // 从第2行开始解析数据
        for (let i = 1; i < jsonData.length; i++) {
          const rowArray = jsonData[i];
          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = rowArray[idx];
          });

          const { parsed, error } = parseRow(rowObj, mapping, i);
          if (parsed) {
            parsedRows.push(parsed);
          } else if (error) {
            errors.push(error);
          }
        }

        const sites = aggregateSites(parsedRows, mapping);

        resolve({
          sites,
          stats: {
            totalRows: jsonData.length - 1,
            successCount: parsedRows.length,
            failedCount: jsonData.length - 1 - parsedRows.length,
            errors: errors.slice(0, 10),
          },
        });
      } catch (err) {
        resolve({
          sites: [],
          stats: {
            totalRows: 0,
            successCount: 0,
            failedCount: 0,
            errors: [`解析失败: ${err instanceof Error ? err.message : String(err)}`],
          },
        });
      }
    };

    reader.onerror = () => {
      resolve({
        sites: [],
        stats: {
          totalRows: 0,
          successCount: 0,
          failedCount: 0,
          errors: ['文件读取错误'],
        },
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * 导出站点数据到 Excel
 */
export function exportSitesToExcel(sites: Site[]): XLSX.WorkBook {
  const rows = sites.flatMap((site) =>
    site.sectors.map((sector) => ({
      站名: site.siteName,
      纬度: site.latitude,
      经度: site.longitude,
      状态: site.status,
      扇区ID: sector.sectorId || '',
      PCI: sector.pci ?? '',
      方位角: sector.azimuth ?? '',
      频段: sector.band ?? '',
      中心频点: sector.arfcn ?? '',
      带宽: sector.bandwidth ?? '',
      挂高: sector.height ?? '',
      制式: sector.tech ?? '',
      TAC: sector.tac ?? '',
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '站点数据');
  return workbook;
}

/**
 * 下载 Excel 文件
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
