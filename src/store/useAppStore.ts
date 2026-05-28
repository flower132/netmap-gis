import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Station, Site, SearchType, BaseMapType, MapLayerConfig, LayerType, ImportStats, GeocodeResult } from '@/types';
import type { GisLayer } from '@/types';
import { importStationsFromCSV } from '@/services/stationService';
import { importSitesFromExcel } from '@/services/excelImportService';
import { parseCoordinates } from '@/utils/geo';
import { STORAGE_KEYS, DEFAULT_BASE_MAP } from '@/utils/constants';
import {
  createDefaultLayers,
  distributeSitesToLayers,
  getAllSitesFromLayers,
  getVisibleSitesFromLayers,
  toggleLayerVisibility,
  searchSitesInLayers,
  clearAllLayerData,
} from '@/layers/layerManager';

interface AppState {
  // 数据层 - 新版 GIS 图层系统
  gisLayers: GisLayer[];

  // 兼容旧版：直接访问聚合数据（非持久化，由 gisLayers 派生）
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
  mobileActiveTab: 'map' | 'layers' | 'data' | 'menu';

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

  // 图层 Actions
  setGisLayers: (layers: GisLayer[]) => void;
  toggleGisLayer: (layerId: string) => void;
  addSitesToLayers: (sites: Site[]) => void;

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
  setMobileActiveTab: (tab: 'map' | 'layers' | 'data' | 'menu') => void;

  // 预留：图层控制
  toggleLayer: (layerType: LayerType) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      gisLayers: createDefaultLayers(),
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
      mobileActiveTab: 'map',
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

      // 添加基站（旧版兼容：直接转换为 sites 并入图层）
      addStations: (newStations) => {
        const sites: Site[] = newStations.map((s) => ({
          id: s.id,
          siteName: s.station_name,
          latitude: s.latitude,
          longitude: s.longitude,
          status: s.status,
          sectors: [
            {
              id: `sector_${s.id}`,
              pci: s.pci,
              band: s.band,
              tech: s.band?.includes('5G') || s.band?.includes('NR') ? '5G' : '4G',
            },
          ],
          operator: s.operator,
          address: s.address,
        }));
        get().addSitesToLayers(sites);
      },

      // 添加站点（新版：自动归类到图层）
      addSites: (newSites) => {
        get().addSitesToLayers(newSites);
      },

      // 移除基站（从所有图层中移除）
      removeStation: (id) =>
        set((state) => {
          const newLayers = state.gisLayers.map((layer) => ({
            ...layer,
            data: layer.data.filter((s) => s.id !== id),
          }));
          return {
            gisLayers: newLayers,
            sites: getAllSitesFromLayers(newLayers),
            selectedStation: state.selectedStation?.id === id ? null : state.selectedStation,
            selectedSite: state.selectedSite?.id === id ? null : state.selectedSite,
          };
        }),

      // 清空基站
      clearStations: () => {
        const cleared = clearAllLayerData(get().gisLayers);
        set({
          gisLayers: cleared,
          stations: [],
          sites: [],
          selectedStation: null,
          selectedSite: null,
          searchResults: null,
          importStats: null,
        });
      },

      // 导入 CSV（旧版兼容）
      importCSV: async (file) => {
        set({ isImporting: true, importErrors: [], importStats: null });
        try {
          const result = await importStationsFromCSV(file);
          if (result.success && result.stations.length > 0) {
            get().addStations(result.stations);
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
            get().addSitesToLayers(sites);
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

      // 图层 Actions
      setGisLayers: (layers) =>
        set({
          gisLayers: layers,
          sites: getAllSitesFromLayers(layers),
        }),

      toggleGisLayer: (layerId) =>
        set((state) => {
          const newLayers = toggleLayerVisibility(state.gisLayers, layerId);
          return {
            gisLayers: newLayers,
            sites: getAllSitesFromLayers(newLayers),
          };
        }),

      addSitesToLayers: (newSites) =>
        set((state) => {
          const updated = distributeSitesToLayers(newSites, state.gisLayers);
          return {
            gisLayers: updated,
            sites: getAllSitesFromLayers(updated),
          };
        }),

      // 搜索 query
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchType: (type) => set({ searchType: type }),

      // 执行搜索
      executeSearch: () => {
        const { searchQuery, searchType, gisLayers } = get();
        const query = searchQuery.trim();

        if (!query) {
          set({ searchResults: null });
          // 返回当前所有可见站点对应的旧版 stations
          const visibleSites = getVisibleSitesFromLayers(gisLayers);
          const allStations: Station[] = [];
          for (const site of visibleSites) {
            for (const sector of site.sectors) {
              allStations.push({
                id: `${site.id}_${sector.id}`,
                station_name: `${site.siteName} ${sector.sectorId || ''}`,
                latitude: site.latitude,
                longitude: site.longitude,
                pci: sector.pci ?? 0,
                band: sector.band ?? 'N/A',
                status: site.status,
              });
            }
          }
          return allStations;
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

        const results = searchSitesInLayers(gisLayers, query);
        const matchedStations: Station[] = [];
        for (const site of results) {
          for (const sector of site.sectors) {
            matchedStations.push({
              id: `${site.id}_${sector.id}`,
              station_name: `${site.siteName} ${sector.sectorId || ''}`,
              latitude: site.latitude,
              longitude: site.longitude,
              pci: sector.pci ?? 0,
              band: sector.band ?? 'N/A',
              status: site.status,
            });
          }
        }
        set({ searchResults: matchedStations });
        return matchedStations;
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

      // 移动端底部导航 active tab
      setMobileActiveTab: (tab) =>
        set((state) => ({
          mobileActiveTab: tab,
          isMobileDrawerOpen: tab === 'map' ? false : state.isMobileDrawerOpen,
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
      version: 2,
      partialize: (state) => ({
        gisLayers: state.gisLayers,
        baseMap: state.baseMap,
        activeLayers: state.activeLayers,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;

        // v0 / v1 -> v2: 将旧版 stations/sites 迁移到 gisLayers
        if (version < 2) {
          const oldStations = (state?.stations as Station[]) || [];
          const oldSites = (state?.sites as Site[]) || [];

          // 创建默认图层
          const layers = createDefaultLayers();

          // 如果有旧版 sites，直接分发
          if (oldSites.length > 0) {
            const migrated = distributeSitesToLayers(oldSites, layers);
            return {
              ...state,
              gisLayers: migrated,
              stations: [],
              sites: [],
              baseMap: state?.baseMap || 'gaode',
            };
          }

          // 如果有旧版 stations，先转换为 sites 再分发
          if (oldStations.length > 0) {
            const convertedSites: Site[] = oldStations.map((s) => ({
              id: s.id,
              siteName: s.station_name,
              latitude: s.latitude,
              longitude: s.longitude,
              status: s.status,
              sectors: [
                {
                  id: `sector_${s.id}`,
                  pci: s.pci,
                  band: s.band,
                  tech: s.band?.includes('5G') || s.band?.includes('NR') ? '5G' : '4G',
                },
              ],
              operator: s.operator,
              address: s.address,
            }));
            const migrated = distributeSitesToLayers(convertedSites, layers);
            return {
              ...state,
              gisLayers: migrated,
              stations: [],
              sites: [],
              baseMap: state?.baseMap || 'gaode',
            };
          }

          return {
            ...state,
            gisLayers: layers,
            stations: [],
            sites: [],
            baseMap: state?.baseMap || 'gaode',
          };
        }

        // v1: osm/dark/satellite 在国内不可用，自动迁移到 gaode
        if (state?.baseMap && state.baseMap !== 'gaode') {
          return { ...state, baseMap: 'gaode' };
        }

        return state;
      },
    }
  )
);
