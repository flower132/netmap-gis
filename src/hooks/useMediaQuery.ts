import { useState, useEffect } from 'react';

/**
 * 响应式媒体查询 Hook
 * @param query CSS 媒体查询字符串
 * @returns 是否匹配
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    const updateMatch = () => setMatches(media.matches);
    updateMatch();

    if (media.addEventListener) {
      media.addEventListener('change', updateMatch);
    } else {
      // Safari < 14 fallback
      media.addListener(updateMatch);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', updateMatch);
      } else {
        media.removeListener(updateMatch);
      }
    };
  }, [query]);

  return matches;
}

/**
 * 检测是否为移动端（小于 768px）
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * 检测是否为平板（768px - 1024px）
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
}
