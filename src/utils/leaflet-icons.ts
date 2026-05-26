import L from 'leaflet';

/**
 * 创建自定义基站标记图标
 * @param color 图标颜色
 * @returns Leaflet DivIcon
 */
export function createStationIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

/**
 * 创建高亮闪烁基站标记图标
 * @param color 图标颜色
 * @returns Leaflet DivIcon
 */
export function createHighlightedIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-station-marker marker-highlight',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px ${color}66, 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: markerPulse 1s ease-in-out infinite;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * 创建当前位置标记图标
 * @returns Leaflet DivIcon
 */
export function createLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0,0,0,0.3);
        animation: markerPulse 2s infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

/**
 * 根据状态获取颜色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: '#10b981',
    inactive: '#ef4444',
    maintenance: '#f59e0b',
    planning: '#3b82f6',
  };
  return colorMap[status] || '#718096';
}

/**
 * 根据状态获取中文标签
 */
export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    active: '运行中',
    inactive: '停用',
    maintenance: '维护中',
    planning: '规划中',
  };
  return labelMap[status] || status;
}
