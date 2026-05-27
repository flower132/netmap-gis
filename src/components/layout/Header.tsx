import { useState, useRef, useEffect } from 'react';
import { Radio, Menu, Layers, Map as MapIcon, Satellite, Moon, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAllBaseMaps } from '@/services/mapTileService';
import type { BaseMapType } from '@/types';
import { cn } from '@/utils/cn';

const BASE_MAP_ICONS: Record<BaseMapType, React.ReactNode> = {
  osm: <Globe className="w-3.5 h-3.5" />,
  dark: <Moon className="w-3.5 h-3.5" />,
  satellite: <Satellite className="w-3.5 h-3.5" />,
  gaode: <MapIcon className="w-3.5 h-3.5" />,
};

/**
 * 顶部导航栏组件
 * 支持底图切换、移动端菜单按钮和 GIS 专业风格
 */
export function Header() {
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);
  const isMobileDrawerOpen = useAppStore((state) => state.isMobileDrawerOpen);
  const baseMap = useAppStore((state) => state.baseMap);
  const setBaseMap = useAppStore((state) => state.setBaseMap);

  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLayerMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const baseMaps = getAllBaseMaps();

  return (
    <header className="h-14 bg-gis-900/95 backdrop-blur-md border-b border-gis-700 flex items-center justify-between px-4 shrink-0 z-header relative">
      <div className="flex items-center gap-3">
        {/* 移动端菜单按钮 */}
        <button
          className={cn(
            'md:hidden p-2 -ml-2 rounded-md transition-colors',
            isMobileDrawerOpen
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gis-300 hover:text-gis-100 hover:bg-gis-800'
          )}
          onClick={() => toggleMobileDrawer()}
          aria-label="打开菜单"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gis-100 leading-tight">NetMap GIS</h1>
          <p className="text-[10px] text-gis-400 leading-tight hidden xs:block">基站管理系统</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 底图切换按钮（带下拉菜单） */}
        <div ref={menuRef} className="relative">
          <button
            className={cn(
              'p-2 rounded-md transition-colors flex items-center gap-1.5',
              layerMenuOpen
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gis-400 hover:text-gis-200 hover:bg-gis-800'
            )}
            title="切换底图"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
          >
            <Layers className="w-4 h-4" />
          </button>

          {layerMenuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-gis-800/95 backdrop-blur-md border border-gis-600/50 rounded-lg shadow-xl overflow-hidden z-dropdown">
              <div className="px-3 py-2 text-[10px] text-gis-500 uppercase tracking-wider border-b border-gis-700/50">
                切换底图
              </div>
              {baseMaps.map((m) => (
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
                    setLayerMenuOpen(false);
                  }}
                >
                  <span className={cn(
                    'flex items-center justify-center w-6 h-6 rounded',
                    baseMap === m.id ? 'bg-blue-600/30 text-blue-300' : 'bg-gis-700 text-gis-400'
                  )}>
                    {BASE_MAP_ICONS[m.id]}
                  </span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gis-700 mx-1" />
        <span className="text-xs text-gis-500 font-mono">v2.1</span>
      </div>
    </header>
  );
}
