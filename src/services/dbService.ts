import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Site, GisLayer, MapLayerConfig, RegionStats, SiteSearchIndex } from '@/types';

const DB_NAME = 'gis-app-db';
const DB_VERSION = 2;

interface GisAppDB extends DBSchema {
  sites: {
    key: string;
    value: Site;
  };
  layerMeta: {
    key: string;
    value: {
      id: string;
      name: string;
      type: string;
      visible: boolean;
      color?: string;
      techFilter?: string;
    };
  };
  appConfig: {
    key: string;
    value: {
      gisLayers: GisLayer[];
      baseMap: string;
      activeLayers: MapLayerConfig[];
    };
  };
  regionStats: {
    key: string;
    value: RegionStats;
  };
  siteIndex: {
    key: string;
    value: SiteSearchIndex;
  };
}

let dbInstance: IDBPDatabase<GisAppDB> | null = null;

async function getDB(): Promise<IDBPDatabase<GisAppDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<GisAppDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('sites')) {
          db.createObjectStore('sites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('layerMeta')) {
          db.createObjectStore('layerMeta', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appConfig')) {
          db.createObjectStore('appConfig');
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('regionStats')) {
          db.createObjectStore('regionStats', { keyPath: 'region' });
        }
        if (!db.objectStoreNames.contains('siteIndex')) {
          db.createObjectStore('siteIndex', { keyPath: 'id' });
        }
      }
    },
  });
  return dbInstance;
}

/**
 * 批量保存站点数据到 IndexedDB
 * 使用事务批量写入，提升性能
 */
export async function saveSites(sites: Site[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sites', 'readwrite');
  const store = tx.objectStore('sites');
  await store.clear();
  for (const site of sites) {
    store.put(site);
  }
  await tx.done;
}

/**
 * 从 IndexedDB 加载所有站点数据
 */
export async function loadSites(): Promise<Site[]> {
  const db = await getDB();
  return db.getAll('sites');
}

/**
 * 保存图层元数据（不含 data 字段）
 */
export async function saveLayerMeta(layers: GisLayer[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('layerMeta', 'readwrite');
  const store = tx.objectStore('layerMeta');
  await store.clear();
  for (const layer of layers) {
    const { data, ...meta } = layer;
    store.put(meta);
  }
  await tx.done;
}

/**
 * 加载图层元数据
 */
export async function loadLayerMeta(): Promise<Omit<GisLayer, 'data'>[]> {
  const db = await getDB();
  return db.getAll('layerMeta') as Promise<Omit<GisLayer, 'data'>[]>;
}

/**
 * 保存应用状态到 IndexedDB
 */
export async function saveAppState(state: {
  gisLayers: GisLayer[];
  baseMap: string;
  activeLayers: MapLayerConfig[];
}): Promise<void> {
  const db = await getDB();
  await db.put('appConfig', state, 'appState');
}

/**
 * 从 IndexedDB 加载应用状态
 */
export async function loadAppState(): Promise<
  | {
      gisLayers: GisLayer[];
      baseMap: string;
      activeLayers: MapLayerConfig[];
    }
  | undefined
> {
  const db = await getDB();
  return db.get('appConfig', 'appState') as Promise<
    {
      gisLayers: GisLayer[];
      baseMap: string;
      activeLayers: MapLayerConfig[];
    } | undefined
  >;
}

/**
 * 保存区域统计缓存到 IndexedDB
 */
export async function saveRegionStats(stats: RegionStats[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('regionStats', 'readwrite');
  const store = tx.objectStore('regionStats');
  await store.clear();
  for (const stat of stats) {
    store.put(stat);
  }
  await tx.done;
}

/**
 * 从 IndexedDB 加载区域统计缓存
 */
export async function loadRegionStats(): Promise<RegionStats[]> {
  const db = await getDB();
  return db.getAll('regionStats');
}

/**
 * 保存站点搜索索引到 IndexedDB
 */
export async function saveSiteIndex(index: SiteSearchIndex[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('siteIndex', 'readwrite');
  const store = tx.objectStore('siteIndex');
  await store.clear();
  for (const item of index) {
    store.put(item);
  }
  await tx.done;
}

/**
 * 从 IndexedDB 加载站点搜索索引
 */
export async function loadSiteIndex(): Promise<SiteSearchIndex[]> {
  const db = await getDB();
  return db.getAll('siteIndex');
}

/**
 * 清空所有 IndexedDB 数据
 */
export async function clearAllDBData(): Promise<void> {
  const db = await getDB();
  await db.clear('sites');
  await db.clear('layerMeta');
  await db.clear('appConfig');
  await db.clear('regionStats');
  await db.clear('siteIndex');
}

/**
 * 从 localStorage 迁移旧数据到 IndexedDB
 * 迁移完成后清理 localStorage
 */
export async function migrateFromLocalStorage(): Promise<{
  sites: Site[];
  layerMeta: Omit<GisLayer, 'data'>[];
  baseMap: string;
  activeLayers: MapLayerConfig[];
} | null> {
  try {
    const raw = localStorage.getItem('gis-stations-v1');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const state = parsed.state || parsed;
    const gisLayers = state.gisLayers as GisLayer[] | undefined;

    if (!gisLayers || !Array.isArray(gisLayers)) return null;

    const allSites: Site[] = [];
    const seen = new Set<string>();
    const layerMeta: Omit<GisLayer, 'data'>[] = [];

    for (const layer of gisLayers) {
      const { data, ...meta } = layer;
      layerMeta.push(meta);
      if (Array.isArray(data)) {
        for (const site of data) {
          if (!seen.has(site.id)) {
            seen.add(site.id);
            allSites.push(site);
          }
        }
      }
    }

    // 保存到 IndexedDB
    await saveSites(allSites);
    await saveLayerMeta(gisLayers);

    const activeLayers = state.activeLayers || [
      { id: 'station-layer', type: 'station', name: '基站标记', visible: true, opacity: 1 },
      { id: 'heatmap-layer', type: 'heatmap', name: '热力图', visible: false, opacity: 0.7 },
      { id: 'coverage-layer', type: 'coverage', name: '覆盖图', visible: false, opacity: 0.5 },
      { id: 'kpi-layer', type: 'kpi', name: 'KPI 图层', visible: false, opacity: 0.8 },
    ];

    await saveAppState({
      gisLayers,
      baseMap: state.baseMap || 'gaode',
      activeLayers,
    });

    // 清理旧 localStorage
    localStorage.removeItem('gis-stations-v1');

    return {
      sites: allSites,
      layerMeta,
      baseMap: state.baseMap || 'gaode',
      activeLayers,
    };
  } catch (e) {
    console.error('从 localStorage 迁移数据失败:', e);
    return null;
  }
}
