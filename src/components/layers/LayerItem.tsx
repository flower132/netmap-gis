import { useCallback } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import type { LayerStats } from '@/layers/layerTypes';
import { cn } from '@/utils/cn';

interface LayerItemProps {
  layer: LayerStats;
  onToggle: (layerId: string) => void;
}

/**
 * 单个图层项组件
 * 显示图层名称、数量、开关状态
 */
export function LayerItem({ layer, onToggle }: LayerItemProps) {
  const handleClick = useCallback(() => {
    onToggle(layer.id);
  }, [layer.id, onToggle]);

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-md transition-all cursor-pointer select-none',
        layer.visible
          ? 'bg-gis-800/60 hover:bg-gis-800 border border-gis-700/50'
          : 'bg-gis-900/40 hover:bg-gis-800/40 border border-transparent opacity-60'
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: layer.color || '#9ca3af' }}
        />
        <span className={cn('text-sm', layer.visible ? 'text-gis-100' : 'text-gis-400')}>
          {layer.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gis-400 font-mono tabular-nums">
          {layer.siteCount}
        </span>
        <button
          className={cn(
            'p-1 rounded transition-colors',
            layer.visible
              ? 'text-gis-200 hover:text-white hover:bg-gis-700'
              : 'text-gis-500 hover:text-gis-300 hover:bg-gis-800'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(layer.id);
          }}
          title={layer.visible ? '隐藏图层' : '显示图层'}
        >
          {layer.visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
