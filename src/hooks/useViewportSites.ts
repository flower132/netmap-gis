import { useMemo } from 'react';
import { useMapStore } from '@/store/useMapStore';
import type { Site } from '@/types';

/**
 * 视野内站点过滤阈值
 * 低于此数量时不进行视野过滤，避免小数据量时过度过滤
 */
const VIEWPORT_FILTER_THRESHOLD = 3000;

/**
 * 根据地图视野边界过滤站点
 * 仅返回当前地图范围内的站点，大幅降低渲染压力
 */
export function useViewportSites(allSites: Site[]): Site[] {
  const bounds = useMapStore((state) => state.bounds);

  return useMemo(() => {
    if (!bounds || allSites.length <= VIEWPORT_FILTER_THRESHOLD) {
      return allSites;
    }

    const result: Site[] = [];
    const { north, south, east, west } = bounds;

    for (const site of allSites) {
      if (
        site.latitude <= north &&
        site.latitude >= south &&
        site.longitude <= east &&
        site.longitude >= west
      ) {
        result.push(site);
      }
    }

    return result;
  }, [allSites, bounds]);
}

/**
 * 纯函数：根据 bounds 过滤站点
 * 用于非 Hook 场景（如直接计算）
 */
export function filterSitesByBounds(
  sites: Site[],
  bounds: { north: number; south: number; east: number; west: number }
): Site[] {
  if (sites.length <= VIEWPORT_FILTER_THRESHOLD) return sites;

  const result: Site[] = [];
  const { north, south, east, west } = bounds;

  for (const site of sites) {
    if (
      site.latitude <= north &&
      site.latitude >= south &&
      site.longitude <= east &&
      site.longitude >= west
    ) {
      result.push(site);
    }
  }

  return result;
}
