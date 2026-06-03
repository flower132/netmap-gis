import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * 通用右侧滑出浮层组件
 * 用于地图设置、图层控制等从右侧滑出的面板
 */
export function RightPanel({ isOpen, onClose, title, children }: RightPanelProps) {
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
        onClick={onClose}
      />

      {/* Right Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-[85vw] max-w-[360px] z-drawer-panel',
          'bg-gis-900 border-l border-gis-700',
          'flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gis-700 shrink-0">
          <h2 className="text-sm font-semibold text-gis-100">{title}</h2>
          <button
            className="p-2 text-gis-400 hover:text-gis-100 hover:bg-gis-700/50 rounded-md transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}
