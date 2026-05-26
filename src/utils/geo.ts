/**
 * 解析经纬度字符串
 * 支持格式："39.9042,116.4074" 或 "39.9042 116.4074"
 */
export function parseCoordinates(input: string): [number, number] | null {
  const cleaned = input.trim().replace(/[，,]/g, ' ').replace(/\s+/g, ' ');
  const parts = cleaned.split(' ');

  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [lat, lng];
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化坐标显示
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * 计算两点间距离（Haversine 公式，单位：km）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
