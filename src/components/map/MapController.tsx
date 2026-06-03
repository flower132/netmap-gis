import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/store/useMapStore';
import { useAppStore } from '@/store/useAppStore';

/**
 * 地图控制器组件
 * 响应 flyToTarget 变化，执行平滑 flyTo 动画
 * 并在 flyTo 完成后触发高亮
 * 同时监听地图移动，同步 center/zoom/bounds 到 store
 */
export function MapController() {
  const map = useMap();
  const flyToTarget = useMapStore((state) => state.flyToTarget);
  const clearFlyTo = useMapStore((state) => state.clearFlyTo);
  const setHighlightedStationId = useAppStore((state) => state.setHighlightedStationId);

  // flyTo 响应
  useEffect(() => {
    if (flyToTarget) {
      const { coords, zoom, highlightId } = flyToTarget;

      map.flyTo(coords, zoom, {
        animate: true,
        duration: 1.5,
      });

      // flyTo 完成后设置高亮
      const timer = setTimeout(() => {
        if (highlightId) {
          setHighlightedStationId(highlightId);
          // 3 秒后自动清除高亮
          setTimeout(() => {
            setHighlightedStationId(null);
          }, 3000);
        }
        clearFlyTo();
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [flyToTarget, map, clearFlyTo, setHighlightedStationId]);

  // 同步地图状态到 store
  const syncMapState = useCallback(() => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();

    useMapStore.setState({
      center: [center.lat, center.lng],
      zoom,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    });
  }, [map]);

  useEffect(() => {
    // 初始化时立即同步一次
    syncMapState();

    map.on('moveend', syncMapState);
    map.on('zoomend', syncMapState);
    return () => {
      map.off('moveend', syncMapState);
      map.off('zoomend', syncMapState);
    };
  }, [map, syncMapState]);

  return null;
}
