import type { BaseMapConfig, AppConfig } from '@/types';

/**
 * 应用全局常量
 */

export const APP_CONFIG: AppConfig = {
  map: {
    defaultCenter: [39.9042, 116.4074], // 北京
    defaultZoom: 12,
    maxZoom: 19,
    minZoom: 3,
  },
  ui: {
    sidebarWidth: 320,
    theme: 'dark',
  },
};

/**
 * 底图配置列表
 */
export const BASE_MAPS: BaseMapConfig[] = [
  {
    id: 'gaode',
    name: '高德标准',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution:
      '&copy; <a href="https://www.amap.com/">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
  },
  {
    id: 'satellite',
    name: '高德卫星',
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attribution:
      '&copy; <a href="https://www.amap.com/">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
  },
  {
    id: 'dark',
    name: '暗色地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution:
      '&copy; <a href="https://www.amap.com/">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
  },
  {
    id: 'osm',
    name: '天地图',
    url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution:
      '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    maxZoom: 18,
  },
];

/**
 * 默认底图
 */
export const DEFAULT_BASE_MAP: BaseMapConfig['id'] = 'gaode';

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  stations: 'gis-stations-v1',
  appState: 'gis-app-state-v1',
} as const;

/**
 * 搜索缩放级别
 */
export const SEARCH_FLY_ZOOM = 17;

/**
 * 状态颜色映射
 */
export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  inactive: '#ef4444',
  maintenance: '#f59e0b',
  planning: '#3b82f6',
};

/**
 * 状态标签映射
 */
export const STATUS_LABELS: Record<string, string> = {
  active: '运行中',
  inactive: '停用',
  maintenance: '维护中',
  planning: '规划中',
};
