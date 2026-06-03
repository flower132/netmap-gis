import { useAppStore } from '@/store/useAppStore';
import { RightPanel } from '@/components/layout/RightPanel';
import { MenuDrawer } from './MenuDrawer';
import { MapSettingsContent } from './MapSettingsContent';
import { LayerControlContent } from './LayerControlContent';
import { DataBottomSheet } from './DataBottomSheet';

/**
 * 统一面板容器
 * 根据 activePanel 单一状态渲染对应的面板
 * 确保同一时间只显示一个面板，实现互斥显隐
 */
export function PanelContainer() {
  const activePanel = useAppStore((state) => state.activePanel);
  const closePanel = useAppStore((state) => state.closePanel);

  return (
    <>
      {/* 菜单：左侧 Drawer */}
      <MenuDrawer />

      {/* 地图设置：右侧浮层 */}
      <RightPanel
        isOpen={activePanel === 'mapSettings'}
        onClose={closePanel}
        title="地图设置"
      >
        <MapSettingsContent />
      </RightPanel>

      {/* 图层控制：右侧浮层 */}
      <RightPanel
        isOpen={activePanel === 'layerControl'}
        onClose={closePanel}
        title="图层控制"
      >
        <LayerControlContent />
      </RightPanel>

      {/* 数据：底部 Sheet */}
      <DataBottomSheet />
    </>
  );
}
