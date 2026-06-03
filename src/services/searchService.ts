import type { Site, SiteSearchIndex, RegionStats } from '@/types';
import { extractRegionFromSite, matchRegionName } from './regionService';

/**
 * 构建站点搜索索引
 * 用于加速基站号、区域等搜索
 */
export function buildSiteIndex(sites: Site[]): SiteSearchIndex[] {
  return sites.map((site) => {
    const techs = Array.from(
      new Set(
        site.sectors
          .map((s) => s.tech)
          .filter((t): t is string => !!t)
          .map((t) => {
            const up = t.toUpperCase();
            if (up === 'LTE' || up === '4G') return '4G';
            if (up === 'NR' || up === '5G') return '5G';
            return t;
          })
      )
    );

    return {
      id: site.id,
      siteName: site.siteName,
      siteId: site.siteId || null,
      region: extractRegionFromSite(site),
      techs,
      latitude: site.latitude,
      longitude: site.longitude,
      status: site.status,
    };
  });
}

/**
 * 按站名模糊搜索站点
 */
export function searchSitesByName(
  siteIndex: SiteSearchIndex[],
  query: string
): SiteSearchIndex[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return siteIndex.filter((s) => s.siteName.toLowerCase().includes(q));
}

/**
 * 按基站号模糊搜索站点
 */
export function searchSitesBySiteId(
  siteIndex: SiteSearchIndex[],
  query: string
): SiteSearchIndex[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return siteIndex.filter(
    (s) =>
      (s.siteId && s.siteId.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q)
  );
}

/**
 * 按区域搜索站点
 * 返回匹配区域的站点索引列表
 */
export function searchSitesByRegion(
  siteIndex: SiteSearchIndex[],
  query: string
): SiteSearchIndex[] {
  const region = matchRegionName(query);
  if (!region) return [];
  return siteIndex.filter((s) => s.region === region);
}

/**
 * 按区域查询统计信息
 */
export function getRegionStatsByQuery(
  regionStats: RegionStats[],
  query: string
): RegionStats | null {
  const region = matchRegionName(query);
  if (!region) return null;
  return regionStats.find((r) => r.region === region) || null;
}

/**
 * 多字段联合搜索（站名 + 基站号）
 * 用于兼容旧版站名搜索，同时支持基站号
 */
export function searchSitesUnified(
  siteIndex: SiteSearchIndex[],
  query: string
): SiteSearchIndex[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<string>();
  const results: SiteSearchIndex[] = [];

  // 先匹配站名
  for (const s of siteIndex) {
    if (s.siteName.toLowerCase().includes(q)) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        results.push(s);
      }
    }
  }

  // 再匹配基站号
  for (const s of siteIndex) {
    if (s.siteId && s.siteId.toLowerCase().includes(q)) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        results.push(s);
      }
    }
  }

  return results;
}

/**
 * 获取区域匹配建议列表（用于搜索框下拉提示）
 */
export function getRegionSuggestions(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  return [
    '云龙',
    '鼓楼',
    '泉山',
    '经开',
    '铜山',
    '贾汪',
    '丰县',
    '沛县',
    '睢宁',
    '邳州',
    '新沂',
  ].filter((r) => r.includes(q));
}

/**
 * 获取站点制式标签文本
 */
export function getTechLabel(techs: string[]): string {
  if (techs.length === 0) return '未知';
  const labels: string[] = [];
  if (techs.includes('4G')) labels.push('4G');
  if (techs.includes('5G')) labels.push('5G');
  return labels.join(' / ') || '未知';
}

/**
 * 根据 SiteSearchIndex 反查原始 Site（用于需要完整 sector 信息的场景）
 */
export function findSiteByIndex(
  sites: Site[],
  indexItem: SiteSearchIndex
): Site | undefined {
  return sites.find((s) => s.id === indexItem.id);
}

/**
 * 根据 ID 列表批量查找站点
 */
export function findSitesByIds(sites: Site[], ids: string[]): Site[] {
  const idSet = new Set(ids);
  return sites.filter((s) => idSet.has(s.id));
}

/**
 * 计算一组站点的边界框（用于区域搜索后 flyTo）
 */
export function computeBounds(
  sites: Site[]
): [[number, number], [number, number]] | null {
  if (sites.length === 0) return null;
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;
  for (const s of sites) {
    minLat = Math.min(minLat, s.latitude);
    maxLat = Math.max(maxLat, s.latitude);
    minLng = Math.min(minLng, s.longitude);
    maxLng = Math.max(maxLng, s.longitude);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * 计算边界框中心点
 */
export function getBoundsCenter(
  bounds: [[number, number], [number, number]]
): [number, number] {
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
}

/**
 * 计算适合边界框的 zoom 级别（简易版）
 */
export function getBoundsZoom(
  bounds: [[number, number], [number, number]]
): number {
  const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
  const lngDiff = Math.abs(bounds[1][1] - bounds[0][1]);
  const maxDiff = Math.max(latDiff, lngDiff);
  if (maxDiff < 0.01) return 16;
  if (maxDiff < 0.05) return 14;
  if (maxDiff < 0.2) return 12;
  if (maxDiff < 1) return 10;
  return 9;
}

/**
 * 根据索引项生成状态文本
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return '运行';
    case 'inactive':
      return '停用';
    case 'maintenance':
      return '维护';
    case 'planning':
      return '规划';
    default:
      return '未知';
  }
}

/**
 * 根据索引项生成状态颜色类名
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'active':
      return 'text-emerald-400';
    case 'inactive':
      return 'text-red-400';
    case 'maintenance':
      return 'text-amber-400';
    case 'planning':
      return 'text-blue-400';
    default:
      return 'text-gis-400';
  }
}

/**
 * 根据索引项生成状态背景类名
 */
export function getStatusBgClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20';
    case 'inactive':
      return 'bg-red-500/20';
    case 'maintenance':
      return 'bg-amber-500/20';
    case 'planning':
      return 'bg-blue-500/20';
    default:
      return 'bg-gis-700';
  }
}
