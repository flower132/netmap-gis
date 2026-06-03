import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import { MenuPanelContent } from './MenuPanelContent';

/**
 * 移动端左侧菜单 Drawer
 * 由统一面板状态 activePanel === 'menu' 控制显隐
 * 复用原有 MobileDrawer 的 backdrop + 滑出动画结构
 */
export function MenuDrawer() {
  const activePanel = useAppStore((state) => state.activePanel);
  const closePanel = useAppStore((state) => state.closePanel);

  const isOpen = activePanel === 'menu';

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-drawer transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closePanel}
      />

      {/* Drawer Panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-[85vw] max-w-[360px] z-drawer-panel',
          'bg-gis-900 border-r border-gis-700',
          'flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gis-700 shrink-0">
          <h2 className="text-sm font-semibold text-gis-100">基站管理</h2>
          <button
            className="p-2 text-gis-400 hover:text-gis-100 hover:bg-gis-700/50 rounded-md transition-colors"
            onClick={closePanel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MenuPanelContent />
        </div>
      </aside>
    </>
  );
}
