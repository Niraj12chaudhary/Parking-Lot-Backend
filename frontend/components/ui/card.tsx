import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-soft backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/65',
        className,
      )}
    >
      {children}
    </div>
  );
}
