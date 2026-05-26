import type { BaseMapConfig, BaseMapType } from '@/types';
import { BASE_MAPS } from '@/utils/constants';

/**
 * 获取底图配置
 */
export function getBaseMapConfig(type: BaseMapType): BaseMapConfig {
  return BASE_MAPS.find((m) => m.id === type) || BASE_MAPS[0];
}

/**
 * 获取所有底图配置
 */
export function getAllBaseMaps(): BaseMapConfig[] {
  return BASE_MAPS;
}
