import L from 'leaflet';

/**
 * 技术制式对应颜色
 */
export function getTechColor(tech?: string): string {
  if (!tech) return '#9ca3af'; // gray-400
  const t = tech.toUpperCase();
  if (t === '4G' || t === 'LTE') return '#3b82f6'; // blue-500
  if (t === '5G' || t === 'NR') return '#ef4444'; // red-500
  return '#9ca3af'; // gray-400
}

/**
 * 创建扇区方向箭头图标（DivIcon）
 * @param azimuth 方位角（度），0=正北，顺时针
 * @param tech 制式，决定颜色
 * @param size 图标大小
 */
export function createSectorIcon(azimuth: number, tech?: string, size = 24): L.DivIcon {
  const color = getTechColor(tech);
  // 方位角：0=北，顺时针。SVG 默认 0=右（东），需要旋转 -90 度对齐
  const rotation = azimuth - 90;

  return L.divIcon({
    className: 'sector-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
        transform-origin: center center;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round" opacity="0.95"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * 创建高亮状态的扇区方向箭头图标
 */
export function createHighlightedSectorIcon(azimuth: number, tech?: string, size = 28): L.DivIcon {
  const color = getTechColor(tech);
  const rotation = azimuth - 90;

  return L.divIcon({
    className: 'sector-marker-icon sector-highlight',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
        transform-origin: center center;
        filter: drop-shadow(0 0 4px ${color});
        animation: sectorPulse 1s ease-in-out infinite;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2Z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round" opacity="1"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * 创建临时搜索位置标记图标
 */
export function createSearchResultIcon(): L.DivIcon {
  return L.divIcon({
    className: 'search-result-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #8b5cf6;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3), 0 2px 6px rgba(0,0,0,0.3);
        animation: markerPulse 2s infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}
