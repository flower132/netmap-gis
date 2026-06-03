import type { ReactNode } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface StationClusterProps {
  children: ReactNode;
}

/** 本地声明 MarkerCluster 类型以兼容 TS 推断 */
interface MarkerCluster extends L.Marker {
  getChildCount(): number;
  getAllChildMarkers(): L.Marker[];
}

/**
 * 基站标记聚合组件
 * 封装 react-leaflet-cluster，配置聚合参数
 *
 * 优化参数：
 * - chunkedLoading: 分块加载，避免一次性渲染大量 Marker 导致卡顿
 * - spiderfyOnMaxZoom: 最大缩放时展开聚合
 * - maxClusterRadius: 聚合半径，根据数量动态调整
 * - animateAddingMarkers: 关闭 marker 添加动画，提升大数据量性能
 * - disableClusteringAtZoom: 在足够大的缩放级别禁用聚合，直接显示标记
 */
export function StationCluster({ children }: StationClusterProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      showCoverageOnHover={false}
      maxClusterRadius={80}
      spiderfyOnMaxZoom
      animate={false}
      animateAddingMarkers={false}
      disableClusteringAtZoom={18}
      iconCreateFunction={(cluster: MarkerCluster) => {
        const count = cluster.getChildCount();
        let size = 32;
        let bg = '#3b82f6';
        if (count >= 1000) {
          size = 56;
          bg = '#7f1d1d';
        } else if (count >= 100) {
          size = 48;
          bg = '#ef4444';
        } else if (count >= 10) {
          size = 40;
          bg = '#f59e0b';
        }

        return new L.DivIcon({
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${bg};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${count >= 1000 ? '11px' : count >= 100 ? '12px' : '13px'};
            font-weight: 700;
            border: 2px solid rgba(255,255,255,0.8);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            font-family: Inter, system-ui, sans-serif;
          ">${count}</div>`,
          className: 'station-cluster-icon',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      }}
    >
      {children}
    </MarkerClusterGroup>
  );
}
