'use client';

import { motion } from 'framer-motion';

export function OccupancyRing({ percentage }: { percentage: number }) {
  const normalized = Math.max(0, Math.min(100, percentage));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="fill-none stroke-slate-700/40"
          strokeWidth="12"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          className="fill-none stroke-cyan-400"
          strokeLinecap="round"
          strokeWidth="12"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-slate-100">
        {normalized.toFixed(1)}%
      </div>
    </div>
  );
}
