import { cn } from '@/utils/cn';
import type { StationStatus } from '@/types';

interface BadgeProps {
  status: StationStatus;
  className?: string;
}

/**
 * 状态徽章组件
 * 根据基站状态显示不同颜色
 */
export function Badge({ status, className }: BadgeProps) {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-red-500/15 text-red-400 border-red-500/30',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    planning: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  const labels = {
    active: '运行中',
    inactive: '停用',
    maintenance: '维护中',
    planning: '规划中',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        styles[status],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
        'bg-emerald-400': status === 'active',
        'bg-red-400': status === 'inactive',
        'bg-amber-400': status === 'maintenance',
        'bg-blue-400': status === 'planning',
      })} />
      {labels[status]}
    </span>
  );
}
