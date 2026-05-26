import { useRef, useCallback } from 'react';
import { Upload, Trash2, FileDown, AlertCircle, Navigation } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { Button } from '@/components/ui/Button';
import { SearchBox } from '@/components/ui/SearchBox';
import { StationList } from '@/components/ui/StationList';
import { exportStationsToCSV, downloadCSV } from '@/services/stationService';

/**
 * 左侧边栏组件（桌面端）
 * 包含导入、搜索、统计、列表等全部侧边功能
 * 移动端使用 MobileDrawer 包裹此组件
 */
export function Sidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stations = useAppStore((state) => state.stations);
  const importErrors = useAppStore((state) => state.importErrors);
  const isImporting = useAppStore((state) => state.isImporting);
  const importCSV = useAppStore((state) => state.importCSV);
  const clearStations = useAppStore((state) => state.clearStations);
  const flyTo = useMapStore((state) => state.flyTo);

  // 统计
  const stats = {
    total: stations.length,
    active: stations.filter((s) => s.status === 'active').length,
    inactive: stations.filter((s) => s.status === 'inactive').length,
    maintenance: stations.filter((s) => s.status === 'maintenance').length,
    planning: stations.filter((s) => s.status === 'planning').length,
  };

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importCSV(file);
      }
      e.target.value = '';
    },
    [importCSV]
  );

  const handleExport = useCallback(() => {
    const csv = exportStationsToCSV(stations);
    downloadCSV(csv, `stations_${Date.now()}.csv`);
  }, [stations]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* 工具栏 */}
      <div className="p-4 space-y-3 border-b border-gis-700 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="primary"
          className="w-full justify-center min-h-[44px]"
          onClick={handleImportClick}
          isLoading={isImporting}
        >
          <Upload className="w-4 h-4" />
          导入 CSV
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 justify-center min-h-[40px]"
            onClick={clearStations}
            disabled={stations.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 justify-center min-h-[40px]"
            disabled={stations.length === 0}
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
            <div className="text-gis-400">基站总数</div>
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

      {/* 基站列表 */}
      <StationList stations={stations} />

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
