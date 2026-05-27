import { useMemo } from 'react';
import { Layers, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { computeLayerStats } from '@/layers/layerManager';
import { LayerItem } from './LayerItem';

/**
 * 图层控制面板
 * 显示所有 GIS 图层，支持开关与数量统计
 */
export function LayerPanel() {
  const gisLayers = useAppStore((state) => state.gisLayers);
  const toggleGisLayer = useAppStore((state) => state.toggleGisLayer);

  const stats = useMemo(() => computeLayerStats(gisLayers), [gisLayers]);

  const visibleCount = useMemo(
    () => stats.filter((s) => s.visible).length,
    [stats]
  );

  const totalSites = useMemo(
    () => stats.reduce((sum, s) => sum + s.siteCount, 0),
    [stats]
  );

  const totalSectors = useMemo(
    () => stats.reduce((sum, s) => sum + s.sectorCount, 0),
    [stats]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gis-300">
          <Layers className="w-3.5 h-3.5" />
          <span>图层管理</span>
        </div>
        <span className="text-[10px] text-gis-500">
          {visibleCount}/{stats.length} 可见
        </span>
      </div>

      {stats.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-gis-500 px-1">
          <Info className="w-3.5 h-3.5" />
          <span>暂无图层数据</span>
        </div>
      ) : (
        <div className="space-y-1">
          {stats.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              onToggle={toggleGisLayer}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gis-500 px-1 pt-1 border-t border-gis-800">
        <span>站点: {totalSites}</span>
        <span>扇区: {totalSectors}</span>
      </div>
    </div>
  );
}
