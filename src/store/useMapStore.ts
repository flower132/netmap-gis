import { create } from 'zustand';
import type { FlyToTarget, HeatmapPoint, KpiType } from '@/types';
import { APP_CONFIG } from '@/utils/constants';

interface MapState {
  // 视图状态
  center: [number, number];
  zoom: number;

  // FlyTo 目标（触发地图移动）
  flyToTarget: FlyToTarget | null;

  // 地名搜索结果临时标记位置
  searchResultMarker: [number, number] | null;

  // 预留：热力图数据
  heatmapData: HeatmapPoint[];

  // 预留：KPI 数据
  kpiData: Record<string, number>;
  activeKpi: KpiType | null;

  // 预留：AI 查询结果边界
  aiQueryBounds: [[number, number], [number, number]] | null;

  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setView: (center: [number, number], zoom: number) => void;
  flyTo: (coords: [number, number], zoom?: number, highlightId?: string | null) => void;
  clearFlyTo: () => void;
  setSearchResultMarker: (coords: [number, number] | null) => void;

  // 预留 Actions
  setHeatmapData: (data: HeatmapPoint[]) => void;
  setKpiData: (data: Record<string, number>, type: KpiType) => void;
  clearKpiData: () => void;
  setAiQueryBounds: (bounds: [[number, number], [number, number]] | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: APP_CONFIG.map.defaultCenter,
  zoom: APP_CONFIG.map.defaultZoom,
  flyToTarget: null,
  searchResultMarker: null,
  heatmapData: [],
  kpiData: {},
  activeKpi: null,
  aiQueryBounds: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setView: (center, zoom) => set({ center, zoom }),

  flyTo: (coords, zoom = 17, highlightId = null) =>
    set({
      flyToTarget: { coords, zoom, highlightId },
    }),

  clearFlyTo: () => set({ flyToTarget: null }),
  setSearchResultMarker: (coords) => set({ searchResultMarker: coords }),

  setHeatmapData: (data) => set({ heatmapData: data }),

  setKpiData: (data, type) =>
    set({ kpiData: data, activeKpi: type }),

  clearKpiData: () => set({ kpiData: {}, activeKpi: null }),

  setAiQueryBounds: (bounds) => set({ aiQueryBounds: bounds }),
}));
