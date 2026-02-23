'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AnimatedCounter } from '@/components/animated-counter';
import { OccupancyRing } from '@/components/occupancy-ring';
import { RequireAuth } from '@/components/require-auth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParkingSocket } from '@/hooks/use-parking-socket';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';

function floorHeatColor(rate: number) {
  if (rate < 30) return 'from-emerald-400/40 to-emerald-500/20';
  if (rate < 70) return 'from-amber-400/40 to-amber-500/20';
  return 'from-rose-400/45 to-rose-500/25';
}

export default function DashboardPage() {
  const token = useRequiredToken();
  const [socketMetrics, setSocketMetrics] = useState<{
    activeTickets: number;
    occupancyRate: number;
  } | null>(null);

  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics', token],
    queryFn: () => api.dashboardMetrics(token as string),
    enabled: Boolean(token),
  });

  const revenueQuery = useQuery({
    queryKey: ['revenueSummary', token],
    queryFn: () => api.revenueSummary(token as string),
    enabled: Boolean(token),
  });

  const occupancyQuery = useQuery({
    queryKey: ['occupancyRate', token],
    queryFn: () => api.occupancyRate(token as string),
    enabled: Boolean(token),
  });

  useParkingSocket({
    onMetrics: (event) =>
      setSocketMetrics({
        activeTickets: event.activeTickets,
        occupancyRate: event.occupancyRate,
      }),
  });

  const activeTickets =
    socketMetrics?.activeTickets ?? metricsQuery.data?.activeTickets ?? 0;
  const occupancyRate =
    socketMetrics?.occupancyRate ?? occupancyQuery.data?.occupancyRate ?? 0;
  const totalRevenue = revenueQuery.data?.totalRevenue ?? 0;

  const topTrend = useMemo(() => {
    return [...(revenueQuery.data?.trend ?? [])]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [revenueQuery.data?.trend]);

  return (
    <RequireAuth>
      <AppShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-4"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
              <Card>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  Revenue
                </div>
                <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  <AnimatedCounter value={totalRevenue} prefix="$" decimals={2} />
                </div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
              <Card>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  Active Tickets
                </div>
                <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  <AnimatedCounter value={activeTickets} />
                </div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
              <Card className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    Occupancy
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Live lot utilization
                  </div>
                </div>
                <OccupancyRing percentage={occupancyRate} />
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 text-lg font-semibold">Floor Heatmap</div>
              {occupancyQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(occupancyQuery.data?.floorBreakdown ?? []).map((floor) => (
                    <motion.div
                      key={floor.floorId}
                      layout
                      className={`rounded-xl border border-white/10 bg-gradient-to-r ${floorHeatColor(
                        floor.occupancyRate,
                      )} p-3`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>Floor {floor.floorNumber}</span>
                        <span>{floor.occupiedSpots}/{floor.totalSpots}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-4 text-lg font-semibold">Revenue Trend (Top 5)</div>
              <div className="space-y-2">
                {topTrend.length === 0 ? (
                  <Skeleton className="h-10" />
                ) : (
                  topTrend.map((row) => (
                    <div
                      key={row.bucket}
                      className="flex items-center justify-between rounded-lg bg-slate-100/70 p-2 text-sm dark:bg-slate-800/50"
                    >
                      <span>{new Date(row.bucket).toLocaleDateString()}</span>
                      <span className="font-semibold">${row.revenue.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      </AppShell>
    </RequireAuth>
  );
}
