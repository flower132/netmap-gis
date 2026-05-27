import { useCallback } from 'react';
import { MapPin, Radio, TowerControl } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import type { Site } from '@/types';

interface SiteListProps {
  sites: Site[];
}

/**
 * 站点列表组件
 * 支持选中高亮，点击联动地图 flyTo
 */
export function SiteList({ sites }: SiteListProps) {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const highlightedSiteId = useAppStore((state) => state.highlightedSiteId);
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);
  const flyTo = useMapStore((state) => state.flyTo);

  const handleSiteClick = useCallback(
    (site: Site) => {
      setSelectedSite(site);
      flyTo([site.latitude, site.longitude], SEARCH_FLY_ZOOM, site.id);
      toggleMobileDrawer(false);
    },
    [setSelectedSite, flyTo, toggleMobileDrawer]
  );

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="px-4 py-2 text-xs font-medium text-gis-400 flex items-center justify-between">
        <span>站点列表 ({sites.length})</span>
      </div>

      {sites.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Radio className="w-8 h-8 text-gis-600 mx-auto mb-2" />
          <p className="text-sm text-gis-400">暂无站点数据</p>
          <p className="text-xs text-gis-500 mt-1">点击上方导入按钮添加数据</p>
        </div>
      ) : (
        <div className="space-y-1 px-2 pb-4">
          {sites.map((site) => {
            const isSelected = selectedSite?.id === site.id;
            const isHighlighted = highlightedSiteId === site.id;
            const sectorCount = site.sectors.length;

            return (
              <button
                key={site.id}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-md transition-all group relative',
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/30'
                    : isHighlighted
                      ? 'bg-amber-500/10 border border-amber-500/30 animate-pulse'
                      : 'hover:bg-gis-700/50 border border-transparent'
                )}
                onClick={() => handleSiteClick(site)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gis-100 truncate pr-2 flex items-center gap-1.5">
                    <TowerControl className="w-3.5 h-3.5 text-gis-400" />
                    {site.siteName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gis-800 text-gis-300">
                    {sectorCount} 扇区
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gis-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {site.sectors.map((s) =>
                    s.tech ? (
                      <span
                        key={s.id}
                        className="text-[9px] px-1 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor:
                            s.tech === '4G'
                              ? 'rgba(59,130,246,0.15)'
                              : s.tech === '5G'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(156,163,175,0.15)',
                          color:
                            s.tech === '4G'
                              ? '#60a5fa'
                              : s.tech === '5G'
                                ? '#f87171'
                                : '#9ca3af',
                        }}
                      >
                        {s.tech}
                        {s.azimuth !== undefined ? ` ${s.azimuth}°` : ''}
                      </span>
                    ) : null
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
