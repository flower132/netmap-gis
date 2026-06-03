import type { Site, Sector, RegionStats } from '@/types';

/** 支持的徐州区县列表 */
export const SUPPORTED_REGIONS = [
  '云龙',
  '鼓楼',
  '经开',
  '铜山',
  '贾汪',
  '丰县',
  '沛县',
  '睢宁',
  '邳州',
  '新沂',
];

/** 区域名称匹配关键词（用于从站名中识别） */
const REGION_KEYWORDS: Record<string, string[]> = {
  '云龙': ['云龙'],
  '鼓楼': ['鼓楼'],
  '经开': ['经开', '开发区', '经济开发区'],
  '铜山': ['铜山'],
  '贾汪': ['贾汪'],
  '丰县': ['丰县'],
  '沛县': ['沛县'],
  '睢宁': ['睢宁'],
  '邳州': ['邳州'],
  '新沂': ['新沂'],
};

/**
 * 从站点中提取区域信息
 * 优先读取 site.region 字段，若无则从站名中关键词匹配
 */
export function extractRegionFromSite(site: Site): string | null {
  // 1. 优先读取已解析的区域字段
  if (site.region) {
    const matched = matchRegionName(site.region);
    if (matched) return matched;
  }

  // 2. 从站名中识别区域关键词
  const siteName = site.siteName || '';
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => siteName.includes(kw))) {
      return region;
    }
  }

  return null;
}

/**
 * 将输入文本与支持的区域名称进行模糊匹配
 */
export function matchRegionName(input: string): string | null {
  const q = input.trim();
  if (!q) return null;

  // 精确匹配
  const exact = SUPPORTED_REGIONS.find((r) => r === q);
  if (exact) return exact;

  // 包含匹配（输入包含区域名，或区域名包含输入）
  const contained = SUPPORTED_REGIONS.find(
    (r) => q.includes(r) || r.includes(q)
  );
  if (contained) return contained;

  return null;
}

/**
 * 判断扇区是否为 4G 制式
 */
function is4G(sector: Sector): boolean {
  if (!sector.tech) return false;
  const t = sector.tech.toUpperCase();
  return t === '4G' || t === 'LTE';
}

/**
 * 判断扇区是否为 5G 制式
 */
function is5G(sector: Sector): boolean {
  if (!sector.tech) return false;
  const t = sector.tech.toUpperCase();
  return t === '5G' || t === 'NR';
}

/**
 * 计算所有站点的区域统计
 * 仅在导入或更新数据时调用一次，结果缓存到 IndexedDB
 */
export function computeRegionStats(sites: Site[]): RegionStats[] {
  const map = new Map<
    string,
    {
      sites4G: number;
      sectors4G: number;
      sites5G: number;
      sectors5G: number;
      totalSites: number;
      totalSectors: number;
    }
  >();

  // 初始化所有支持的区域为 0
  for (const region of SUPPORTED_REGIONS) {
    map.set(region, {
      sites4G: 0,
      sectors4G: 0,
      sites5G: 0,
      sectors5G: 0,
      totalSites: 0,
      totalSectors: 0,
    });
  }

  for (const site of sites) {
    const region = extractRegionFromSite(site);
    if (!region) continue;

    const stat = map.get(region);
    if (!stat) continue;

    const has4G = site.sectors.some((s) => is4G(s));
    const has5G = site.sectors.some((s) => is5G(s));
    const sectors4G = site.sectors.filter((s) => is4G(s)).length;
    const sectors5G = site.sectors.filter((s) => is5G(s)).length;

    if (has4G) stat.sites4G += 1;
    if (has5G) stat.sites5G += 1;
    stat.sectors4G += sectors4G;
    stat.sectors5G += sectors5G;
    stat.totalSites += 1;
    stat.totalSectors += site.sectors.length;
  }

  const result: RegionStats[] = [];
  for (const region of SUPPORTED_REGIONS) {
    const stat = map.get(region)!;
    result.push({
      region,
      sites4G: stat.sites4G,
      sectors4G: stat.sectors4G,
      sites5G: stat.sites5G,
      sectors5G: stat.sectors5G,
      totalSites: stat.totalSites,
      totalSectors: stat.totalSectors,
    });
  }

  return result;
}
