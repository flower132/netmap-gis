import { LayerPanel } from '@/components/layers/LayerPanel';

/**
 * 图层控制面板内容
 * 直接复用现有 LayerPanel 组件，作为独立面板展示
 */
export function LayerControlContent() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      <LayerPanel />
    </div>
  );
}
