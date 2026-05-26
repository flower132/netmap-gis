import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { MapView } from '@/components/map/MapView';
import { useAppStore } from '@/store/useAppStore';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * 首页/主页面
 * 响应式布局：桌面端 sidebar + 地图，移动端地图全屏 + drawer
 */
export function HomePage() {
  const isMobile = useIsMobile();
  const stations = useAppStore((state) => state.stations);

  return (
    <div className="h-full flex flex-col bg-gis-950 overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* 桌面端侧边栏 */}
        {!isMobile && (
          <aside className="w-80 bg-gis-900 border-r border-gis-700 flex flex-col shrink-0">
            <Sidebar />
          </aside>
        )}

        {/* 移动端抽屉 */}
        {isMobile && (
          <MobileDrawer>
            <Sidebar />
          </MobileDrawer>
        )}

        {/* 主地图区域 */}
        <main className="flex-1 relative">
          <MapView />

          {/* 移动端浮动数据概览 */}
          {isMobile && stations.length > 0 && (
            <div className="absolute top-4 left-4 right-16 z-[1000] flex gap-2 overflow-x-auto pointer-events-none">
              <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gis-200 font-mono">
                  {stations.filter((s) => s.status === 'active').length} 运行
                </span>
              </div>
              <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-gis-200 font-mono">
                  {stations.filter((s) => s.status === 'maintenance').length} 维护
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
