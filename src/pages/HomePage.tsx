import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PanelContainer } from '@/components/panels/PanelContainer';
import { MapView } from '@/components/map/MapView';

/**
 * 首页/主页面
 * 响应式布局：
 * - 桌面端（>= 1024px）：左侧固定 Sidebar + 右侧地图
 * - 移动端（< 1024px）：全屏地图 + 底部 BottomNav + 统一 Panel 系统
 *
 * 双导航系统共存：
 * - 桌面端：Sidebar 聚合所有功能
 * - 移动端：BottomNav 作为入口，PanelContainer 按 activePanel 渲染对应面板
 */
export function HomePage() {
  return (
    <div className="h-full flex flex-col bg-gis-950">
      {/* 顶部导航栏 */}
      <Header />

      <div className="flex-1 flex relative overflow-hidden">
        {/* 桌面端侧边栏（>= 1024px） */}
        <aside className="hidden lg:flex w-64 bg-gis-900 border-r border-gis-700 flex-col shrink-0 z-sidebar relative overflow-y-auto">
          <Sidebar />
        </aside>

        {/* 主地图区域 */}
        <main className="flex-1 relative z-map overflow-hidden pb-[var(--bottom-nav-height)] lg:pb-0">
          <MapView />
        </main>
      </div>

      {/* 移动端底部导航栏（< 1024px） */}
      <BottomNav />

      {/* 统一面板容器：根据 activePanel 渲染对应面板 */}
      <PanelContainer />
    </div>
  );
}
