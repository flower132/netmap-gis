import { useState, useRef, useEffect } from 'react';
import { Layers, Map as MapIcon, Satellite, Moon, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAllBaseMaps } from '@/services/mapTileService';
import type { BaseMapType } from '@/types';
import { cn } from '@/utils/cn';

const ICON_MAP: Record<BaseMapType, React.ReactNode> = {
  osm: <Globe className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  satellite: <Satellite className="w-4 h-4" />,
  gaode: <MapIcon className="w-4 h-4" />,
};

/**
 * 底图切换器
 * 浮动在地图右下角的底图选择面板
 */
export function BaseMapSwitcher() {
  const [open, setOpen] = useState(false);
  const baseMap = useAppStore((state) => state.baseMap);
  const setBaseMap = useAppStore((state) => state.setBaseMap);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const maps = getAllBaseMaps();

  return (
    <div ref={ref} className="absolute bottom-6 left-6 z-[1000]">
      <button
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all',
          'bg-gis-800/90 backdrop-blur-md border border-gis-600/50',
          'text-gis-200 hover:text-white hover:bg-gis-700',
          open && 'bg-blue-600 border-blue-500 text-white'
        )}
        onClick={() => setOpen(!open)}
        title="切换底图"
      >
        <Layers className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-14 left-0 w-40 bg-gis-800/95 backdrop-blur-md border border-gis-600/50 rounded-lg shadow-xl overflow-hidden">
          {maps.map((m) => (
            <button
              key={m.id}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                baseMap === m.id
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gis-200 hover:bg-gis-700/60'
              )}
              onClick={() => {
                setBaseMap(m.id);
                setOpen(false);
              }}
            >
              <span className={cn(
                'flex items-center justify-center w-6 h-6 rounded',
                baseMap === m.id ? 'bg-blue-600/30 text-blue-300' : 'bg-gis-700 text-gis-400'
              )}>
                {ICON_MAP[m.id]}
              </span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
