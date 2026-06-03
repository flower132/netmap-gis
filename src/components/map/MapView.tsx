import { useMemo, useCallback } from 'react';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { APP_CONFIG } from '@/utils/constants';
import { createSearchResultIcon } from '@/utils/sector-icons';
import { getVisibleSitesFromLayers, getAllSitesFromLayers } from '@/layers/layerManager';
import { useViewportSites } from '@/hooks/useViewportSites';
import { MapLayers } from './MapLayers';
import { MapController } from './MapController';
import { StationCluster } from './StationCluster';
import { StationMarkers } from './StationMarkers';
import { SiteMarkers } from './SiteMarkers';
import { SitePolygons } from './SitePolygons';
import { LocationMarker } from './LocationMarker';
import { BaseMapSwitcher } from './BaseMapSwitcher';
import type { Station } from '@/types';

/**
 * 主地图视图组件
 * 集成多底图、基站/站点聚合、定位、底图切换、地名搜索标记
 * 新版：基于 GIS 图层系统，支持可见性过滤与 polygon 分层渲染
 *
 * 性能优化：
 * - useMemo 缓存图层聚合与统计计算
 * - useViewportSites 仅渲染当前视野内站点
 * - useCallback 稳定事件处理函数引用
 */
export function MapView() {
  const gisLayers = useAppStore((state) => state.gisLayers);
  const stations = useAppStore((state) => state.stations);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const searchResultMarker = useMapStore((state) => state.searchResultMarker);
  const setSearchResultMarker = useMapStore((state) => state.setSearchResultMarker);

  // 从可见图层聚合站点（地图渲染用）
  const visibleSites = useMemo(() => getVisibleSitesFromLayers(gisLayers), [gisLayers]);
  // 所有站点（用于统计）
  const allSites = useMemo(() => getAllSitesFromLayers(gisLayers), [gisLayers]);

  // 视野范围过滤：仅渲染当前地图范围内的站点
  const viewportSites = useViewportSites(visibleSites);

  const hasLegacyData = stations.length > 0;
  const hasSiteData = viewportSites.length > 0;

  // 统计：兼容旧版 stations 和新版 sites
  // 使用单次遍历优化，避免多次 filter
  const stats = useMemo(() => {
    const counts = { active: 0, inactive: 0, maintenance: 0, planning: 0 };
    for (const s of stations) {
      if (counts[s.status] !== undefined) counts[s.status]++;
    }
    for (const s of allSites) {
      if (counts[s.status] !== undefined) counts[s.status]++;
    }
    return counts;
  }, [stations, allSites]);

  const handleSelectStation = useCallback(
    (station: Station) => {
      setSelectedStation(station);
    },
    [setSelectedStation]
  );

  const handleSearchMarkerClick = useCallback(() => {
    setSearchResultMarker(null);
  }, [setSearchResultMarker]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={APP_CONFIG.map.defaultCenter}
        zoom={APP_CONFIG.map.defaultZoom}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
        minZoom={APP_CONFIG.map.minZoom}
        maxZoom={APP_CONFIG.map.maxZoom}
      >
        <MapController />
        <MapLayers />
        <LocationMarker />

        {/* 旧版基站聚合 */}
        {hasLegacyData && (
          <StationCluster>
            <StationMarkers
              stations={stations}
              onSelectStation={handleSelectStation}
            />
          </StationCluster>
        )}

        {/* 新版站点扇区聚合 + Polygon */}
        {hasSiteData && (
          <>
            <StationCluster>
              <SiteMarkers sites={viewportSites} />
            </StationCluster>
            <SitePolygons sites={viewportSites} />
          </>
        )}

        {/* 地名搜索结果临时标记 */}
        {searchResultMarker && (
          <Marker
            position={searchResultMarker}
            icon={createSearchResultIcon()}
            eventHandlers={{
              click: handleSearchMarkerClick,
            }}
          >
            <Popup className="station-popup">
              <div className="text-xs text-gis-200">
                搜索结果位置
                <div className="text-gis-400 mt-1 font-mono">
                  {searchResultMarker[0].toFixed(6)}, {searchResultMarker[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 浮动 UI 遮罩层：确保按钮可点击，不被 Leaflet 容器拦截 */}
      <div className="absolute inset-0 pointer-events-none z-map-overlay">
        <div className="pointer-events-auto">
          <BaseMapSwitcher />
        </div>

        {/* 地图角落统计面板 */}
        <div className="absolute bottom-6 right-6 glass-panel px-3 py-2 pointer-events-none hidden md:block">
          <div className="text-xs text-gis-300 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>运行中: {stats.active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>停用: {stats.inactive}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>维护中: {stats.maintenance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>规划中: {stats.planning}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
