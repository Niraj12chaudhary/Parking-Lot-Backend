'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FormEvent, useMemo, useState } from 'react';
import { AnimatedCounter } from '@/components/animated-counter';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { useToast } from '@/components/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';
import { Ticket } from '@/lib/types';

export default function ExitPage() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [ticketNumber, setTicketNumber] = useState('');
  const [gateId, setGateId] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('card');
  const [lastAmount, setLastAmount] = useState(0);
  const [lastDuration, setLastDuration] = useState(0);

  const activeQuery = useQuery({
    queryKey: ['activeTickets', token],
    queryFn: () => api.activeTickets(token as string),
    enabled: Boolean(token),
  });

  const selectedTicket = useMemo(
    () =>
      (activeQuery.data?.data ?? []).find(
        (ticket: Ticket) => ticket.ticketNumber === ticketNumber,
      ),
    [activeQuery.data?.data, ticketNumber],
  );

  const liveDuration = useMemo(() => {
    if (!selectedTicket) return 0;
    const entry = new Date(selectedTicket.entryTime).getTime();
    return Math.max(1, Math.ceil((Date.now() - entry) / 60000));
  }, [selectedTicket]);

  const exitMutation = useMutation({
    mutationFn: () =>
      api.createExit(token as string, {
        ticketNumber,
        gateId,
        paymentMethod,
      }),
    onSuccess: (receipt) => {
      setLastAmount(Number(receipt.payment.amount));
      setLastDuration(receipt.ticket.durationMinutes ?? 0);
      queryClient.invalidateQueries({ queryKey: ['activeTickets', token] });
      queryClient.invalidateQueries({ queryKey: ['spots', token] });
      pushToast('Exit completed and payment captured', 'success');
      setTicketNumber('');
    },
    onError: (error: Error) => {
      pushToast(error.message, 'error');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    exitMutation.mutate();
  };

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h1 className="mb-4 text-2xl font-semibold">Vehicle Exit</h1>
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm">Ticket Number</label>
                <Input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="TKT-C-XYZ123"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Exit Gate Id</label>
                <Input
                  type="number"
                  value={gateId}
                  onChange={(e) => setGateId(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Payment Method</label>
                <select
                  className="w-full rounded-xl border border-slate-700/40 bg-slate-200/60 px-3 py-2 text-sm dark:bg-slate-800/70"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'cash' | 'card' | 'upi')
                  }
                >
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Button className="w-full" type="submit" disabled={exitMutation.isPending}>
                  {exitMutation.isPending ? 'Processing exit...' : 'Complete Exit'}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl font-semibold">Live Calculation</h2>
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.ticketNumber}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Badge>{selectedTicket.vehicle.vehicleNumber}</Badge>
                <div>
                  Duration:
                  <span className="ml-2 font-semibold">
                    <AnimatedCounter value={liveDuration} suffix=" min" />
                  </span>
                </div>
                <div className="rounded-lg bg-rose-500/25 p-2 text-xs text-rose-100 transition-colors">
                  Spot transitions to available after successful payment.
                </div>
              </motion.div>
            ) : (
              <div className="text-sm text-slate-500">Pick an active ticket to preview.</div>
            )}
          </Card>
        </div>

        {(lastAmount > 0 || lastDuration > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Card className="border-emerald-400/40 bg-emerald-500/20">
              <div className="text-sm uppercase tracking-wide text-emerald-200">
                Last Exit Receipt
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-50">
                <AnimatedCounter value={lastAmount} prefix="$" decimals={2} />
              </div>
              <div className="text-sm text-emerald-100/90">
                Duration settled: {lastDuration} minutes
              </div>
            </Card>
          </motion.div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
