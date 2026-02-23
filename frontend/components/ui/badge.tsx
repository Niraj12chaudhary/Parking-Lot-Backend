import { cn } from '@/lib/utils';

export function Badge({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full border border-cyan-300/60 bg-cyan-100/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:border-cyan-600/50 dark:bg-cyan-900/40 dark:text-cyan-100',
        className,
      )}
    >
      {children}
    </span>
  );
}
