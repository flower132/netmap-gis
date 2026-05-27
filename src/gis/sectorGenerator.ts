/**
 * 扇区 Polygon 生成器
 * 根据经纬度、方位角、波瓣宽度、半径生成 Leaflet Polygon 坐标
 *
 * 坐标系约定：
 * - 正北为 0 度
 * - 顺时针旋转
 */

/**
 * 地球赤道半径（米）
 */
const EARTH_RADIUS = 6378137;

/**
 * 一度纬度对应的米数（近似）
 */
const METERS_PER_DEGREE_LAT = 111320;

/**
 * 将米为单位的距离转换为经度偏移（度）
 */
function metersToLngDelta(meters: number, lat: number): number {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
  if (metersPerDegreeLng === 0) return 0;
  return meters / metersPerDegreeLng;
}

/**
 * 将米为单位的距离转换为纬度偏移（度）
 */
function metersToLatDelta(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}

/**
 * 地理方位角转数学弧度
 * 地理：0=北，顺时针
 * 数学：0=东，逆时针
 * 转换：mathRad = (90 - azimuth) * PI / 180
 */
function azimuthToMathRad(azimuth: number): number {
  return ((90 - azimuth) * Math.PI) / 180;
}

/**
 * 根据圆心、半径、数学角度计算地理坐标点
 */
function pointAtDistance(
  centerLat: number,
  centerLng: number,
  distanceMeters: number,
  mathRad: number
): [number, number] {
  const latDelta = metersToLatDelta(distanceMeters * Math.sin(mathRad));
  const lngDelta = metersToLngDelta(distanceMeters * Math.cos(mathRad), centerLat);
  return [centerLat + latDelta, centerLng + lngDelta];
}

/**
 * 生成扇形 Polygon 的坐标数组
 *
 * @param lat 中心纬度
 * @param lng 中心经度
 * @param azimuth 方位角（度），正北为 0，顺时针
 * @param beamwidth 波瓣宽度（度），默认 65
 * @param radius 半径（米），默认 300
 * @param steps 圆弧分段数，默认 16（越大越平滑）
 */
export function generateSectorPolygon(
  lat: number,
  lng: number,
  azimuth: number,
  beamwidth = 65,
  radius = 300,
  steps = 16
): [number, number][] {
  const halfBeam = beamwidth / 2;
  const startAzimuth = azimuth - halfBeam;
  const endAzimuth = azimuth + halfBeam;

  const coords: [number, number][] = [[lat, lng]];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAzimuth + (endAzimuth - startAzimuth) * t;
    const mathRad = azimuthToMathRad(a);
    coords.push(pointAtDistance(lat, lng, radius, mathRad));
  }

  // 闭合 polygon
  coords.push([lat, lng]);
  return coords;
}

/**
 * 获取制式对应的颜色（RGBA 带透明度）
 */
export function getSectorColor(tech?: string, opacity = 0.35): string {
  if (!tech) return `rgba(156,163,175,${opacity})`;
  const t = tech.toUpperCase();
  if (t === '4G' || t === 'LTE') return `rgba(59,130,246,${opacity})`;
  if (t === '5G' || t === 'NR') return `rgba(239,68,68,${opacity})`;
  return `rgba(156,163,175,${opacity})`;
}

/**
 * 获取制式对应的描边颜色
 */
export function getSectorBorderColor(tech?: string): string {
  if (!tech) return '#9ca3af';
  const t = tech.toUpperCase();
  if (t === '4G' || t === 'LTE') return '#2563eb';
  if (t === '5G' || t === 'NR') return '#dc2626';
  return '#9ca3af';
}
