import { MapContainer } from 'react-leaflet';
import { useAppStore } from '@/store/useAppStore';
import { APP_CONFIG } from '@/utils/constants';
import { MapLayers } from './MapLayers';
import { MapController } from './MapController';
import { StationCluster } from './StationCluster';
import { StationMarkers } from './StationMarkers';
import { LocationMarker } from './LocationMarker';
import { BaseMapSwitcher } from './BaseMapSwitcher';

/**
 * 主地图视图组件
 * 集成多底图、基站聚合、定位、底图切换
 */
export function MapView() {
  const stations = useAppStore((state) => state.stations);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);

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

        <StationCluster>
          <StationMarkers
            stations={stations}
            onSelectStation={setSelectedStation}
          />
        </StationCluster>
      </MapContainer>

      {/* 底图切换器 */}
      <BaseMapSwitcher />

      {/* 地图角落统计面板 */}
      <div className="absolute bottom-6 right-6 glass-panel px-3 py-2 z-[1000] pointer-events-none hidden md:block">
        <div className="text-xs text-gis-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>运行中: {stations.filter((s) => s.status === 'active').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>停用: {stations.filter((s) => s.status === 'inactive').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>维护中: {stations.filter((s) => s.status === 'maintenance').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>规划中: {stations.filter((s) => s.status === 'planning').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
