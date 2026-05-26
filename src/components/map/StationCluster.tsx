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
 */
export function StationCluster({ children }: StationClusterProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      showCoverageOnHover={false}
      maxClusterRadius={60}
      spiderfyOnMaxZoom
      animate
      animateAddingMarkers
      iconCreateFunction={(cluster: MarkerCluster) => {
        const count = cluster.getChildCount();
        let size = 32;
        let bg = '#3b82f6';
        if (count >= 100) {
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
            font-size: 12px;
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
