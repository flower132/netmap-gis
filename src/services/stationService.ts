import type { Station, ImportResult } from '@/types';
import { generateId } from '@/utils/geo';
import Papa from 'papaparse';

/**
 * CSV 行数据接口
 */
interface CsvRow {
  station_name?: string;
  latitude?: string;
  longitude?: string;
  pci?: string;
  band?: string;
  status?: string;
  [key: string]: string | undefined;
}

/**
 * 验证并转换单行 CSV 数据为 Station
 */
function validateStation(row: CsvRow, index: number): { station: Station | null; error: string | null } {
  const name = row.station_name?.trim();
  const lat = parseFloat(row.latitude || '');
  const lng = parseFloat(row.longitude || '');

  if (!name) {
    return { station: null, error: `第 ${index + 1} 行: 站名不能为空` };
  }
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { station: null, error: `第 ${index + 1} 行: 纬度无效 (${row.latitude})` };
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return { station: null, error: `第 ${index + 1} 行: 经度无效 (${row.longitude})` };
  }

  const validStatuses = ['active', 'inactive', 'maintenance', 'planning'];
  const status = (row.status?.trim() || 'active').toLowerCase();

  const station: Station = {
    id: generateId(),
    station_name: name,
    latitude: lat,
    longitude: lng,
    pci: parseInt(row.pci || '0', 10),
    band: (row.band?.trim() || 'N/A').toUpperCase(),
    status: validStatuses.includes(status) ? status as Station['status'] : 'active',
  };

  return { station, error: null };
}

/**
 * 从 CSV 文件导入基站数据
 * 返回解析后的基站列表和错误信息
 */
export function importStationsFromCSV(file: File): Promise<ImportResult & { stations: Station[] }> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const stations: Station[] = [];

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          errors.push(...results.errors.slice(0, 5).map(e => `CSV 解析错误: ${e.message}`));
        }

        results.data.forEach((row, index) => {
          const { station, error } = validateStation(row, index);
          if (station) {
            stations.push(station);
          } else if (error) {
            errors.push(error);
          }
        });

        resolve({
          success: stations.length > 0,
          count: stations.length,
          failed: 0,
          errors: errors.slice(0, 10),
          stations,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          count: 0,
          failed: 0,
          errors: [`文件解析失败: ${error.message}`],
          stations: [],
        });
      },
    });
  });
}

/**
 * 导出基站数据到 CSV
 */
export function exportStationsToCSV(stations: Station[]): string {
  const data = stations.map(s => ({
    station_name: s.station_name,
    latitude: s.latitude,
    longitude: s.longitude,
    pci: s.pci,
    band: s.band,
    status: s.status,
  }));

  return Papa.unparse(data);
}

/**
 * 下载 CSV 文件
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
