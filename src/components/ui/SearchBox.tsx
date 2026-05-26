import { useCallback, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import { cn } from '@/utils/cn';
import { SEARCH_FLY_ZOOM } from '@/utils/constants';

/**
 * 搜索框组件
 * 支持站名/坐标搜索，联动地图 flyTo 和高亮
 */
export function SearchBox() {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchType = useAppStore((state) => state.searchType);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSearchType = useAppStore((state) => state.setSearchType);
  const executeSearch = useAppStore((state) => state.executeSearch);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const flyTo = useMapStore((state) => state.flyTo);

  const handleSearch = useCallback(() => {
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
      // 只有一个结果，直接 flyTo 并高亮
      const s = stations[0];
      setSelectedStation(s);
      flyTo([s.latitude, s.longitude], SEARCH_FLY_ZOOM, s.id);
    } else if (stations.length > 1) {
      // 多个结果，不 flyTo，只更新列表
      setSelectedStation(null);
    }
  }, [executeSearch, flyTo, setSelectedStation]);

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
  }, [clearSearch]);

  return (
    <div className="space-y-2">
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
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={searchType === 'name' ? '搜索站名...' : '纬度, 经度'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          icon={<Search className="w-4 h-4" />}
          className="text-sm"
        />
        <Button size="sm" onClick={handleSearch} className="shrink-0 min-w-[48px]">
          <Search className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">搜索</span>
        </Button>
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0 px-2">
            清除
          </Button>
        )}
      </div>
    </div>
  );
}
