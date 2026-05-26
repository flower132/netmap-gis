import { cn } from '@/utils/cn';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

/**
 * 通用输入框组件
 * 支持前缀图标
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gis-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 bg-gis-900 border border-gis-600 rounded-md',
            'text-sm text-gis-100 placeholder:text-gis-500',
            'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
            'transition-all',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
