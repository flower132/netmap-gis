import type { GisLayer, LayerStats } from './layerTypes';
import type { Site, Sector } from '@/types';
import { generateId } from '@/utils/geo';

/** 默认 4G 图层 ID */
export const LAYER_4G_ID = 'layer-4g';
/** 默认 5G 图层 ID */
export const LAYER_5G_ID = 'layer-5g';

/**
 * 创建默认 4G 图层
 */
export function create4GLayer(): GisLayer {
  return {
    id: LAYER_4G_ID,
    name: '4G图层',
    type: 'station',
    visible: true,
    color: '#3b82f6',
    data: [],
    techFilter: '4G',
  };
}

/**
 * 创建默认 5G 图层
 */
export function create5GLayer(): GisLayer {
  return {
    id: LAYER_5G_ID,
    name: '5G图层',
    type: 'station',
    visible: true,
    color: '#ef4444',
    data: [],
    techFilter: '5G',
  };
}

/**
 * 创建默认图层列表
 */
export function createDefaultLayers(): GisLayer[] {
  return [create4GLayer(), create5GLayer()];
}

/**
 * 判断 sector 是否匹配指定制式
 */
function sectorMatchesTech(sector: Sector, tech: string): boolean {
  if (!sector.tech) return false;
  const st = sector.tech.toUpperCase();
  const tt = tech.toUpperCase();
  if (tt === '4G') return st === '4G' || st === 'LTE';
  if (tt === '5G') return st === '5G' || st === 'NR';
  return st === tt;
}

/**
 * 判断站点是否包含指定制式的扇区
 */
function siteHasTech(site: Site, tech: string): boolean {
  return site.sectors.some((s) => sectorMatchesTech(s, tech));
}

/**
 * 将站点按制式归类到对应图层
 * 一个站点可能同时属于多个图层（若包含多种制式扇区）
 */
export function distributeSitesToLayers(sites: Site[], layers: GisLayer[]): GisLayer[] {
  return layers.map((layer) => {
    if (!layer.techFilter) return layer;
    const matched = sites.filter((site) => siteHasTech(site, layer.techFilter));
    // 去重：避免同一站点被重复添加
    const existingIds = new Set(layer.data.map((s) => s.id));
    const newSites = matched.filter((s) => !existingIds.has(s.id));
    return {
      ...layer,
      data: [...layer.data, ...newSites],
    };
  });
}

/**
 * 从所有图层中聚合唯一的 Site 列表（按 id 去重）
 */
export function getAllSitesFromLayers(layers: GisLayer[]): Site[] {
  const map = new Map<string, Site>();
  for (const layer of layers) {
    for (const site of layer.data) {
      if (!map.has(site.id)) {
        map.set(site.id, site);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * 从可见图层中聚合唯一的 Site 列表
 */
export function getVisibleSitesFromLayers(layers: GisLayer[]): Site[] {
  const map = new Map<string, Site>();
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const site of layer.data) {
      if (!map.has(site.id)) {
        map.set(site.id, site);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * 从所有图层中聚合兼容旧版结构的 Station 列表
 * 每个扇区生成一个 Station（兼容旧版显示逻辑）
 */
export function getAllStationsFromLayers(layers: GisLayer[]): import('@/types').Station[] {
  const stations: import('@/types').Station[] = [];
  const seen = new Set<string>();
  for (const layer of layers) {
    for (const site of layer.data) {
      for (const sector of site.sectors) {
        const key = `${site.id}_${sector.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        stations.push({
          id: generateId(),
          station_name: `${site.siteName} ${sector.sectorId || ''}`,
          latitude: site.latitude,
          longitude: site.longitude,
          pci: sector.pci ?? 0,
          band: sector.band ?? 'N/A',
          status: site.status,
          operator: site.operator,
          address: site.address,
        });
      }
    }
  }
  return stations;
}

/**
 * 计算各图层统计信息
 */
export function computeLayerStats(layers: GisLayer[]): LayerStats[] {
  return layers.map((layer) => {
    const siteCount = layer.data.length;
    const sectorCount = layer.data.reduce((sum, site) => sum + site.sectors.length, 0);
    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      siteCount,
      sectorCount,
      color: layer.color,
    };
  });
}

/**
 * 切换图层可见性
 */
export function toggleLayerVisibility(layers: GisLayer[], layerId: string): GisLayer[] {
  return layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
}

/**
 * 按图层 ID 查找图层
 */
export function findLayerById(layers: GisLayer[], layerId: string): GisLayer | undefined {
  return layers.find((l) => l.id === layerId);
}

/**
 * 清空所有图层数据
 */
export function clearAllLayerData(layers: GisLayer[]): GisLayer[] {
  return layers.map((l) => ({ ...l, data: [] }));
}

/**
 * 搜索所有图层中的站点（按名称匹配）
 */
export function searchSitesInLayers(layers: GisLayer[], query: string): Site[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const seen = new Set<string>();
  const results: Site[] = [];
  for (const layer of layers) {
    for (const site of layer.data) {
      if (seen.has(site.id)) continue;
      if (site.siteName.toLowerCase().includes(q)) {
        seen.add(site.id);
        results.push(site);
      }
    }
  }
  return results;
}
