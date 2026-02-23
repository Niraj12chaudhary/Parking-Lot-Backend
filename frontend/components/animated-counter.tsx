'use client';

import { animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    latest.toFixed(decimals),
  );
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [motionValue, value]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest));
    return () => unsubscribe();
  }, [rounded]);

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
