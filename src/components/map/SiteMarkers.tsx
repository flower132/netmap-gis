import { useMemo, useState, useEffect } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import { SectorMarker } from './SectorMarker';
import { useAppStore } from '@/store/useAppStore';
import type { Site } from '@/types';

interface SiteMarkersProps {
  sites: Site[];
  maxZoom?: number;
}

/**
 * 站点扇区标记集合组件
 * 渲染所有 Site 的扇区 Marker，支持高亮状态传递
 * 仅在 zoom < maxZoom 时渲染，避免与高 zoom 的 polygon 重叠
 */
export function SiteMarkers({ sites, maxZoom = 16 }: SiteMarkersProps) {
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

  const shouldRender = zoom < maxZoom;

  // 预计算所有扇区 marker 配置，避免重复计算
  const markers = useMemo(() => {
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
          key: `${site.id}_${sector.id}`,
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
      {markers.map((m) => (
        <SectorMarker
          key={m.key}
          sector={m.sector}
          siteName={m.siteName}
          siteLat={m.siteLat}
          siteLng={m.siteLng}
          isHighlighted={m.isHighlighted}
        />
      ))}
    </>
  );
}
