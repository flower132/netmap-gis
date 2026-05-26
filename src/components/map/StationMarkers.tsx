import { useMemo } from 'react';
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
 */
export function StationMarkers({ stations, onSelectStation }: StationMarkersProps) {
  const highlightedId = useAppStore((state) => state.highlightedStationId);

  // 自动清除高亮（闪烁 3 秒后清除）
  const memoizedStations = useMemo(() => stations, [stations]);

  return (
    <>
      {memoizedStations.map((station) => (
        <StationMarker
          key={station.id}
          station={station}
          onSelect={onSelectStation}
          isHighlighted={station.id === highlightedId}
        />
      ))}
    </>
  );
}
