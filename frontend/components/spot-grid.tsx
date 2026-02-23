'use client';

import { motion } from 'framer-motion';
import { Spot } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusColor: Record<Spot['status'], string> = {
  available: 'bg-emerald-400/35 border-emerald-300/70',
  occupied: 'bg-rose-400/35 border-rose-300/70',
  reserved: 'bg-amber-400/35 border-amber-300/70',
  out_of_service: 'bg-slate-500/35 border-slate-400/70',
};

export function SpotGrid({
  spots,
  highlightedSpotId,
}: {
  spots: Spot[];
  highlightedSpotId?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {spots.map((spot) => (
        <motion.div
          key={spot.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'rounded-xl border p-3 transition-all',
            statusColor[spot.status],
            highlightedSpotId === spot.id && 'ring-2 ring-cyan-300 animate-pulseSoft',
          )}
        >
          <div className="text-sm font-semibold text-slate-100">{spot.spotNumber}</div>
          <div className="text-xs uppercase tracking-wide text-slate-200/90">
            {spot.type}
          </div>
          <div className="mt-2 text-xs text-slate-200/80">{spot.status}</div>
        </motion.div>
      ))}
    </div>
  );
}
