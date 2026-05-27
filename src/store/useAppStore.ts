import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Station, Site, SearchType, BaseMapType, MapLayerConfig, LayerType, ImportStats, GeocodeResult } from '@/types';
import { importStationsFromCSV } from '@/services/stationService';
import { importSitesFromExcel } from '@/services/excelImportService';
import { parseCoordinates } from '@/utils/geo';
import { STORAGE_KEYS, DEFAULT_BASE_MAP } from '@/utils/constants';

interface AppState {
  // 数据层
  stations: Station[];
  sites: Site[];
  selectedStation: Station | null;
  selectedSite: Site | null;
  importErrors: string[];
  importStats: ImportStats | null;
  isImporting: boolean;

  // 搜索与列表
  searchQuery: string;
  searchType: SearchType;
  searchResults: Station[] | null;
  placeResults: GeocodeResult[];
  isSearchingPlace: boolean;
  highlightedStationId: string | null;
  highlightedSiteId: string | null;

  // 底图
  baseMap: BaseMapType;

  // 移动端
  isMobileDrawerOpen: boolean;

  // 多图层系统（预留扩展）
  activeLayers: MapLayerConfig[];

  // Actions
  setSelectedStation: (station: Station | null) => void;
  setSelectedSite: (site: Site | null) => void;
  addStations: (stations: Station[]) => void;
  addSites: (sites: Site[]) => void;
  removeStation: (id: string) => void;
  clearStations: () => void;
  importCSV: (file: File) => Promise<{ success: boolean; count: number }>;
  importExcel: (file: File) => Promise<{ success: boolean; count: number; failed: number }>;

  setSearchQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  executeSearch: () => Station[] | [number, number] | null;
  setPlaceResults: (results: GeocodeResult[]) => void;
  setIsSearchingPlace: (v: boolean) => void;
  setHighlightedStationId: (id: string | null) => void;
  setHighlightedSiteId: (id: string | null) => void;
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
      sites: [],
      selectedStation: null,
      selectedSite: null,
      importErrors: [],
      importStats: null,
      isImporting: false,
      searchQuery: '',
      searchType: 'name',
      searchResults: null,
      placeResults: [],
      isSearchingPlace: false,
      highlightedStationId: null,
      highlightedSiteId: null,
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

      setSelectedSite: (site) =>
        set({ selectedSite: site }),

      // 添加基站
      addStations: (newStations) =>
        set((state) => ({ stations: [...state.stations, ...newStations] })),

      addSites: (newSites) =>
        set((state) => ({ sites: [...state.sites, ...newSites] })),

      // 移除基站
      removeStation: (id) =>
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id),
          selectedStation: state.selectedStation?.id === id ? null : state.selectedStation,
        })),

      // 清空基站
      clearStations: () =>
        set({ stations: [], sites: [], selectedStation: null, selectedSite: null, searchResults: null, importStats: null }),

      // 导入 CSV（旧版兼容）
      importCSV: async (file) => {
        set({ isImporting: true, importErrors: [], importStats: null });
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

      // 导入 Excel（新版）
      importExcel: async (file) => {
        set({ isImporting: true, importErrors: [], importStats: null });
        try {
          const { sites, stats } = await importSitesFromExcel(file);
          if (sites.length > 0) {
            set((state) => ({
              sites: [...state.sites, ...sites],
            }));
          }
          set({
            importErrors: stats.errors,
            importStats: stats,
          });
          return {
            success: sites.length > 0,
            count: stats.successCount,
            failed: stats.failedCount,
          };
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

      setPlaceResults: (results) => set({ placeResults: results }),
      setIsSearchingPlace: (v) => set({ isSearchingPlace: v }),

      // 高亮
      setHighlightedStationId: (id) => set({ highlightedStationId: id }),
      setHighlightedSiteId: (id) => set({ highlightedSiteId: id }),

      // 清除搜索
      clearSearch: () =>
        set({
          searchQuery: '',
          searchResults: null,
          placeResults: [],
          highlightedStationId: null,
          highlightedSiteId: null,
        }),

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
      version: 1,
      partialize: (state) => ({
        stations: state.stations,
        sites: state.sites,
        baseMap: state.baseMap,
        activeLayers: state.activeLayers,
      }),
      migrate: (persisted: unknown, _version: number) => {
        // v0 → v1: osm/dark/satellite 在国内不可用，自动迁移到 gaode
        const state = persisted as Record<string, unknown>;
        if (state?.baseMap && state.baseMap !== 'gaode') {
          return { ...state, baseMap: 'gaode' };
        }
        return state;
      },
    }
  )
);
