import { useMemo, useCallback } from 'react';
import { Polygon, Popup } from 'react-leaflet';
import type { Sector } from '@/types';
import { generateSectorPolygon, getSectorColor, getSectorBorderColor } from '@/gis/sectorGenerator';
import { formatCoordinates } from '@/utils/geo';

interface SectorPolygonProps {
  sector: Sector;
  siteName: string;
  siteLat: number;
  siteLng: number;
  isHighlighted?: boolean;
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
 * 专业扇区 Polygon 组件
 * 使用 Leaflet Polygon 渲染真正的扇形覆盖区域
 * 所有扇区基于统一 anchor point，确保同心显示
 */
export function SectorPolygon({ sector, siteName, siteLat, siteLng, isHighlighted }: SectorPolygonProps) {
  const positions = useMemo(() => {
    const azimuth = sector.azimuth ?? 0;
    // generateSectorPolygon 内部已强制 Number 转换，确保坐标计算正确
    return generateSectorPolygon(siteLat, siteLng, azimuth, 65, 300, 16);
  }, [siteLat, siteLng, sector.azimuth]);

  const fillColor = useMemo(() => getSectorColor(sector.tech, isHighlighted ? 0.55 : 0.35), [sector.tech, isHighlighted]);
  const borderColor = useMemo(() => getSectorBorderColor(sector.tech), [sector.tech]);

  const eventHandlers = useCallback(
    () => ({
      click: () => {
        // 可扩展：点击扇区选中
      },
    }),
    []
  );

  const fields = useMemo(() => renderSectorFields(sector), [sector]);

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        fillColor,
        fillOpacity: isHighlighted ? 0.55 : 0.35,
        color: borderColor,
        weight: isHighlighted ? 2.5 : 1.5,
        opacity: 0.9,
        dashArray: undefined,
      }}
      eventHandlers={eventHandlers()}
    >
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
    </Polygon>
  );
}
