import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';

interface MobileDrawerProps {
  children: React.ReactNode;
}

/**
 * 移动端抽屉组件
 * 从左侧滑出的全屏/半屏面板，用于承载侧边栏内容
 */
export function MobileDrawer({ children }: MobileDrawerProps) {
  const isOpen = useAppStore((state) => state.isMobileDrawerOpen);
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);

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
        onClick={() => toggleMobileDrawer(false)}
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
            onClick={() => toggleMobileDrawer(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}
