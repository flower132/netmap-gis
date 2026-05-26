import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/store/useMapStore';
import { useAppStore } from '@/store/useAppStore';

/**
 * 地图控制器组件
 * 响应 flyToTarget 变化，执行平滑 flyTo 动画
 * 并在 flyTo 完成后触发高亮
 */
export function MapController() {
  const map = useMap();
  const flyToTarget = useMapStore((state) => state.flyToTarget);
  const clearFlyTo = useMapStore((state) => state.clearFlyTo);
  const setHighlightedStationId = useAppStore((state) => state.setHighlightedStationId);

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

  // 监听地图移动，同步 center/zoom 到 store（可选）
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      useMapStore.setState({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      });
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map]);

  return null;
}
