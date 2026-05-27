import * as XLSX from 'xlsx';
import type { Site, Sector, ImportStats } from '@/types';
import { generateId } from '@/utils/geo';
import {
  detectFieldMapping,
  parseNumber,
  parseString,
  parseTech,
  extractField,
  type FieldMappingResult,
} from '@/gis/fieldMapper';

interface ParsedRow {
  siteName: string;
  latitude: number;
  longitude: number;
  raw: Record<string, unknown>;
}

// ==================== 字段识别（已迁移到 fieldMapper）====================

// ==================== 数据解析 ====================

/**
 * 解析单行数据
 */
function parseRow(
  row: Record<string, unknown>,
  mapping: FieldMappingResult['mapping'],
  rowIndex: number
): { parsed: ParsedRow | null; error: string | null } {
  const siteName = parseString(extractField(row, mapping, 'siteName'));
  const lat = parseNumber(extractField(row, mapping, 'latitude'));
  const lng = parseNumber(extractField(row, mapping, 'longitude'));

  if (!siteName) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 站名不能为空` };
  }
  if (lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 纬度无效` };
  }
  if (lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
    return { parsed: null, error: `第 ${rowIndex + 1} 行: 经度无效` };
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

/**
 * 解析可选字段为 Sector
 */
function parseSectorFromRow(row: Record<string, unknown>, mapping: FieldMappingResult['mapping']): Sector {
  const sector: Sector = {
    id: generateId(),
  };

  const pci = parseNumber(extractField(row, mapping, 'pci'));
  if (pci !== undefined) sector.pci = pci;

  const azimuth = parseNumber(extractField(row, mapping, 'azimuth'));
  if (azimuth !== undefined) sector.azimuth = azimuth;

  const band = parseString(extractField(row, mapping, 'band'));
  if (band !== undefined) sector.band = band;

  const arfcn = parseNumber(extractField(row, mapping, 'arfcn'));
  if (arfcn !== undefined) sector.arfcn = arfcn;

  const bandwidth = parseString(extractField(row, mapping, 'bandwidth'));
  if (bandwidth !== undefined) sector.bandwidth = bandwidth;

  const height = parseNumber(extractField(row, mapping, 'height'));
  if (height !== undefined) sector.height = height;

  const tech = parseTech(extractField(row, mapping, 'tech'));
  if (tech !== undefined) sector.tech = tech;

  const tac = parseNumber(extractField(row, mapping, 'tac'));
  if (tac !== undefined) sector.tac = tac;

  const sectorId = parseString(extractField(row, mapping, 'sectorId'));
  if (sectorId !== undefined) {
    sector.sectorId = sectorId;
  } else {
    const cellId = parseString(extractField(row, mapping, 'cellId'));
    if (cellId !== undefined) sector.sectorId = cellId;
  }

  return sector;
}

// ==================== 站点聚合 ====================

/**
 * 将行数据聚合成 Site（按站名分组）
 */
function aggregateSites(rows: ParsedRow[], mapping: FieldMappingResult['mapping']): Site[] {
  const siteMap = new Map<string, { siteName: string; lat: number; lng: number; rows: ParsedRow[] }>();

  for (const row of rows) {
    const existing = siteMap.get(row.siteName);
    if (existing) {
      existing.rows.push(row);
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
      const sector = parseSectorFromRow(row.raw, mapping);

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
