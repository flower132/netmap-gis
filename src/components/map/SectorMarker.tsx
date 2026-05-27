import { Marker, Popup } from 'react-leaflet';
import type { Sector } from '@/types';
import { createSectorIcon, createHighlightedSectorIcon } from '@/utils/sector-icons';
import { formatCoordinates } from '@/utils/geo';

interface SectorMarkerProps {
  sector: Sector;
  siteName: string;
  siteLat: number;
  siteLng: number;
  isHighlighted?: boolean;
}

/**
 * 计算扇区在站点周围的偏移位置
 * 根据方位角方向，向外偏移一定距离，使多个扇区围绕站点显示
 */
function computeSectorPosition(
  siteLat: number,
  siteLng: number,
  azimuth?: number
): [number, number] {
  // 强制数值转换，防止字符串或异常值导致坐标偏移错误
  const lat = Number(siteLat);
  const lng = Number(siteLng);
  if (azimuth === undefined || isNaN(Number(azimuth))) {
    return [lat, lng];
  }
  // 偏移距离约 25-30 米
  const offsetDistance = 0.00028;
  const rad = (Number(azimuth) * Math.PI) / 180;
  const latOffset = offsetDistance * Math.cos(rad);
  const lngOffset = (offsetDistance * Math.sin(rad)) / Math.cos((lat * Math.PI) / 180);
  return [lat + latOffset, lng + lngOffset];
}

/**
 * 动态字段渲染：只显示存在的字段
 */
function renderSectorFields(sector: Sector) {
  const fields: { label: string; value: unknown }[] = [];

  if (sector.sectorId !== undefined) fields.push({ label: '扇区ID', value: sector.sectorId });
  if (sector.pci !== undefined) fields.push({ label: 'PCI', value: sector.pci });
  if (sector.azimuth !== undefined) fields.push({ label: '方位角', value: `${sector.azimuth}°` });
  if (sector.band !== undefined) fields.push({ label: '频段', value: sector.band });
  if (sector.arfcn !== undefined) fields.push({ label: '中心频点', value: sector.arfcn });
  if (sector.bandwidth !== undefined) fields.push({ label: '带宽', value: sector.bandwidth });
  if (sector.height !== undefined) fields.push({ label: '挂高', value: sector.height });
  if (sector.tech !== undefined) fields.push({ label: '制式', value: sector.tech });
  if (sector.tac !== undefined) fields.push({ label: 'TAC', value: sector.tac });

  return fields;
}

/**
 * 单个扇区标记组件
 * 使用 DivIcon 箭头显示方向，支持 4G/5G 颜色区分
 */
export function SectorMarker({ sector, siteName, siteLat, siteLng, isHighlighted }: SectorMarkerProps) {
  const position = computeSectorPosition(siteLat, siteLng, sector.azimuth);
  const azimuth = sector.azimuth ?? 0;

  const icon = isHighlighted
    ? createHighlightedSectorIcon(azimuth, sector.tech)
    : createSectorIcon(azimuth, sector.tech);

  const fields = renderSectorFields(sector);

  return (
    <Marker position={position} icon={icon}>
      <Popup className="station-popup">
        <div className="min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gis-100">{siteName}</h3>
            {sector.tech && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor:
                    sector.tech === '4G'
                      ? 'rgba(59,130,246,0.2)'
                      : sector.tech === '5G'
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(156,163,175,0.2)',
                  color:
                    sector.tech === '4G'
                      ? '#60a5fa'
                      : sector.tech === '5G'
                        ? '#f87171'
                        : '#9ca3af',
                }}
              >
                {sector.tech}
              </span>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gis-400">经纬度</span>
              <span className="text-gis-200 font-mono">{formatCoordinates(siteLat, siteLng)}</span>
            </div>
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between">
                <span className="text-gis-400">{f.label}</span>
                <span className="text-gis-200 font-mono">{String(f.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
