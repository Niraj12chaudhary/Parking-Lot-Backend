'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';
import { Spot } from '@/lib/types';

interface FloorWithSpots {
  id: number;
  number: number;
  name: string;
  spots: Spot[];
}

export default function FloorsPage() {
  const token = useRequiredToken();
  const floorsQuery = useQuery({
    queryKey: ['floors', token],
    queryFn: () => api.floors(token as string) as Promise<FloorWithSpots[]>,
    enabled: Boolean(token),
  });

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4 md:grid-cols-2">
          {floorsQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36" />
              ))
            : (floorsQuery.data ?? []).map((floor) => {
                const occupied = floor.spots.filter(
                  (spot) => spot.status === 'occupied',
                ).length;
                return (
                  <motion.div
                    key={floor.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Card>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{floor.name}</h2>
                        <Badge>{`F-${floor.number}`}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-slate-100/70 p-3 dark:bg-slate-800/50">
                          Total Spots
                          <div className="text-lg font-semibold">{floor.spots.length}</div>
                        </div>
                        <div className="rounded-lg bg-rose-400/20 p-3">
                          Occupied
                          <div className="text-lg font-semibold">{occupied}</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
