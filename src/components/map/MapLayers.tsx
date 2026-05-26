import { TileLayer } from 'react-leaflet';
import { useAppStore } from '@/store/useAppStore';
import { getBaseMapConfig } from '@/services/mapTileService';

/**
 * 底图图层组件
 * 根据 store 中的 baseMap 动态切换 TileLayer
 */
export function MapLayers() {
  const baseMap = useAppStore((state) => state.baseMap);
  const config = getBaseMapConfig(baseMap);

  return (
    <TileLayer
      key={config.id}
      attribution={config.attribution}
      url={config.url}
      maxZoom={config.maxZoom}
      subdomains={config.subdomains}
    />
  );
}
