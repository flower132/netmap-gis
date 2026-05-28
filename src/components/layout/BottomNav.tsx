import { Map, Layers, List, Menu } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { id: 'map' as const, label: '地图', icon: Map },
  { id: 'layers' as const, label: '图层', icon: Layers },
  { id: 'data' as const, label: '数据', icon: List },
  { id: 'menu' as const, label: '菜单', icon: Menu },
];

/**
 * 移动端底部导航栏
 * 固定在屏幕底部，提供 4 个核心入口
 * 点击菜单项时自动切换 active 状态并控制 drawer 显隐
 */
export function BottomNav() {
  const mobileActiveTab = useAppStore((state) => state.mobileActiveTab);
  const setMobileActiveTab = useAppStore((state) => state.setMobileActiveTab);
  const toggleMobileDrawer = useAppStore((state) => state.toggleMobileDrawer);

  const handleTabClick = (tab: typeof NAV_ITEMS[number]['id']) => {
    setMobileActiveTab(tab);

    if (tab === 'map') {
      toggleMobileDrawer(false);
    } else {
      // 其他 tab 打开 drawer，方便用户继续操作
      toggleMobileDrawer(true);
    }
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
          const isActive = mobileActiveTab === item.id;
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
