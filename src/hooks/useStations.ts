import { useState, useCallback, useMemo } from 'react';
import type { Station, SearchParams } from '@/types';
import { importStationsFromCSV } from '@/services/stationService';
import { parseCoordinates } from '@/utils/geo';

/**
 * 基站数据管理 Hook
 * 封装所有基站相关的状态和操作，后期可替换为后端 API 调用
 */
export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * 导入 CSV 文件并解析为基站数据
   */
  const importCSV = useCallback(async (file: File) => {
    setIsImporting(true);
    setImportErrors([]);

    try {
      const result = await importStationsFromCSV(file);

      if (result.success && result.stations.length > 0) {
        setStations((prev) => [...prev, ...result.stations]);
      }

      setImportErrors(result.errors);
      return result;
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * 添加基站（支持批量）
   */
  const addStations = useCallback((newStations: Station[]) => {
    setStations((prev) => [...prev, ...newStations]);
  }, []);

  /**
   * 移除基站
   */
  const removeStation = useCallback((id: string) => {
    setStations((prev) => prev.filter((s) => s.id !== id));
    setSelectedStation((prev) => (prev?.id === id ? null : prev));
  }, []);

  /**
   * 清空所有基站
   */
  const clearStations = useCallback(() => {
    setStations([]);
    setSelectedStation(null);
  }, []);

  /**
   * 选择基站
   */
  const selectStation = useCallback((station: Station | null) => {
    setSelectedStation(station);
  }, []);

  /**
   * 搜索基站或解析坐标
   * 返回：基站数组（站名搜索）或坐标元组（坐标搜索）或 null
   */
  const searchStations = useCallback(
    (params: SearchParams): Station[] | [number, number] | null => {
      if (params.type === 'coordinates') {
        const coords = parseCoordinates(params.query);
        return coords;
      }

      const query = params.query.toLowerCase().trim();
      if (!query) return stations;

      return stations.filter((s) =>
        s.station_name.toLowerCase().includes(query)
      );
    },
    [stations]
  );

  /**
   * 状态统计
   */
  const stats = useMemo(() => {
    const total = stations.length;
    const active = stations.filter((s) => s.status === 'active').length;
    const inactive = stations.filter((s) => s.status === 'inactive').length;
    const maintenance = stations.filter((s) => s.status === 'maintenance').length;
    const planning = stations.filter((s) => s.status === 'planning').length;

    return { total, active, inactive, maintenance, planning };
  }, [stations]);

  return {
    stations,
    selectedStation,
    importErrors,
    isImporting,
    stats,
    importCSV,
    addStations,
    removeStation,
    clearStations,
    selectStation,
    searchStations,
  };
}
