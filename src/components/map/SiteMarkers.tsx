import { useMemo } from 'react';
import { SectorMarker } from './SectorMarker';
import { useAppStore } from '@/store/useAppStore';
import type { Site } from '@/types';

interface SiteMarkersProps {
  sites: Site[];
}

/**
 * 站点扇区标记集合组件
 * 渲染所有 Site 的扇区 Marker，支持高亮状态传递
 * 每个扇区是一个独立 Marker，聚合时由 MarkerClusterGroup 统一管理
 */
export function SiteMarkers({ sites }: SiteMarkersProps) {
  const highlightedSiteId = useAppStore((state) => state.highlightedSiteId);

  // 预计算所有扇区 marker 配置，避免重复计算
  const markers = useMemo(() => {
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
  }, [sites, highlightedSiteId]);

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
