import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useAppStore } from '@/store/useAppStore';
import { SiteCanvasLayer, CANVAS_RENDER_THRESHOLD } from '@/map/canvasLayer';
import { formatCoordinates } from '@/utils/geo';
import type { Site } from '@/types';

interface CanvasSiteMarkersProps {
  sites: Site[];
}

/**
 * Canvas 渲染的站点标记组件
 * 自动使用 Leaflet Canvas 替代 DOM DivIcon
 * 适用于大数据量（> 2000 条）场景
 *
 * 通过 L.popup 手动管理弹窗交互
 */
export function CanvasSiteMarkers({ sites }: CanvasSiteMarkersProps) {
  const map = useMap();
  const canvasLayerRef = useRef<SiteCanvasLayer>(new SiteCanvasLayer());
  const popupRef = useRef<L.Popup | null>(null);
  const highlightedSiteId = useAppStore((state) => state.highlightedSiteId);
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);

  const handlePopupClick = useCallback(
    (site: Site, sector: Site['sectors'][number]) => {
      setSelectedSite(site);

      // 构建弹窗内容
      const fields: string[] = [];
      if (sector.sectorId !== undefined) fields.push(`扇区ID: ${sector.sectorId}`);
      if (sector.pci !== undefined) fields.push(`PCI: ${sector.pci}`);
      if (sector.azimuth !== undefined) fields.push(`方位角: ${sector.azimuth}\u00B0`);
      if (sector.band !== undefined) fields.push(`频段: ${sector.band}`);
      if (sector.arfcn !== undefined) fields.push(`中心频点: ${sector.arfcn}`);
      if (sector.bandwidth !== undefined) fields.push(`带宽: ${sector.bandwidth}`);
      if (sector.height !== undefined) fields.push(`挂高: ${sector.height}`);
      if (sector.tech !== undefined) fields.push(`制式: ${sector.tech}`);
      if (sector.tac !== undefined) fields.push(`TAC: ${sector.tac}`);

      const html = `
        <div style="min-width:200px;font-family:Inter,system-ui,sans-serif;font-size:12px;color:#e2e8f0;background:#0b1220;padding:4px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:600;font-size:13px;">${site.siteName}</span>
            ${sector.tech ? `<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:${
              sector.tech === '5G' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'
            };color:${sector.tech === '5G' ? '#f87171' : '#60a5fa'}">${sector.tech}</span>` : ''}
          </div>
          <div style="color:#94a3b8;font-family:monospace;margin-bottom:4px;">
            ${formatCoordinates(site.latitude, site.longitude)}
          </div>
          ${fields.map(f => `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:#94a3b8">${f.split(':')[0]}</span>
            <span style="color:#cbd5e1;font-family:monospace">${f.split(':').slice(1).join(':')}</span>
          </div>`).join('')}
        </div>
      `;

      // 关闭旧弹窗，打开新弹窗
      if (popupRef.current) {
        map.closePopup(popupRef.current);
      }
      const popup = L.popup({ closeButton: true, className: 'station-popup' })
        .setLatLng([site.latitude, site.longitude])
        .setContent(html)
        .openOn(map);
      popupRef.current = popup;
    },
    [map, setSelectedSite]
  );

  const handleHover = useCallback(
    (_site: Site | null) => {
      // 预留：可用于 tooltip 或状态栏显示
    },
    []
  );

  // 预计算数据
  const sitesData = useMemo(() => ({ sites, highlightedSiteId }), [sites, highlightedSiteId]);

  useEffect(() => {
    const canvasLayer = canvasLayerRef.current;

    if (sitesData.sites.length === 0) {
      canvasLayer.destroy();
      return;
    }

    const layer = canvasLayer.createLayer(
      sitesData.sites,
      sitesData.highlightedSiteId,
      handlePopupClick,
      handleHover
    );

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, sitesData, handlePopupClick, handleHover]);

  return null;
}

/**
 * 判断是否应使用 Canvas 渲染
 */
export function shouldUseCanvas(sites: Site[]): boolean {
  // 统计所有扇区总数
  let totalSectors = 0;
  for (const site of sites) {
    totalSectors += site.sectors.length;
  }
  return totalSectors > CANVAS_RENDER_THRESHOLD;
}
