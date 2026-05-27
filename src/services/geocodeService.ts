import type { GeocodeResult } from '@/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * 使用 OpenStreetMap Nominatim API 进行地名搜索
 * @param query 搜索关键词
 * @param limit 返回结果数量上限
 * @returns 地理编码结果列表
 */
export async function searchPlace(query: string, limit = 5): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('accept-language', 'zh-CN,en');

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`地理编码请求失败: ${response.status}`);
  }

  const data: GeocodeResult[] = await response.json();
  return data;
}

/**
 * 解析 Nominatim 结果为坐标
 */
export function parseGeocodeResult(result: GeocodeResult): [number, number] {
  const lat = parseFloat(result.lat);
  const lon = parseFloat(result.lon);
  return [lat, lon];
}
