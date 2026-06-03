import * as XLSX from 'xlsx';
import type { Site, ImportStats } from '@/types';

// ==================== Worker 导入接口 ====================

/** Worker 进度回调 */
export type ImportProgressCallback = (phase: string, current: number, total?: number) => void;

// ==================== 主入口（Web Worker 版）====================

/**
 * 从 Excel/CSV 文件导入站点数据（Web Worker 异步解析）
 * 解析过程在后台线程执行，不阻塞 UI
 * 支持 .xlsx, .xls, .csv
 */
export function importSitesFromExcel(
  file: File,
  onProgress?: ImportProgressCallback
): Promise<{ sites: Site[]; stats: ImportStats }> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('@/workers/excelParse.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.phase, msg.current, msg.total);
      } else if (msg.type === 'result') {
        worker.terminate();
        resolve({ sites: msg.sites, stats: msg.stats });
      } else if (msg.type === 'error') {
        worker.terminate();
        resolve({
          sites: [],
          stats: {
            totalRows: 0,
            successCount: 0,
            failedCount: 0,
            errors: [msg.message],
          },
        });
      }
    };

    worker.onerror = (e) => {
      worker.terminate();
      resolve({
        sites: [],
        stats: {
          totalRows: 0,
          successCount: 0,
          failedCount: 0,
          errors: [`\u89E3\u6790\u5F02\u5E38: ${e.message}`],
        },
      });
    };

    // 将文件读取为 ArrayBuffer 后传给 Worker
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        worker.postMessage(
          { type: 'parse', buffer: reader.result, fileName: file.name },
          { transfer: [reader.result] } // Transferable，零拷贝传输
        );
      } else {
        worker.terminate();
        resolve({
          sites: [],
          stats: {
            totalRows: 0,
            successCount: 0,
            failedCount: 0,
            errors: ['\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25'],
          },
        });
      }
    };
    reader.onerror = () => {
      worker.terminate();
      resolve({
        sites: [],
        stats: {
          totalRows: 0,
          successCount: 0,
          failedCount: 0,
          errors: ['\u6587\u4EF6\u8BFB\u53D6\u9519\u8BEF'],
        },
      });
    };
    reader.readAsArrayBuffer(file);
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
