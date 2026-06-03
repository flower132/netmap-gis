/**
 * Excel 解析 Web Worker
 * 将 XLSX 解析、行级验证、站点聚合全部放到 Worker 线程执行
 * 避免几万行数据同步解析阻塞主线程 UI
 */
import * as XLSX from 'xlsx';
import {
  detectFieldMapping,
  parseNumber,
  parseString,
  parseTech,
  extractField,
  type FieldMappingResult,
} from '@/gis/fieldMapper';
import type { Site, Sector, ImportStats } from '@/types';

// ==================== 类型定义 ====================

interface ParsedRow {
  siteName: string;
  latitude: number;
  longitude: number;
  raw: Record<string, unknown>;
}

/** 主线程 → Worker：请求解析文件 */
export interface WorkerParseRequest {
  type: 'parse';
  /** ArrayBuffer of the file */
  buffer: ArrayBuffer;
  fileName: string;
}

/** Worker → 主线程：解析进度 */
export interface WorkerProgressMessage {
  type: 'progress';
  phase: 'reading' | 'mapping' | 'parsing' | 'aggregating';
  current: number;
  total?: number;
}

/** Worker → 主线程：解析完成 */
export interface WorkerResultMessage {
  type: 'result';
  sites: Site[];
  stats: ImportStats;
}

/** Worker → 主线程：解析失败 */
export interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

export type WorkerMessage = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage;

// ==================== 数据解析 ====================

function parseRow(
  row: Record<string, unknown>,
  mapping: FieldMappingResult['mapping'],
  rowIndex: number
): { parsed: ParsedRow | null; error: string | null } {
  const siteName = parseString(extractField(row, mapping, 'siteName'));
  const lat = parseNumber(extractField(row, mapping, 'latitude'));
  const lng = parseNumber(extractField(row, mapping, 'longitude'));

  if (!siteName) {
    return { parsed: null, error: `\u7B2C ${rowIndex + 1} \u884C: \u7AD9\u540D\u4E0D\u80FD\u4E3A\u7A7A` };
  }
  if (lat === undefined || isNaN(lat) || lat < -90 || lat > 90) {
    return { parsed: null, error: `\u7B2C ${rowIndex + 1} \u884C: \u7EAC\u5EA6\u65E0\u6548` };
  }
  if (lng === undefined || isNaN(lng) || lng < -180 || lng > 180) {
    return { parsed: null, error: `\u7B2C ${rowIndex + 1} \u884C: \u7ECF\u5EA6\u65E0\u6548` };
  }

  return {
    parsed: { siteName, latitude: lat, longitude: lng, raw: row },
    error: null,
  };
}

function parseSectorFromRow(row: Record<string, unknown>, mapping: FieldMappingResult['mapping']): Sector {
  const sector: Sector = {
    id: `sector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  const siteId = parseString(extractField(row, mapping, 'siteId'));
  if (siteId !== undefined) sector.siteId = siteId;

  return sector;
}

// ==================== 站点聚合 ====================

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
      if (!sector.sectorId) {
        sector.sectorId = `S${idx + 1}`;
      }
      return sector;
    });

    // 从首行提取区域和基站号，优先取 Site 级别字段
    const firstRow = group.rows[0]?.raw || {};
    const region = parseString(extractField(firstRow, mapping, 'region'));
    const siteId = parseString(extractField(firstRow, mapping, 'siteId'));

    // 如果首行没有 siteId，尝试从扇区中合并（取第一个有值的）
    const siteIdFromSector = sectors.find((s) => s.siteId)?.siteId;

    sites.push({
      id: `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      siteName: group.siteName,
      latitude: group.lat,
      longitude: group.lng,
      status: 'active',
      sectors,
      ...(region ? { region } : {}),
      ...(siteId ? { siteId } : siteIdFromSector ? { siteId: siteIdFromSector } : {}),
    });
  }

  return sites;
}

// ==================== Worker 主逻辑 ====================

function post(msg: WorkerMessage) {
  self.postMessage(msg);
}

self.onmessage = (e: MessageEvent<WorkerParseRequest>) => {
  const { buffer } = e.data;

  try {
    // Phase 1: 解析 workbook
    post({ type: 'progress', phase: 'reading', current: 0 });
    const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

    if (jsonData.length < 2) {
      post({
        type: 'result',
        sites: [],
        stats: { totalRows: 0, successCount: 0, failedCount: 0, errors: ['\u6587\u4EF6\u4E3A\u7A7A\u6216\u683C\u5F0F\u4E0D\u6B63\u786E'] },
      });
      return;
    }

    // Phase 2: 字段映射
    post({ type: 'progress', phase: 'mapping', current: 0 });
    const headers = (jsonData[0]).map((h) => String(h).trim());
    const { mapping, missing } = detectFieldMapping(headers);

    if (missing.length > 0) {
      post({
        type: 'result',
        sites: [],
        stats: {
          totalRows: 0,
          successCount: 0,
          failedCount: 0,
          errors: [`\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5: ${missing.join(', ')}`],
        },
      });
      return;
    }

    // Phase 3: 逐行解析（带进度报告）
    post({ type: 'progress', phase: 'parsing', current: 0, total: jsonData.length - 1 });
    const errors: string[] = [];
    const parsedRows: ParsedRow[] = [];
    const totalDataRows = jsonData.length - 1;
    // 每处理 1000 行报告一次进度
    const PROGRESS_INTERVAL = 1000;

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

      if (i % PROGRESS_INTERVAL === 0) {
        post({ type: 'progress', phase: 'parsing', current: i, total: totalDataRows });
      }
    }

    // Phase 4: 聚合站点
    post({ type: 'progress', phase: 'aggregating', current: 0, total: parsedRows.length });
    const sites = aggregateSites(parsedRows, mapping);

    // 完成
    post({
      type: 'result',
      sites,
      stats: {
        totalRows: totalDataRows,
        successCount: parsedRows.length,
        failedCount: totalDataRows - parsedRows.length,
        errors: errors.slice(0, 50), // Worker 中收集更多错误
      },
    });
  } catch (err) {
    post({
      type: 'error',
      message: `\u89E3\u6790\u5931\u8D25: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
};
