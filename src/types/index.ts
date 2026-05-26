/**
 * 基站状态枚举
 */
export type StationStatus = 'active' | 'inactive' | 'maintenance' | 'planning';

/**
 * 基站数据接口
 */
export interface Station {
  id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  pci: number;
  band: string;
  status: StationStatus;
  // 扩展字段（预留）
  created_at?: string;
  updated_at?: string;
  operator?: string;
  address?: string;
  // 预留 KPI 字段
  rsrp?: number;
  sinr?: number;
  traffic?: number;
}

/**
 * 地图视图状态
 */
export interface MapViewState {
  center: [number, number];
  zoom: number;
}

/**
 * 搜索查询类型
 */
export type SearchType = 'name' | 'coordinates';

/**
 * 搜索参数
 */
export interface SearchParams {
  type: SearchType;
  query: string;
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  count: number;
  errors: string[];
}

/**
 * 图层类型（预留扩展）
 */
export type LayerType = 'station' | 'heatmap' | 'coverage' | 'kpi';

/**
 * 底图类型
 */
export type BaseMapType = 'osm' | 'dark' | 'satellite' | 'gaode';

/**
 * 底图配置
 */
export interface BaseMapConfig {
  id: BaseMapType;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
}

/**
 * 地图图层配置（预留多图层系统）
 */
export interface MapLayerConfig {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
  // 扩展：数据源配置
  dataSource?: 'local' | 'rest' | 'postgis' | 'wms';
  url?: string;
}

/**
 * 应用配置
 */
export interface AppConfig {
  map: {
    defaultCenter: [number, number];
    defaultZoom: number;
    maxZoom: number;
    minZoom: number;
  };
  ui: {
    sidebarWidth: number;
    theme: 'dark' | 'light';
  };
}

/**
 * KPI 指标类型（预留）
 */
export type KpiType = 'rsrp' | 'sinr' | 'traffic' | 'prb';

/**
 * 热力图数据点（预留）
 */
export interface HeatmapPoint {
  lat: number;
  lng: number;
  value: number;
}

/**
 * AI 查询结果（预留）
 */
export interface AiQueryResult {
  query: string;
  stations: Station[];
  summary: string;
  bounds?: [[number, number], [number, number]];
}

/**
 * 地图 FlyTo 目标
 */
export interface FlyToTarget {
  coords: [number, number];
  zoom: number;
  highlightId?: string | null;
}
