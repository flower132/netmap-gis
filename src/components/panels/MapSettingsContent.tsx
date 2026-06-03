import { Map as MapIcon, Satellite, Moon, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAllBaseMaps } from '@/services/mapTileService';
import type { BaseMapType } from '@/types';
import { cn } from '@/utils/cn';

const BASE_MAP_ICONS: Record<BaseMapType, React.ReactNode> = {
  osm: <Globe className="w-5 h-5" />,
  dark: <Moon className="w-5 h-5" />,
  satellite: <Satellite className="w-5 h-5" />,
  gaode: <MapIcon className="w-5 h-5" />,
};

/**
 * 地图设置面板内容
 * 从 Header 中提取的底图切换功能，以卡片形式展示
 */
export function MapSettingsContent() {
  const baseMap = useAppStore((state) => state.baseMap);
  const setBaseMap = useAppStore((state) => state.setBaseMap);

  const baseMaps = getAllBaseMaps();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="text-xs text-gis-400 font-medium uppercase tracking-wider">
        底图切换
      </div>

      <div className="grid grid-cols-2 gap-3">
        {baseMaps.map((m) => (
          <button
            key={m.id}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
              baseMap === m.id
                ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                : 'bg-gis-800/40 border-gis-700/50 text-gis-300 hover:bg-gis-800 hover:border-gis-600'
            )}
            onClick={() => setBaseMap(m.id)}
          >
            <span
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                baseMap === m.id
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'bg-gis-700 text-gis-400'
              )}
            >
              {BASE_MAP_ICONS[m.id]}
            </span>
            <span className="text-sm font-medium">{m.name}</span>
          </button>
        ))}
      </div>

      <div className="text-[10px] text-gis-500 mt-2 leading-relaxed">
        选择不同的底图风格以适应不同的工作场景。卫星图适合查看真实地形，深色模式适合夜间操作。
      </div>
    </div>
  );
}
