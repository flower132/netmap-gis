import { LayerPanel } from '@/components/layers/LayerPanel';
import { MenuPanelContent } from '@/components/panels/MenuPanelContent';

/**
 * 桌面端左侧边栏组件
 * 聚合所有功能模块：图层控制、导入、搜索、统计、列表
 *
 * 双导航系统：桌面端保持原有聚合侧边栏，移动端功能分散到各独立面板
 */
export function Sidebar() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* 图层控制面板 */}
      <div className="p-4 border-b border-gis-700 shrink-0">
        <LayerPanel />
      </div>

      {/* 菜单内容：导入、搜索、统计、列表、定位 */}
      <MenuPanelContent />
    </div>
  );
}
