import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { MapView } from '@/components/map/MapView';
import { useAppStore } from '@/store/useAppStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getAllSitesFromLayers } from '@/layers/layerManager';

/**
 * 首页/主页面
 * 响应式布局：桌面端 sidebar + 地图，移动端地图全屏 + drawer
 */
export function HomePage() {
  const isMobile = useIsMobile();
  const gisLayers = useAppStore((state) => state.gisLayers);
  const stations = useAppStore((state) => state.stations);

  const allSites = useMemo(() => getAllSitesFromLayers(gisLayers), [gisLayers]);

  const totalActive =
    stations.filter((s) => s.status === 'active').length +
    allSites.filter((s) => s.status === 'active').length;
  const totalMaintenance =
    stations.filter((s) => s.status === 'maintenance').length +
    allSites.filter((s) => s.status === 'maintenance').length;

  return (
    <div className="h-full flex flex-col bg-gis-950">
      <Header />

      <div className="flex-1 flex relative">
        {/* 桌面端侧边栏 */}
        {!isMobile && (
          <aside className="w-80 bg-gis-900 border-r border-gis-700 flex flex-col shrink-0 z-sidebar relative overflow-y-auto">
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
        <main className="flex-1 relative z-map overflow-hidden">
          <MapView />

          {/* 移动端浮动数据概览 */}
          {isMobile && (stations.length > 0 || allSites.length > 0) && (
            <div className="absolute top-4 left-4 right-16 z-map-overlay flex gap-2 overflow-x-auto pointer-events-none">
              <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gis-200 font-mono">
                  {totalActive} 运行
                </span>
              </div>
              <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-gis-200 font-mono">
                  {totalMaintenance} 维护
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
