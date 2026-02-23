'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { MouseEvent, ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-soft hover:-translate-y-0.5',
        subtle:
          'bg-slate-200/70 text-slate-900 hover:-translate-y-0.5 dark:bg-slate-800/70 dark:text-slate-100',
        danger:
          'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft hover:-translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Button({
  className,
  variant,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>(
    [],
  );

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((current) => [...current, ripple]);
    setTimeout(
      () => setRipples((current) => current.filter((item) => item.id !== ripple.id)),
      650,
    );
    onClick?.(event);
  };

  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      onClick={handleClick}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 animate-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
