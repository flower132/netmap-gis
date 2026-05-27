import { useCallback, useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react';
import { Search, MapPin, Radio, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import { searchPlace } from '@/services/geocodeService';
import { searchSitesInLayers } from '@/layers/layerManager';
import debounce from 'lodash.debounce';
import type { Site } from '@/types';

/**
 * 搜索框组件
 * 支持站名/坐标/地名搜索，联动地图 flyTo 和高亮
 * 站名模式：输入时实时模糊匹配，下拉显示候选站点列表
 * 地名模式：输入时调用地理编码 API，下拉显示地名建议
 */
export function SearchBox() {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchType = useAppStore((state) => state.searchType);
  const placeResults = useAppStore((state) => state.placeResults);
  const isSearchingPlace = useAppStore((state) => state.isSearchingPlace);
  const gisLayers = useAppStore((state) => state.gisLayers);
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

  // 站名模糊搜索结果（实时）
  const stationSuggestions = useMemo<Site[]>(() => {
    if (searchType !== 'name' || !searchQuery.trim()) return [];
    const results = searchSitesInLayers(gisLayers, searchQuery.trim()).slice(0, 8);
    return results;
  }, [searchType, searchQuery, gisLayers]);

  // 点击外部关闭下拉
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

  // 地名搜索 debounce
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

  // 监听输入变化
  useEffect(() => {
    if (searchType === 'place') {
      debouncedSearchPlace(searchQuery);
      if (searchQuery.trim()) setShowDropdown(true);
    } else if (searchType === 'name') {
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

  const handleSearch = useCallback(() => {
    if (searchType === 'place') return;

    const result = executeSearch();
    if (!result) return;

    // 坐标搜索
    if (Array.isArray(result) && result.length === 2 && typeof result[0] === 'number') {
      const coords = result as [number, number];
      flyTo(coords, SEARCH_FLY_ZOOM);
      setSelectedStation(null);
      return;
    }

    // 站名搜索
    const stations = result as import('@/types').Station[];
    if (stations.length === 1) {
      const s = stations[0];
      setSelectedStation(s);
      flyTo([s.latitude, s.longitude], SEARCH_FLY_ZOOM, s.id);
    } else if (stations.length > 1) {
      setSelectedStation(null);
    }
  }, [executeSearch, flyTo, setSelectedStation, searchType]);

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

  return (
    <div className="space-y-2 relative">
      <div className="flex gap-1 bg-gis-900 rounded-md p-0.5">
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
            placeholder={
              searchType === 'name'
                ? '搜索站名...'
                : searchType === 'coordinates'
                  ? '纬度, 经度'
                  : '搜索城市、地标、道路...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchType === 'place' || searchType === 'name') {
                setShowDropdown(true);
              }
            }}
            onFocus={() => {
              if ((searchType === 'place' && placeResults.length > 0) ||
                  (searchType === 'name' && stationSuggestions.length > 0)) {
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

          {/* 站名搜索结果下拉 */}
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
                    <div className="text-[10px] text-gis-500 mt-0.5">
                      {site.sectors.length} 扇区 · {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      {site.status && (
                        <span className={cn(
                          'ml-1.5 px-1 py-0.5 rounded text-[9px]',
                          site.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          site.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                          site.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {site.status === 'active' ? '运行' :
                           site.status === 'inactive' ? '停用' :
                           site.status === 'maintenance' ? '维护' : '规划'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 地名搜索结果下拉 */}
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

        {searchType !== 'place' && (
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
