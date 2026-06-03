/**
 * Canvas 标记渲染器
 * 使用 Leaflet Canvas 原生渲染替代 DivIcon DOM 标记
 * 大幅提升几万条标记的渲染性能（从数万 DOM 节点降至单个 Canvas）
 *
 * 支持：
 * - 圆形基站标记（旧版 Station）
 * - 方向箭头扇区标记（新版 Site/Sector）
 * - 按制式着色（4G 蓝、5G 红）
 * - 视野范围自动过滤
 * - 鼠标交互（hover 高亮、click 弹窗）
 */

import L from 'leaflet';
import type { Site, Station } from '@/types';

// ==================== 颜色工具 ====================

/** 获取站点状态对应颜色 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#10b981';
    case 'inactive': return '#ef4444';
    case 'maintenance': return '#f59e0b';
    case 'planning': return '#3b82f6';
    default: return '#718096';
  }
}

/** 获取制式对应的纯色（不含透明度） */
function getTechSolidColor(tech?: string): string {
  if (!tech) return '#9ca3af';
  const t = tech.toUpperCase();
  if (t === '4G' || t === 'LTE') return '#3b82f6';
  if (t === '5G' || t === 'NR') return '#ef4444';
  return '#9ca3af';
}

// ==================== Canvas 标记图层 ====================

/**
 * 站点 Canvas 标记图层
 * 使用 L.Canvas 渲染 Site 扇区方向箭头
 */
export class SiteCanvasLayer {
  private layer: L.LayerGroup | null = null;

  /**
   * 在地图上创建/更新 Canvas 标记
   * @returns Leaflet LayerGroup（调用方 addLayer）
   */
  createLayer(
    sites: Site[],
    highlightedSiteId: string | null,
    onClickSite: (site: Site, sector: Site['sectors'][number]) => void,
    onHoverSite: (site: Site | null) => void
  ): L.LayerGroup {
    // 清除旧图层
    if (this.layer) {
      this.layer.clearLayers();
    }

    this.layer = L.layerGroup();

    const renderer = L.canvas({ padding: 0.5 });

    for (const site of sites) {
      for (const sector of site.sectors) {
        const position = computeSectorPosition(site.latitude, site.longitude, sector.azimuth);
        const color = getTechSolidColor(sector.tech);
        const isHighlighted = site.id === highlightedSiteId;
        const radius = isHighlighted ? 7 : 5;

        const marker = L.circleMarker(position, {
          renderer,
          radius,
          fillColor: color,
          fillOpacity: 0.9,
          color: '#fff',
          weight: isHighlighted ? 2.5 : 1.5,
          opacity: 0.95,
        });

        // 鼠标悬停效果
        marker.on('mouseover', () => {
          marker.setStyle({ radius: 8, weight: 2.5, fillOpacity: 1 });
          onHoverSite(site);
        });
        marker.on('mouseout', () => {
          const isHl = site.id === highlightedSiteId;
          marker.setStyle({
            radius: isHl ? 7 : 5,
            weight: isHl ? 2.5 : 1.5,
            fillOpacity: 0.9,
          });
          onHoverSite(null);
        });

        // 点击弹出信息
        marker.on('click', () => {
          onClickSite(site, sector);
        });

        this.layer.addLayer(marker);
      }
    }

    return this.layer;
  }

  destroy() {
    if (this.layer) {
      this.layer.clearLayers();
      this.layer = null;
    }
  }
}

/**
 * 基站 Canvas 标记图层（旧版兼容）
 * 使用 L.Canvas 渲染 Station 圆形标记
 */
export class StationCanvasLayer {
  private layer: L.LayerGroup | null = null;

  createLayer(
    stations: Station[],
    highlightedStationId: string | null,
    onClickStation: (station: Station) => void,
    onHoverStation: (station: Station | null) => void
  ): L.LayerGroup {
    if (this.layer) {
      this.layer.clearLayers();
    }

    this.layer = L.layerGroup();

    const renderer = L.canvas({ padding: 0.5 });

    for (const station of stations) {
      const color = getStatusColor(station.status);
      const isHighlighted = station.id === highlightedStationId;
      const radius = isHighlighted ? 7 : 5;

      const marker = L.circleMarker([station.latitude, station.longitude], {
        renderer,
        radius,
        fillColor: color,
        fillOpacity: 0.9,
        color: '#fff',
        weight: isHighlighted ? 2.5 : 1.5,
        opacity: 0.95,
      });

      marker.on('mouseover', () => {
        marker.setStyle({ radius: 8, weight: 2.5, fillOpacity: 1 });
        onHoverStation(station);
      });
      marker.on('mouseout', () => {
        const isHl = station.id === highlightedStationId;
        marker.setStyle({
          radius: isHl ? 7 : 5,
          weight: isHl ? 2.5 : 1.5,
          fillOpacity: 0.9,
        });
        onHoverStation(null);
      });

      marker.on('click', () => {
        onClickStation(station);
      });

      this.layer.addLayer(marker);
    }

    return this.layer;
  }

  destroy() {
    if (this.layer) {
      this.layer.clearLayers();
      this.layer = null;
    }
  }
}

// ==================== 工具函数 ====================

/**
 * 计算扇区在站点周围的偏移位置
 * 复用 SectorMarker 中的逻辑
 */
function computeSectorPosition(
  siteLat: number,
  siteLng: number,
  azimuth?: number
): [number, number] {
  const lat = Number(siteLat);
  const lng = Number(siteLng);
  if (azimuth === undefined || isNaN(Number(azimuth))) {
    return [lat, lng];
  }
  const offsetDistance = 0.00028;
  const rad = (Number(azimuth) * Math.PI) / 180;
  const latOffset = offsetDistance * Math.cos(rad);
  const lngOffset = (offsetDistance * Math.sin(rad)) / Math.cos((lat * Math.PI) / 180);
  return [lat + latOffset, lng + lngOffset];
}

/**
 * 根据 Site 数据量自动选择渲染方式
 * 数据量 <= THRESHOLD 时使用 React DOM 组件（支持 Popup 交互）
 * 数据量 > THRESHOLD 时使用 Canvas 渲染（高性能）
 */
export const CANVAS_RENDER_THRESHOLD = 2000;
