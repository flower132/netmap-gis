import { useRef, useCallback, useMemo } from 'react';
import { Upload, Trash2, FileDown, AlertCircle, Navigation, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { Button } from '@/components/ui/Button';
import { SearchBox } from '@/components/ui/SearchBox';
import { StationList } from '@/components/ui/StationList';
import { SiteList } from '@/components/ui/SiteList';
import { LayerPanel } from '@/components/layers/LayerPanel';
import { exportStationsToCSV, downloadCSV } from '@/services/stationService';
import { exportSitesToExcel, downloadExcel } from '@/services/excelImportService';
import { getAllSitesFromLayers, computeLayerStats } from '@/layers/layerManager';

/**
 * 左侧边栏组件（桌面端）
 * 包含图层控制、导入、搜索、统计、列表等全部侧边功能
 * 移动端使用 MobileDrawer 包裹此组件
 */
export function Sidebar() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const gisLayers = useAppStore((state) => state.gisLayers);
  const stations = useAppStore((state) => state.stations);
  const sites = useAppStore((state) => state.sites);
  const importErrors = useAppStore((state) => state.importErrors);
  const importStats = useAppStore((state) => state.importStats);
  const isImporting = useAppStore((state) => state.isImporting);
  const importCSV = useAppStore((state) => state.importCSV);
  const importExcel = useAppStore((state) => state.importExcel);
  const clearStations = useAppStore((state) => state.clearStations);
  const flyTo = useMapStore((state) => state.flyTo);

  const allSites = useMemo(() => getAllSitesFromLayers(gisLayers), [gisLayers]);
  const layerStats = useMemo(() => computeLayerStats(gisLayers), [gisLayers]);

  const hasSiteData = allSites.length > 0;
  const hasAnyData = stations.length > 0 || allSites.length > 0;
  const totalItems = stations.length + allSites.length;

  // 统计（兼容两种数据）
  const stats = useMemo(() => {
    const active =
      stations.filter((s) => s.status === 'active').length +
      allSites.filter((s) => s.status === 'active').length;
    const inactive =
      stations.filter((s) => s.status === 'inactive').length +
      allSites.filter((s) => s.status === 'inactive').length;
    const maintenance =
      stations.filter((s) => s.status === 'maintenance').length +
      allSites.filter((s) => s.status === 'maintenance').length;
    const planning =
      stations.filter((s) => s.status === 'planning').length +
      allSites.filter((s) => s.status === 'planning').length;
    return { total: totalItems, active, inactive, maintenance, planning };
  }, [stations, allSites, totalItems]);

  const handleImportCSVClick = useCallback(() => {
    csvInputRef.current?.click();
  }, []);

  const handleImportExcelClick = useCallback(() => {
    excelInputRef.current?.click();
  }, []);

  const handleCSVFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importCSV(file);
      }
      e.target.value = '';
    },
    [importCSV]
  );

  const handleExcelFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importExcel(file);
      }
      e.target.value = '';
    },
    [importExcel]
  );

  const handleExport = useCallback(() => {
    if (hasSiteData) {
      const wb = exportSitesToExcel(allSites);
      downloadExcel(wb, `sites_${Date.now()}.xlsx`);
    } else {
      const csv = exportStationsToCSV(stations);
      downloadCSV(csv, `stations_${Date.now()}.csv`);
    }
  }, [stations, allSites, hasSiteData]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* 图层控制面板 */}
      <div className="p-4 border-b border-gis-700 shrink-0">
        <LayerPanel />
      </div>

      {/* 工具栏 */}
      <div className="p-4 space-y-3 border-b border-gis-700 shrink-0">
        {/* Excel 导入（新版） */}
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelFileChange}
          className="hidden"
        />
        <Button
          variant="primary"
          className="w-full justify-center min-h-[44px]"
          onClick={handleImportExcelClick}
          isLoading={isImporting}
        >
          <FileSpreadsheet className="w-4 h-4" />
          导入工参 (Excel/CSV)
        </Button>

        {/* CSV 导入（旧版兼容） */}
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVFileChange}
          className="hidden"
        />
        <Button
          variant="secondary"
          className="w-full justify-center min-h-[40px] text-xs"
          onClick={handleImportCSVClick}
          isLoading={isImporting}
        >
          <Upload className="w-3.5 h-3.5" />
          导入旧版 CSV
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 justify-center min-h-[40px]"
            onClick={clearStations}
            disabled={!hasAnyData}
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 justify-center min-h-[40px]"
            disabled={!hasAnyData}
            onClick={handleExport}
          >
            <FileDown className="w-3.5 h-3.5" />
            导出
          </Button>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="p-4 border-b border-gis-700 shrink-0">
        <SearchBox />
      </div>

      {/* 统计信息 */}
      <div className="px-4 py-3 border-b border-gis-700 shrink-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gis-800/80 rounded-md px-3 py-2 border border-gis-700/50">
            <div className="text-gis-400">基站/站点总数</div>
            <div className="text-lg font-semibold text-gis-100">{stats.total}</div>
          </div>
          <div className="bg-gis-800/80 rounded-md px-3 py-2 border border-gis-700/50">
            <div className="text-gis-400">运行中</div>
            <div className="text-lg font-semibold text-emerald-400">{stats.active}</div>
          </div>
          <div className="bg-gis-800/80 rounded-md px-3 py-2 border border-gis-700/50">
            <div className="text-gis-400">维护中</div>
            <div className="text-lg font-semibold text-amber-400">{stats.maintenance}</div>
          </div>
          <div className="bg-gis-800/80 rounded-md px-3 py-2 border border-gis-700/50">
            <div className="text-gis-400">规划中</div>
            <div className="text-lg font-semibold text-blue-400">{stats.planning}</div>
          </div>
        </div>
      </div>

      {/* 导入统计 */}
      {importStats && (
        <div className="px-4 py-3 border-b border-gis-700 bg-emerald-500/5 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
            <span className="font-medium">导入完成</span>
          </div>
          <div className="flex gap-3 text-[10px] text-gis-300">
            <span>总行数: {importStats.totalRows}</span>
            <span className="text-emerald-400">成功: {importStats.successCount}</span>
            {importStats.failedCount > 0 && (
              <span className="text-amber-400">失败: {importStats.failedCount}</span>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {importErrors.length > 0 && (
        <div className="px-4 py-3 border-b border-gis-700 bg-red-500/5 shrink-0">
          <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="font-medium">导入出现 {importErrors.length} 个问题</span>
          </div>
          <div className="space-y-0.5 max-h-20 overflow-y-auto">
            {importErrors.map((err, i) => (
              <p key={i} className="text-[10px] text-red-300/80">{err}</p>
            ))}
          </div>
        </div>
      )}

      {/* 数据列表 */}
      {hasSiteData ? (
        <SiteList sites={allSites} />
      ) : (
        <StationList stations={stations} />
      )}

      {/* 底部定位按钮 */}
      <div className="p-3 border-t border-gis-700 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-center min-h-[40px]"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  flyTo([pos.coords.latitude, pos.coords.longitude], 16);
                },
                () => {
                  alert('定位失败，请检查定位权限');
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }
          }}
        >
          <Navigation className="w-3.5 h-3.5" />
          定位到当前位置
        </Button>
      </div>
    </div>
  );
}
