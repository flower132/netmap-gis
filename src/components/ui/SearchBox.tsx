import { useCallback, useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react';
import { Search, MapPin, Radio, Loader2, BarChart3, Hash, Globe } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import { searchPlace } from '@/services/geocodeService';
import { searchSitesInLayers } from '@/layers/layerManager';
import {
  searchSitesBySiteId,
  searchSitesByRegion,
  getRegionStatsByQuery,
  getRegionSuggestions,
  getTechLabel,
  getStatusLabel,
  getStatusColorClass,
  getStatusBgClass,
  computeBounds,
  getBoundsCenter,
  getBoundsZoom,
} from '@/services/searchService';
import { matchRegionName } from '@/services/regionService';
import debounce from 'lodash.debounce';
import type { Site, SiteSearchIndex, RegionStats } from '@/types';

/**
 * 搜索框组件
 * 支持站名/坐标/地名/区域/基站号搜索，联动地图 flyTo 和高亮
 */
export function SearchBox() {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchType = useAppStore((state) => state.searchType);
  const placeResults = useAppStore((state) => state.placeResults);
  const isSearchingPlace = useAppStore((state) => state.isSearchingPlace);
  const gisLayers = useAppStore((state) => state.gisLayers);
  const siteIndex = useAppStore((state) => state.siteIndex);
  const regionStats = useAppStore((state) => state.regionStats);
  const allSites = useAppStore((state) => state.sites);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSearchType = useAppStore((state) => state.setSearchType);
  const setPlaceResults = useAppStore((state) => state.setPlaceResults);
  const setIsSearchingPlace = useAppStore((state) => state.setIsSearchingPlace);
  const executeSearch = useAppStore((state) => state.executeSearch);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const flyTo = useMapStore((state) => state.flyTo);
  const setSearchResultMarker = useMapStore((state) => state.setSearchResultMarker);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ========== 各类搜索的实时建议 ==========

  // 站名模糊搜索（实时）
  const stationSuggestions = useMemo<Site[]>(() => {
    if (searchType !== 'name' || !searchQuery.trim()) return [];
    return searchSitesInLayers(gisLayers, searchQuery.trim()).slice(0, 8);
  }, [searchType, searchQuery, gisLayers]);

  // 基站号搜索（实时，使用 siteIndex 缓存）
  const siteIdSuggestions = useMemo<SiteSearchIndex[]>(() => {
    if (searchType !== 'siteId' || !searchQuery.trim()) return [];
    return searchSitesBySiteId(siteIndex, searchQuery.trim()).slice(0, 8);
  }, [searchType, searchQuery, siteIndex]);

  // 区域搜索：匹配到的统计信息
  const matchedRegionStat = useMemo<RegionStats | null>(() => {
    if (searchType !== 'region' || !searchQuery.trim()) return null;
    return getRegionStatsByQuery(regionStats, searchQuery.trim());
  }, [searchType, searchQuery, regionStats]);

  // 区域搜索：建议列表
  const regionSuggestions = useMemo<string[]>(() => {
    if (searchType !== 'region' || !searchQuery.trim()) return [];
    return getRegionSuggestions(searchQuery.trim());
  }, [searchType, searchQuery]);

  // 区域搜索：匹配的站点索引
  const regionSites = useMemo<SiteSearchIndex[]>(() => {
    if (searchType !== 'region' || !searchQuery.trim()) return [];
    return searchSitesByRegion(siteIndex, searchQuery.trim());
  }, [searchType, searchQuery, siteIndex]);

  // ========== 点击外部关闭下拉 ==========
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showDropdown]);

  // ========== 地名搜索 debounce ==========
  const debouncedSearchPlace = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setPlaceResults([]);
        setIsSearchingPlace(false);
        return;
      }
      setIsSearchingPlace(true);
      try {
        const results = await searchPlace(query, 5);
        setPlaceResults(results);
      } catch {
        setPlaceResults([]);
      } finally {
        setIsSearchingPlace(false);
      }
    }, 300),
    [setPlaceResults, setIsSearchingPlace]
  );

  // ========== 监听输入变化 ==========
  useEffect(() => {
    if (searchType === 'place') {
      debouncedSearchPlace(searchQuery);
      if (searchQuery.trim()) setShowDropdown(true);
    } else if (searchType === 'name' || searchType === 'siteId' || searchType === 'region') {
      setPlaceResults([]);
      if (searchQuery.trim()) setShowDropdown(true);
    } else {
      setPlaceResults([]);
      setShowDropdown(false);
    }
    return () => {
      debouncedSearchPlace.cancel();
    };
  }, [searchQuery, searchType, debouncedSearchPlace, setPlaceResults]);

  // ========== 执行搜索 ==========
  const handleSearch = useCallback(() => {
    if (searchType === 'place') return;

    // 区域搜索特殊处理
    if (searchType === 'region') {
      const region = matchRegionName(searchQuery.trim());
      if (region) {
        // 查找该区域所有站点并 flyTo
        const matched = searchSitesByRegion(siteIndex, region);
        const matchedSites = allSites.filter((s) => matched.some((m) => m.id === s.id));
        if (matchedSites.length > 0) {
          const bounds = computeBounds(matchedSites);
          const center = getBoundsCenter(bounds || [[0, 0], [0, 0]]);
          flyTo(center, getBoundsZoom(bounds || [[0, 0], [0, 0]]));
        }
        setShowDropdown(false);
      }
      return;
    }

    const result = executeSearch();
    if (!result) return;

    // 坐标搜索
    if (Array.isArray(result) && result.length === 2 && typeof result[0] === 'number') {
      const coords = result as [number, number];
      flyTo(coords, SEARCH_FLY_ZOOM);
      setSelectedStation(null);
      return;
    }

    // 站名/基站号搜索
    const stations = result as import('@/types').Station[];
    if (stations.length === 1) {
      const s = stations[0];
      setSelectedStation(s);
      flyTo([s.latitude, s.longitude], SEARCH_FLY_ZOOM, s.id);
    } else if (stations.length > 1) {
      setSelectedStation(null);
    }
  }, [executeSearch, flyTo, setSelectedStation, searchType, searchQuery, siteIndex, allSites]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    clearSearch();
    setShowDropdown(false);
    setSearchResultMarker(null);
  }, [clearSearch, setSearchResultMarker]);

  // ========== 选择站点（站名/基站号搜索共用） ==========
  const handleStationSelect = useCallback(
    (site: Site) => {
      setSelectedStation({
        id: site.id,
        station_name: site.siteName,
        latitude: site.latitude,
        longitude: site.longitude,
        pci: site.sectors[0]?.pci ?? 0,
        band: site.sectors[0]?.band ?? 'N/A',
        status: site.status,
      });
      flyTo([site.latitude, site.longitude], SEARCH_FLY_ZOOM, site.id);
      setShowDropdown(false);
      setSearchQuery(site.siteName);
    },
    [setSelectedStation, flyTo, setSearchQuery]
  );

  // 根据 siteIndex 反查 Site 并选择
  const handleIndexSelect = useCallback(
    (indexItem: SiteSearchIndex) => {
      const site = allSites.find((s) => s.id === indexItem.id);
      if (site) {
        handleStationSelect(site);
      }
    },
    [allSites, handleStationSelect]
  );

  const handlePlaceSelect = useCallback(
    (lat: string, lon: string) => {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      flyTo([latNum, lonNum], 15);
      setSearchResultMarker([latNum, lonNum]);
      setShowDropdown(false);
      setSearchQuery('');
    },
    [flyTo, setSearchResultMarker, setSearchQuery]
  );

  // 选择区域
  const handleRegionSelect = useCallback(
    (region: string) => {
      setSearchQuery(region);
      const matched = searchSitesByRegion(siteIndex, region);
      const matchedSites = allSites.filter((s) => matched.some((m) => m.id === s.id));
      if (matchedSites.length > 0) {
        const bounds = computeBounds(matchedSites);
        const center = getBoundsCenter(bounds || [[0, 0], [0, 0]]);
        flyTo(center, getBoundsZoom(bounds || [[0, 0], [0, 0]]));
      }
      setShowDropdown(false);
    },
    [setSearchQuery, siteIndex, allSites, flyTo]
  );

  // ========== placeholder 根据搜索类型变化 ==========
  const placeholder = useMemo(() => {
    switch (searchType) {
      case 'name':
        return '搜索站名...';
      case 'coordinates':
        return '纬度, 经度';
      case 'place':
        return '搜索城市、地标、道路...';
      case 'region':
        return '搜索区域，如：云龙...';
      case 'siteId':
        return '搜索基站号、站点编号...';
      default:
        return '搜索...';
    }
  }, [searchType]);

  return (
    <div className="space-y-2 relative">
      {/* 搜索类型切换 */}
      <div className="flex gap-1 bg-gis-900 rounded-md p-0.5 flex-wrap">
        <button
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
            searchType === 'name'
              ? 'bg-gis-700 text-gis-100'
              : 'text-gis-400 hover:text-gis-200'
          )}
          onClick={() => setSearchType('name')}
        >
          站名
        </button>
        <button
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
            searchType === 'siteId'
              ? 'bg-gis-700 text-gis-100'
              : 'text-gis-400 hover:text-gis-200'
          )}
          onClick={() => setSearchType('siteId')}
        >
          <Hash className="w-3 h-3 inline mr-0.5" />
          基站号
        </button>
        <button
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
            searchType === 'region'
              ? 'bg-gis-700 text-gis-100'
              : 'text-gis-400 hover:text-gis-200'
          )}
          onClick={() => setSearchType('region')}
        >
          <Globe className="w-3 h-3 inline mr-0.5" />
          区域
        </button>
        <button
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
            searchType === 'coordinates'
              ? 'bg-gis-700 text-gis-100'
              : 'text-gis-400 hover:text-gis-200'
          )}
          onClick={() => setSearchType('coordinates')}
        >
          坐标
        </button>
        <button
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
            searchType === 'place'
              ? 'bg-gis-700 text-gis-100'
              : 'text-gis-400 hover:text-gis-200'
          )}
          onClick={() => setSearchType('place')}
        >
          地名
        </button>
      </div>

      <div className="flex gap-2" ref={dropdownRef}>
        <div className="flex-1 relative">
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchType !== 'coordinates') {
                setShowDropdown(true);
              }
            }}
            onFocus={() => {
              if (
                (searchType === 'place' && placeResults.length > 0) ||
                (searchType === 'name' && stationSuggestions.length > 0) ||
                (searchType === 'siteId' && siteIdSuggestions.length > 0) ||
                (searchType === 'region' && (regionSuggestions.length > 0 || matchedRegionStat !== null))
              ) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDown}
            icon={
              searchType === 'place' && isSearchingPlace ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )
            }
            className="text-sm"
          />

          {/* ===== 站名搜索结果下拉 ===== */}
          {searchType === 'name' && showDropdown && stationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gis-900 border border-gis-700 rounded-md shadow-xl z-dropdown max-h-64 overflow-y-auto">
              {stationSuggestions.map((site) => (
                <button
                  key={site.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-gis-800 transition-colors flex items-start gap-2 border-b border-gis-800/50 last:border-0"
                  onClick={() => handleStationSelect(site)}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gis-100 truncate font-medium">{site.siteName}</div>
                    <div className="text-[10px] text-gis-500 mt-0.5 flex flex-wrap gap-x-2">
                      <span>{site.sectors.length} 扇区</span>
                      {site.siteId && <span>基站号: {site.siteId}</span>}
                      {site.region && <span>区域: {site.region}</span>}
                      <span>{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</span>
                      {site.status && (
                        <span className={cn(
                          'px-1 py-0.5 rounded text-[9px]',
                          getStatusBgClass(site.status)
                        )}>
                          <span className={getStatusColorClass(site.status)}>{getStatusLabel(site.status)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ===== 基站号搜索结果下拉 ===== */}
          {searchType === 'siteId' && showDropdown && siteIdSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gis-900 border border-gis-700 rounded-md shadow-xl z-dropdown max-h-64 overflow-y-auto">
              {siteIdSuggestions.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-gis-800 transition-colors flex items-start gap-2 border-b border-gis-800/50 last:border-0"
                  onClick={() => handleIndexSelect(item)}
                >
                  <Hash className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gis-100 truncate font-medium">
                      {item.siteId || '无基站号'} — {item.siteName}
                    </div>
                    <div className="text-[10px] text-gis-500 mt-0.5 flex flex-wrap gap-x-2">
                      {item.region && <span>区域: {item.region}</span>}
                      <span>制式: {getTechLabel(item.techs)}</span>
                      <span>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                      <span className={cn(
                        'px-1 py-0.5 rounded text-[9px]',
                        getStatusBgClass(item.status)
                      )}>
                        <span className={getStatusColorClass(item.status)}>{getStatusLabel(item.status)}</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ===== 区域搜索下拉 ===== */}
          {searchType === 'region' && showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gis-900 border border-gis-700 rounded-md shadow-xl z-dropdown max-h-80 overflow-y-auto">
              {/* 匹配到的区域统计卡片 */}
              {matchedRegionStat && (
                <div className="p-3 border-b border-gis-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-gis-100">{matchedRegionStat.region} 区域统计</span>
                    <span className="text-[10px] text-gis-500">({regionSites.length} 个站点)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center">
                      <div className="text-[10px] text-gis-400">4G基站</div>
                      <div className="text-sm font-bold text-blue-400">{matchedRegionStat.sites4G}</div>
                    </div>
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center">
                      <div className="text-[10px] text-gis-400">4G扇区</div>
                      <div className="text-sm font-bold text-blue-400">{matchedRegionStat.sectors4G}</div>
                    </div>
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center">
                      <div className="text-[10px] text-gis-400">5G基站</div>
                      <div className="text-sm font-bold text-red-400">{matchedRegionStat.sites5G}</div>
                    </div>
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center">
                      <div className="text-[10px] text-gis-400">5G扇区</div>
                      <div className="text-sm font-bold text-red-400">{matchedRegionStat.sectors5G}</div>
                    </div>
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center col-span-1">
                      <div className="text-[10px] text-gis-400">总基站</div>
                      <div className="text-sm font-bold text-gis-100">{matchedRegionStat.totalSites}</div>
                    </div>
                    <div className="bg-gis-800/60 rounded px-2 py-1.5 text-center col-span-1">
                      <div className="text-[10px] text-gis-400">总扇区</div>
                      <div className="text-sm font-bold text-gis-100">{matchedRegionStat.totalSectors}</div>
                    </div>
                  </div>
                  <button
                    className="w-full mt-2 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors"
                    onClick={() => handleRegionSelect(matchedRegionStat.region)}
                  >
                    查看该区域站点分布
                  </button>
                </div>
              )}

              {/* 区域建议列表 */}
              {regionSuggestions.length > 0 && !matchedRegionStat && (
                <div className="p-2">
                  <div className="text-[10px] text-gis-500 mb-1 px-1">区域建议</div>
                  {regionSuggestions.map((region) => (
                    <button
                      key={region}
                      className="w-full text-left px-2 py-1.5 hover:bg-gis-800 transition-colors rounded text-xs text-gis-100 flex items-center gap-2"
                      onClick={() => handleRegionSelect(region)}
                    >
                      <Globe className="w-3 h-3 text-gis-400" />
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {/* 无结果提示 */}
              {searchQuery.trim() && !matchedRegionStat && regionSuggestions.length === 0 && (
                <div className="p-3 text-center text-xs text-gis-500">
                  未找到匹配的区域，支持：云龙、鼓楼、经开、铜山、贾汪、丰县、沛县、睢宁、邳州、新沂
                </div>
              )}
            </div>
          )}

          {/* ===== 地名搜索结果下拉 ===== */}
          {searchType === 'place' && showDropdown && placeResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gis-900 border border-gis-700 rounded-md shadow-xl z-dropdown max-h-64 overflow-y-auto">
              {placeResults.map((result) => (
                <button
                  key={result.place_id}
                  className="w-full text-left px-3 py-2.5 hover:bg-gis-800 transition-colors flex items-start gap-2 border-b border-gis-800/50 last:border-0"
                  onClick={() => handlePlaceSelect(result.lat, result.lon)}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-gis-100 truncate">{result.display_name}</div>
                    <div className="text-[10px] text-gis-500 mt-0.5 capitalize">{result.type}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {searchType !== 'place' && searchType !== 'region' && (
          <Button size="sm" onClick={handleSearch} className="shrink-0 min-w-[48px]">
            <Search className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">搜索</span>
          </Button>
        )}
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0 px-2">
            清除
          </Button>
        )}
      </div>
    </div>
  );
}
