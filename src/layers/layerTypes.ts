import type { Site } from '@/types';

/**
 * GIS 图层类型
 */
export type GisLayerType = 'station' | 'heatmap' | 'polygon';

/**
 * GIS 图层数据结构
 */
export interface GisLayer {
  id: string;
  name: string;
  type: GisLayerType;
  visible: boolean;
  color?: string;
  data: Site[];
  /** 用于自动归类时的制式过滤标识 */
  techFilter?: string;
}

/**
 * 图层显示统计
 */
export interface LayerStats {
  id: string;
  name: string;
  visible: boolean;
  siteCount: number;
  sectorCount: number;
  color?: string;
}
