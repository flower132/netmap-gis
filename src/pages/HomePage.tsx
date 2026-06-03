import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { BottomNav } from '@/components/layout/BottomNav';
import { MapView } from '@/components/map/MapView';
import { useAppStore } from '@/store/useAppStore';
import { getAllSitesFromLayers } from '@/layers/layerManager';

/**
 * 首页/主页面
 * 响应式布局：
 * - 桌面端（>= 1024px）：左侧固定 Sidebar + 右侧地图
 * - 移动端（< 1024px）：全屏地图 + 底部 BottomNav + Drawer 菜单
 *
 * 性能优化：
 * - useMemo 缓存站点统计，避免每次 render 重复计算
 */
export function HomePage() {
  const gisLayers = useAppStore((state) => state.gisLayers);
  const stations = useAppStore((state) => state.stations);

  const allSites = useMemo(() => getAllSitesFromLayers(gisLayers), [gisLayers]);

  // 单次遍历计算统计
  const stats = useMemo(() => {
    let totalActive = 0;
    let totalMaintenance = 0;

    for (const s of stations) {
      if (s.status === 'active') totalActive++;
      if (s.status === 'maintenance') totalMaintenance++;
    }
    for (const s of allSites) {
      if (s.status === 'active') totalActive++;
      if (s.status === 'maintenance') totalMaintenance++;
    }

    return { totalActive, totalMaintenance };
  }, [stations, allSites]);

  const hasData = stations.length > 0 || allSites.length > 0;

  return (
    <div className="h-full flex flex-col bg-gis-950">
      {/* 顶部导航栏 */}
      <Header />

      <div className="flex-1 flex relative overflow-hidden">
        {/* 桌面端侧边栏（>= 1024px） */}
        <aside className="hidden lg:flex w-64 bg-gis-900 border-r border-gis-700 flex-col shrink-0 z-sidebar relative overflow-y-auto">
          <Sidebar />
        </aside>

        {/* 移动端抽屉（< 1024px，由 CSS 控制显隐） */}
        <MobileDrawer>
          <Sidebar />
        </MobileDrawer>

        {/* 主地图区域 */}
        <main className="flex-1 relative z-map overflow-hidden pb-[var(--bottom-nav-height)] lg:pb-0">
          <MapView />

          {/* 移动端浮动数据概览（仅移动端显示） */}
          <div className="absolute top-4 left-4 right-16 z-map-overlay flex gap-2 overflow-x-auto pointer-events-none lg:hidden">
            {hasData && (
              <>
                <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-gis-200 font-mono">
                    {stats.totalActive} 运行
                  </span>
                </div>
                <div className="glass-panel px-3 py-1.5 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-gis-200 font-mono">
                    {stats.totalMaintenance} 维护
                  </span>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* 移动端底部导航栏（< 1024px，由 CSS 控制显隐） */}
      <BottomNav />
    </div>
  );
}
