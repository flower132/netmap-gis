import { useMemo } from 'react';
import { useMap } from 'react-leaflet';
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
  const zoom = map.getZoom();
  const highlightedSiteId = useAppStore((state) => state.highlightedSiteId);

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
