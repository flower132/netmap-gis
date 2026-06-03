import { useMemo, useState } from 'react';
import { X, ChevronUp, ChevronDown, Radio, MapPin, Activity, Wrench, Clock, BarChart3, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import type { Site } from '@/types';
import { searchSitesByRegion, computeBounds, getBoundsCenter, getBoundsZoom } from '@/services/searchService';

/**
 * 数据统计 Bottom Sheet
 * 从底部滑出的数据统计面板
 * 支持展开/收起两种高度状态
 */
export function DataBottomSheet() {
  const activePanel = useAppStore((state) => state.activePanel);
  const closePanel = useAppStore((state) => state.closePanel);
  const stations = useAppStore((state) => state.stations);
  const allSites = useAppStore((state) => state.sites);
  const regionStats = useAppStore((state) => state.regionStats);
  const siteIndex = useAppStore((state) => state.siteIndex);
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  const flyTo = useMapStore((state) => state.flyTo);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showRegionStats, setShowRegionStats] = useState(false);

  const isOpen = activePanel === 'dataPanel';

  const stats = useMemo(() => {
    const counts = { total: 0, active: 0, inactive: 0, maintenance: 0, planning: 0 };
    for (const s of stations) {
      counts.total++;
      if (counts[s.status] !== undefined) counts[s.status]++;
    }
    for (const s of allSites) {
      counts.total++;
      if (counts[s.status] !== undefined) counts[s.status]++;
    }
    return counts;
  }, [stations, allSites]);

  // 区域统计中总数大于0的区域
  const activeRegionStats = useMemo(() => {
    return regionStats.filter((r) => r.totalSites > 0);
  }, [regionStats]);

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site);
    flyTo([site.latitude, site.longitude], SEARCH_FLY_ZOOM, site.id);
    closePanel();
  };

  const handleRegionClick = (region: string) => {
    const matched = searchSitesByRegion(siteIndex, region);
    const matchedSites = allSites.filter((s) => matched.some((m) => m.id === s.id));
    if (matchedSites.length > 0) {
      const bounds = computeBounds(matchedSites);
      const center = getBoundsCenter(bounds || [[0, 0], [0, 0]]);
      flyTo(center, getBoundsZoom(bounds || [[0, 0], [0, 0]]));
    }
    closePanel();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-drawer transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closePanel}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed left-0 right-0 z-modal bg-gis-900 border-t border-gis-700',
          'shadow-[0_-8px_32px_rgba(0,0,0,0.5)]',
          'transition-transform duration-300 ease-out lg:hidden',
          'flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          isExpanded ? 'top-16' : 'bottom-0 h-[55vh]'
        )}
      >
        {/* Drag Handle Header */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-gis-700/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-gis-100">数据概览</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2 text-gis-400 hover:text-gis-100 hover:bg-gis-700/50 rounded-md transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              className="p-2 text-gis-400 hover:text-gis-100 hover:bg-gis-700/50 rounded-md transition-colors"
              onClick={closePanel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 p-3 shrink-0">
          <div className="bg-gis-800/60 rounded-lg px-2 py-2.5 text-center border border-gis-700/40">
            <div className="text-[10px] text-gis-400 mb-0.5">总数</div>
            <div className="text-base font-bold text-gis-100">{stats.total}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg px-2 py-2.5 text-center border border-emerald-500/20">
            <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 mb-0.5">
              <Radio className="w-3 h-3" />
              运行
            </div>
            <div className="text-base font-bold text-emerald-400">{stats.active}</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg px-2 py-2.5 text-center border border-amber-500/20">
            <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 mb-0.5">
              <Wrench className="w-3 h-3" />
              维护
            </div>
            <div className="text-base font-bold text-amber-400">{stats.maintenance}</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg px-2 py-2.5 text-center border border-blue-500/20">
            <div className="flex items-center justify-center gap-1 text-[10px] text-blue-400 mb-0.5">
              <Clock className="w-3 h-3" />
              规划
            </div>
            <div className="text-base font-bold text-blue-400">{stats.planning}</div>
          </div>
        </div>

        {/* 区域统计折叠面板 */}
        <div className="shrink-0 border-b border-gis-700/50">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gis-800/40 transition-colors"
            onClick={() => setShowRegionStats(!showRegionStats)}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-gis-100">区域统计</span>
              <span className="text-[10px] text-gis-500">({activeRegionStats.length} 个区域有数据)</span>
            </div>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-gis-400 transition-transform',
                showRegionStats ? 'rotate-90' : ''
              )}
            />
          </button>

          {showRegionStats && (
            <div className="px-3 pb-3 max-h-48 overflow-y-auto">
              {activeRegionStats.length === 0 ? (
                <div className="text-center py-3 text-xs text-gis-500">
                  暂无区域统计数据
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeRegionStats.map((stat) => (
                    <button
                      key={stat.region}
                      className="w-full text-left px-2.5 py-2 rounded-md bg-gis-800/40 hover:bg-gis-700/60 border border-transparent hover:border-gis-600/30 transition-all"
                      onClick={() => handleRegionClick(stat.region)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gis-100">{stat.region}</span>
                        <span className="text-[10px] text-gis-400">
                          基站 {stat.totalSites} / 扇区 {stat.totalSectors}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[10px]">
                        <div className="text-center bg-blue-500/10 rounded py-0.5">
                          <span className="text-blue-400">4G基 {stat.sites4G}</span>
                        </div>
                        <div className="text-center bg-blue-500/10 rounded py-0.5">
                          <span className="text-blue-400">4G扇 {stat.sectors4G}</span>
                        </div>
                        <div className="text-center bg-red-500/10 rounded py-0.5">
                          <span className="text-red-400">5G基 {stat.sites5G}</span>
                        </div>
                        <div className="text-center bg-red-500/10 rounded py-0.5">
                          <span className="text-red-400">5G扇 {stat.sectors5G}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Site List Preview */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-4 pt-2">
          <div className="text-xs font-medium text-gis-400 mb-2 flex items-center justify-between">
            <span>站点列表 ({allSites.length})</span>
          </div>

          {allSites.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="w-8 h-8 text-gis-600 mx-auto mb-2" />
              <p className="text-sm text-gis-400">暂无站点数据</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allSites.slice(0, isExpanded ? undefined : 6).map((site) => (
                <button
                  key={site.id}
                  className="w-full text-left px-3 py-2 rounded-md bg-gis-800/40 hover:bg-gis-700/60 border border-transparent hover:border-gis-600/30 transition-all"
                  onClick={() => handleSiteClick(site)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gis-100 truncate">{site.siteName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gis-700 text-gis-300">
                      {site.sectors.length} 扇区
                    </span>
                  </div>
                  <div className="text-[10px] text-gis-400 mt-0.5 flex gap-x-2">
                    <span>{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</span>
                    {site.region && <span className="text-blue-400">{site.region}</span>}
                    {site.siteId && <span className="text-emerald-400">{site.siteId}</span>}
                  </div>
                </button>
              ))}
              {!isExpanded && allSites.length > 6 && (
                <button
                  className="w-full text-center py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={() => setIsExpanded(true)}
                >
                  还有 {allSites.length - 6} 个站点，点击展开
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
