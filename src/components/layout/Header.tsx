import { Radio, Menu, Layers } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';

/**
 * 顶部导航栏组件
 * 支持移动端菜单按钮和 GIS 专业风格
 */
export function Header() {
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);
  const isMobileDrawerOpen = useAppStore((state) => state.isMobileDrawerOpen);

  return (
    <header className="h-14 bg-gis-900/95 backdrop-blur-md border-b border-gis-700 flex items-center justify-between px-4 shrink-0 z-[1500] relative">
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
        {/* 图层管理按钮：滚动到图层面板 */}
        <button
          className="p-2 text-gis-400 hover:text-gis-200 hover:bg-gis-800 rounded-md transition-colors"
          title="图层管理"
          onClick={() => {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
              sidebar.scrollTo({ top: 0, behavior: 'smooth' });
            }
            toggleMobileDrawer(true);
          }}
        >
          <Layers className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gis-700 mx-1" />
        <span className="text-xs text-gis-500 font-mono">v2.1</span>
      </div>
    </header>
  );
}
