import { useEffect } from 'react';
import { HomePage } from '@/pages/HomePage';
import { useAppStore } from '@/store/useAppStore';

/**
 * 应用根组件
 * 初始化时从 IndexedDB 加载数据，支持旧版 localStorage 数据迁移
 */
function App() {
  const initFromDB = useAppStore((state) => state.initFromDB);
  const isDBLoading = useAppStore((state) => state.isDBLoading);

  useEffect(() => {
    initFromDB();
  }, [initFromDB]);

  if (isDBLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gis-950 text-gis-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gis-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gis-400">正在加载数据...</span>
        </div>
      </div>
    );
  }

  return <HomePage />;
}

export default App;
