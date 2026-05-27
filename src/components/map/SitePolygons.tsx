import { useMemo, useState, useEffect } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import { SectorPolygon } from './SectorPolygon';
import { useAppStore } from '@/store/useAppStore';
import type { Site } from '@/types';

interface SitePolygonsProps {
  sites: Site[];
  minZoom?: number;
}

/**
 * 站点扇区 Polygon 集合
 * 仅在地图缩放级别 >= minZoom 时渲染，优化性能
 * 根据 visible 图层过滤站点（由传入的 sites 控制）
 */
export function SitePolygons({ sites, minZoom = 16 }: SitePolygonsProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const highlightedSiteId = useAppStore((state) => state.highlightedSiteId);

  // 监听地图缩放事件，确保 zoom 变化时立即重新计算渲染条件
  useMapEvent('zoomend', () => {
    setZoom(map.getZoom());
  });

  // 数据变化或组件挂载时立即同步当前 zoom，避免初始状态不一致
  useEffect(() => {
    setZoom(map.getZoom());
  }, [map, sites]);

  const shouldRender = zoom >= minZoom;

  // 预计算所有扇区 polygon 配置
  const polygons = useMemo(() => {
    if (!shouldRender) return [];
    const result: {
      key: string;
      sector: Site['sectors'][number];
      siteName: string;
      siteLat: number;
      siteLng: number;
      isHighlighted: boolean;
    }[] = [];

    for (const site of sites) {
      const isHighlighted = site.id === highlightedSiteId;
      for (const sector of site.sectors) {
        result.push({
          key: `${site.id}_${sector.id}_poly`,
          sector,
          siteName: site.siteName,
          siteLat: site.latitude,
          siteLng: site.longitude,
          isHighlighted,
        });
      }
    }
    return result;
  }, [sites, highlightedSiteId, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {polygons.map((p) => (
        <SectorPolygon
          key={p.key}
          sector={p.sector}
          siteName={p.siteName}
          siteLat={p.siteLat}
          siteLng={p.siteLng}
          isHighlighted={p.isHighlighted}
        />
      ))}
    </>
  );
}
