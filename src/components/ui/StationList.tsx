import { useCallback } from 'react';
import { MapPin, Radio, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import type { Station } from '@/types';

interface StationListProps {
  stations: Station[];
}

/**
 * 基站列表组件
 * 支持选中高亮、搜索高亮，点击联动地图 flyTo
 */
export function StationList({ stations }: StationListProps) {
  const selectedStation = useAppStore((state) => state.selectedStation);
  const highlightedStationId = useAppStore((state) => state.highlightedStationId);
  const searchResults = useAppStore((state) => state.searchResults);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);
  const flyTo = useMapStore((state) => state.flyTo);

  const handleStationClick = useCallback(
    (station: Station) => {
      setSelectedStation(station);
      flyTo([station.latitude, station.longitude], SEARCH_FLY_ZOOM, station.id);
      // 移动端点击后关闭 drawer
      toggleMobileDrawer(false);
    },
    [setSelectedStation, flyTo, toggleMobileDrawer]
  );

  const displayStations = searchResults !== null ? searchResults : stations;
  const hasSearch = searchResults !== null;

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="px-4 py-2 text-xs font-medium text-gis-400 flex items-center justify-between">
        <span>基站列表 {hasSearch && `(${displayStations.length})`}</span>
        {hasSearch && (
          <button
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            onClick={clearSearch}
          >
            <X className="w-3 h-3" />
            清除搜索
          </button>
        )}
      </div>

      {displayStations.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Radio className="w-8 h-8 text-gis-600 mx-auto mb-2" />
          <p className="text-sm text-gis-400">
            {hasSearch ? '未找到匹配基站' : '暂无基站数据'}
          </p>
          <p className="text-xs text-gis-500 mt-1">
            {hasSearch ? '尝试其他关键词' : '点击上方导入按钮添加数据'}
          </p>
        </div>
      ) : (
        <div className="space-y-1 px-2 pb-4">
          {displayStations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const isHighlighted = highlightedStationId === station.id;

            return (
              <button
                key={station.id}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-md transition-all group relative',
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/30'
                    : isHighlighted
                      ? 'bg-amber-500/10 border border-amber-500/30 animate-pulse'
                      : 'hover:bg-gis-700/50 border border-transparent'
                )}
                onClick={() => handleStationClick(station)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gis-100 truncate pr-2">
                    {station.station_name}
                  </span>
                  <Badge status={station.status} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gis-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gis-500 mt-0.5">
                  <span>PCI: {station.pci}</span>
                  <span>频段: {station.band}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
