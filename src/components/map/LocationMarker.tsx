import { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { createLocationIcon } from '@/utils/leaflet-icons';

/**
 * 当前定位标记组件
 * 获取用户地理位置并在地图上显示
 */
export function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('浏览器不支持地理定位');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        // 自动定位到当前位置
        map.setView([latitude, longitude], 14);
      },
      (err) => {
        setError(`定位失败: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [map]);

  if (error) {
    return null; // 静默处理定位失败
  }

  if (!position) {
    return null;
  }

  return (
    <Marker position={position} icon={createLocationIcon()}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold text-gis-100">我的位置</p>
          <p className="text-gis-400 text-xs mt-1">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
