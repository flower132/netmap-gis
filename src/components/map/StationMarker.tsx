import { Marker, Popup } from 'react-leaflet';
import type { Station } from '@/types';
import { createStationIcon, createHighlightedIcon } from '@/utils/leaflet-icons';
import { Badge } from '@/components/ui/Badge';
import { formatCoordinates } from '@/utils/geo';

interface StationMarkerProps {
  station: Station;
  onSelect?: (station: Station) => void;
  isHighlighted?: boolean;
}

/**
 * 单个基站标记组件
 * 包含自定义图标和 popup 信息
 * 支持高亮闪烁状态
 */
export function StationMarker({ station, onSelect, isHighlighted }: StationMarkerProps) {
  const color =
    station.status === 'active'
      ? '#10b981'
      : station.status === 'inactive'
        ? '#ef4444'
        : station.status === 'maintenance'
          ? '#f59e0b'
          : '#3b82f6';

  const icon = isHighlighted
    ? createHighlightedIcon(color)
    : createStationIcon(color);

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(station),
      }}
    >
      <Popup className="station-popup">
        <div className="min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gis-100">
              {station.station_name}
            </h3>
            <Badge status={station.status} />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gis-400">经纬度</span>
              <span className="text-gis-200 font-mono">
                {formatCoordinates(station.latitude, station.longitude)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gis-400">PCI</span>
              <span className="text-gis-200 font-mono">{station.pci}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gis-400">频段</span>
              <span className="text-gis-200 font-mono">{station.band}</span>
            </div>
            {station.operator && (
              <div className="flex justify-between">
                <span className="text-gis-400">运营商</span>
                <span className="text-gis-200">{station.operator}</span>
              </div>
            )}
            {station.address && (
              <div className="flex justify-between">
                <span className="text-gis-400">地址</span>
                <span className="text-gis-200 text-right max-w-[120px] truncate">
                  {station.address}
                </span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
