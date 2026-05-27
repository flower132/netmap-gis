import { useCallback, useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';
import { searchPlace } from '@/services/geocodeService';
import debounce from 'lodash.debounce';

/**
 * 搜索框组件
 * 支持站名/坐标/地名搜索，联动地图 flyTo 和高亮
 */
export function SearchBox() {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchType = useAppStore((state) => state.searchType);
  const placeResults = useAppStore((state) => state.placeResults);
  const isSearchingPlace = useAppStore((state) => state.isSearchingPlace);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSearchType = useAppStore((state) => state.setSearchType);
  const setPlaceResults = useAppStore((state) => state.setPlaceResults);
  const setIsSearchingPlace = useAppStore((state) => state.setIsSearchingPlace);
  const executeSearch = useAppStore((state) => state.executeSearch);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const flyTo = useMapStore((state) => state.flyTo);
  const setSearchResultMarker = useMapStore((state) => state.setSearchResultMarker);

  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPlaceDropdown(false);
      }
    }
    if (showPlaceDropdown) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showPlaceDropdown]);

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

  // 监听输入变化，地名模式下自动搜索
  useEffect(() => {
    if (searchType === 'place') {
      debouncedSearchPlace(searchQuery);
    } else {
      setPlaceResults([]);
      setShowPlaceDropdown(false);
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
    setShowPlaceDropdown(false);
    setSearchResultMarker(null);
  }, [clearSearch, setSearchResultMarker]);

  const handlePlaceSelect = useCallback(
    (lat: string, lon: string) => {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      flyTo([latNum, lonNum], 15);
      setSearchResultMarker([latNum, lonNum]);
      setShowPlaceDropdown(false);
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
              if (searchType === 'place') {
                setShowPlaceDropdown(true);
              }
            }}
            onFocus={() => {
              if (searchType === 'place' && placeResults.length > 0) {
                setShowPlaceDropdown(true);
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

          {/* 地名搜索结果下拉 */}
          {searchType === 'place' && showPlaceDropdown && placeResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gis-900 border border-gis-700 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto">
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
