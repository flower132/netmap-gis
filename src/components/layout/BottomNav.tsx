import { Map, Layers, List, Menu } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { PanelType } from '@/store/useAppStore';
import { cn } from '@/utils/cn';

interface NavItem {
  id: PanelType;
  label: string;
  icon: typeof Map;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'menu', label: '菜单', icon: Menu },
  { id: 'layerControl', label: '图层', icon: Layers },
  { id: 'dataPanel', label: '数据', icon: List },
  { id: 'mapSettings', label: '地图', icon: Map },
];

/**
 * 移动端底部导航栏
 * 固定在屏幕底部，提供 4 个核心入口
 * 所有面板由统一状态 activePanel 控制，确保互斥显隐
 */
export function BottomNav() {
  const activePanel = useAppStore((state) => state.activePanel);
  const setActivePanel = useAppStore((state) => state.setActivePanel);

  const handleTabClick = (tab: PanelType) => {
    // 切换对应面板（已打开则关闭）
    setActivePanel(tab);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-header',
        'bg-gis-900/95 backdrop-blur-md border-t border-gis-700',
        'lg:hidden',
        'pb-safe'
      )}
      aria-label="底部导航"
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'w-full h-full min-w-[64px]',
                'transition-colors duration-200',
                isActive
                  ? 'text-blue-400'
                  : 'text-gis-400 hover:text-gis-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
