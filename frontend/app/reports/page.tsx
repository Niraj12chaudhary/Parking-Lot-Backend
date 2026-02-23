'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { AnimatedCounter } from '@/components/animated-counter';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const token = useRequiredToken();

  const revenueQuery = useQuery({
    queryKey: ['reportsRevenue', token],
    queryFn: () => api.revenueSummary(token as string),
    enabled: Boolean(token),
  });

  const historicalQuery = useQuery({
    queryKey: ['historical', token],
    queryFn: () => api.historicalAnalytics(token as string),
    enabled: Boolean(token),
  });

  const peakHoursQuery = useQuery({
    queryKey: ['peakHours', token],
    queryFn: () => api.peakHours(token as string),
    enabled: Boolean(token),
  });

  const peakMax = Math.max(
    1,
    ...(peakHoursQuery.data ?? []).map((point) => point.entries),
  );

  return (
    <RequireAuth>
      <AppShell>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Revenue Summary
            </div>
            <div className="mt-2 text-3xl font-semibold">
              <AnimatedCounter
                value={revenueQuery.data?.totalRevenue ?? 0}
                prefix="$"
                decimals={2}
              />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-3 text-lg font-semibold">Historical Ticket Analytics</div>
              <div className="space-y-2">
                {historicalQuery.isLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  (historicalQuery.data ?? []).slice(-8).map((point) => (
                    <div
                      key={point.bucket}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"
                    >
                      <span>{new Date(point.bucket).toLocaleDateString()}</span>
                      <span>Entries: {point.entries}</span>
                      <span>Completed: {point.completed}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="mb-3 text-lg font-semibold">Peak Hour Analysis</div>
              <div className="space-y-2">
                {peakHoursQuery.isLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  (peakHoursQuery.data ?? []).slice(0, 8).map((point, index) => (
                    <div key={point.hour} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{point.hour}:00</span>
                        <span>{point.entries}</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(point.entries / peakMax) * 100}%` }}
                        transition={{ delay: index * 0.04, duration: 0.45 }}
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
