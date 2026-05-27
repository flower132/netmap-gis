import { MapContainer, Marker, Popup } from 'react-leaflet';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { APP_CONFIG } from '@/utils/constants';
import { createSearchResultIcon } from '@/utils/sector-icons';
import { MapLayers } from './MapLayers';
import { MapController } from './MapController';
import { StationCluster } from './StationCluster';
import { StationMarkers } from './StationMarkers';
import { SiteMarkers } from './SiteMarkers';
import { LocationMarker } from './LocationMarker';
import { BaseMapSwitcher } from './BaseMapSwitcher';

/**
 * 主地图视图组件
 * 集成多底图、基站/站点聚合、定位、底图切换、地名搜索标记
 */
export function MapView() {
  const stations = useAppStore((state) => state.stations);
  const sites = useAppStore((state) => state.sites);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const searchResultMarker = useMapStore((state) => state.searchResultMarker);
  const setSearchResultMarker = useMapStore((state) => state.setSearchResultMarker);

  const hasLegacyData = stations.length > 0;
  const hasSiteData = sites.length > 0;

  // 统计：兼容旧版 stations 和新版 sites
  const activeCount =
    stations.filter((s) => s.status === 'active').length +
    sites.filter((s) => s.status === 'active').length;
  const inactiveCount =
    stations.filter((s) => s.status === 'inactive').length +
    sites.filter((s) => s.status === 'inactive').length;
  const maintenanceCount =
    stations.filter((s) => s.status === 'maintenance').length +
    sites.filter((s) => s.status === 'maintenance').length;
  const planningCount =
    stations.filter((s) => s.status === 'planning').length +
    sites.filter((s) => s.status === 'planning').length;

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
              onSelectStation={setSelectedStation}
            />
          </StationCluster>
        )}

        {/* 新版站点扇区聚合 */}
        {hasSiteData && (
          <StationCluster>
            <SiteMarkers sites={sites} />
          </StationCluster>
        )}

        {/* 地名搜索结果临时标记 */}
        {searchResultMarker && (
          <Marker
            position={searchResultMarker}
            icon={createSearchResultIcon()}
            eventHandlers={{
              click: () => setSearchResultMarker(null),
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

      {/* 底图切换器 */}
      <BaseMapSwitcher />

      {/* 地图角落统计面板 */}
      <div className="absolute bottom-6 right-6 glass-panel px-3 py-2 z-[1000] pointer-events-none hidden md:block">
        <div className="text-xs text-gis-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>运行中: {activeCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>停用: {inactiveCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>维护中: {maintenanceCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>规划中: {planningCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
