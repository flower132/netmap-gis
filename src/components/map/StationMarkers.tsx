import { memo, useMemo, useCallback } from 'react';
import { StationMarker } from './StationMarker';
import { useAppStore } from '@/store/useAppStore';
import type { Station } from '@/types';

interface StationMarkersProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
}

/**
 * 基站标记集合组件
 * 渲染所有基站 Marker，支持高亮状态传递
 *
 * 使用 React.memo 避免地图移动时父级重渲染导致全部 Marker 重建
 */
function StationMarkersComponent({ stations, onSelectStation }: StationMarkersProps) {
  const highlightedId = useAppStore((state) => state.highlightedStationId);

  const handleSelect = useCallback(
    (station: Station) => {
      onSelectStation(station);
    },
    [onSelectStation]
  );

  const markers = useMemo(() => {
    return stations.map((station) => (
      <StationMarker
        key={station.id}
        station={station}
        onSelect={handleSelect}
        isHighlighted={station.id === highlightedId}
      />
    ));
  }, [stations, handleSelect, highlightedId]);

  return <>{markers}</>;
}

export const StationMarkers = memo(StationMarkersComponent);
