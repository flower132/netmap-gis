import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Station, SearchType, BaseMapType, MapLayerConfig, LayerType } from '@/types';
import { importStationsFromCSV } from '@/services/stationService';
import { parseCoordinates } from '@/utils/geo';
import { STORAGE_KEYS, DEFAULT_BASE_MAP } from '@/utils/constants';

interface AppState {
  // 数据层
  stations: Station[];
  selectedStation: Station | null;
  importErrors: string[];
  isImporting: boolean;

  // 搜索与列表
  searchQuery: string;
  searchType: SearchType;
  searchResults: Station[] | null;
  highlightedStationId: string | null;

  // 底图
  baseMap: BaseMapType;

  // 移动端
  isMobileDrawerOpen: boolean;

  // 多图层系统（预留扩展）
  activeLayers: MapLayerConfig[];

  // Actions
  setSelectedStation: (station: Station | null) => void;
  addStations: (stations: Station[]) => void;
  removeStation: (id: string) => void;
  clearStations: () => void;
  importCSV: (file: File) => Promise<{ success: boolean; count: number }>;

  setSearchQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  executeSearch: () => Station[] | [number, number] | null;
  setHighlightedStationId: (id: string | null) => void;
  clearSearch: () => void;

  setBaseMap: (map: BaseMapType) => void;
  toggleMobileDrawer: (open?: boolean) => void;

  // 预留：图层控制
  toggleLayer: (layerType: LayerType) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      stations: [],
      selectedStation: null,
      importErrors: [],
      isImporting: false,
      searchQuery: '',
      searchType: 'name',
      searchResults: null,
      highlightedStationId: null,
      baseMap: DEFAULT_BASE_MAP,
      isMobileDrawerOpen: false,
      activeLayers: [
        { id: 'station-layer', type: 'station', name: '基站标记', visible: true, opacity: 1 },
        { id: 'heatmap-layer', type: 'heatmap', name: '热力图', visible: false, opacity: 0.7 },
        { id: 'coverage-layer', type: 'coverage', name: '覆盖图', visible: false, opacity: 0.5 },
        { id: 'kpi-layer', type: 'kpi', name: 'KPI 图层', visible: false, opacity: 0.8 },
      ],

      // 选择基站
      setSelectedStation: (station) =>
        set({ selectedStation: station }),

      // 添加基站
      addStations: (newStations) =>
        set((state) => ({ stations: [...state.stations, ...newStations] })),

      // 移除基站
      removeStation: (id) =>
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id),
          selectedStation: state.selectedStation?.id === id ? null : state.selectedStation,
        })),

      // 清空基站
      clearStations: () =>
        set({ stations: [], selectedStation: null, searchResults: null }),

      // 导入 CSV
      importCSV: async (file) => {
        set({ isImporting: true, importErrors: [] });
        try {
          const result = await importStationsFromCSV(file);
          if (result.success && result.stations.length > 0) {
            set((state) => ({
              stations: [...state.stations, ...result.stations],
            }));
          }
          set({ importErrors: result.errors });
          return { success: result.success, count: result.count };
        } finally {
          set({ isImporting: false });
        }
      },

      // 搜索 query
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchType: (type) => set({ searchType: type }),

      // 执行搜索
      executeSearch: () => {
        const { searchQuery, searchType, stations } = get();
        const query = searchQuery.trim();

        if (!query) {
          set({ searchResults: null });
          return stations;
        }

        if (searchType === 'coordinates') {
          const coords = parseCoordinates(query);
          if (coords) {
            set({ searchResults: [] });
            return coords;
          }
          set({ searchResults: [] });
          return null;
        }

        const results = stations.filter((s) =>
          s.station_name.toLowerCase().includes(query.toLowerCase())
        );
        set({ searchResults: results });
        return results;
      },

      // 高亮
      setHighlightedStationId: (id) => set({ highlightedStationId: id }),

      // 清除搜索
      clearSearch: () =>
        set({ searchQuery: '', searchResults: null, highlightedStationId: null }),

      // 底图
      setBaseMap: (map) => set({ baseMap: map }),

      // 移动端 drawer
      toggleMobileDrawer: (open) =>
        set((state) => ({
          isMobileDrawerOpen: open !== undefined ? open : !state.isMobileDrawerOpen,
        })),

      // 预留：图层控制
      toggleLayer: (layerType) =>
        set((state) => ({
          activeLayers: state.activeLayers.map((l) =>
            l.type === layerType ? { ...l, visible: !l.visible } : l
          ),
        })),

      setLayerOpacity: (layerId, opacity) =>
        set((state) => ({
          activeLayers: state.activeLayers.map((l) =>
            l.id === layerId ? { ...l, opacity } : l
          ),
        })),
    }),
    {
      name: STORAGE_KEYS.stations,
      partialize: (state) => ({
        stations: state.stations,
        baseMap: state.baseMap,
        activeLayers: state.activeLayers,
      }),
    }
  )
);
