'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { SpotGrid } from '@/components/spot-grid';
import { useToast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';
import { Spot, Ticket } from '@/lib/types';

export default function EntryPage() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'truck'>('car');
  const [gateId, setGateId] = useState(1);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [highlightedSpotId, setHighlightedSpotId] = useState<number | null>(null);

  const spotsQuery = useQuery({
    queryKey: ['spots', token],
    queryFn: () => api.spots(token as string) as Promise<Spot[]>,
    enabled: Boolean(token),
  });

  const entryMutation = useMutation({
    mutationFn: () =>
      api.createEntry(token as string, {
        vehicleNumber,
        vehicleType,
        gateId,
      }),
    onSuccess: (ticket) => {
      setLastTicket(ticket);
      setHighlightedSpotId(ticket.spot.id);
      queryClient.invalidateQueries({ queryKey: ['spots', token] });
      pushToast('Vehicle entry completed and spot allocated', 'success');
      setVehicleNumber('');
    },
    onError: (error: Error) => {
      pushToast(error.message, 'error');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    entryMutation.mutate();
  };

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4 lg:grid-cols-5">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-2"
          >
            <Card>
              <h1 className="mb-4 text-2xl font-semibold">Vehicle Entry</h1>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm">Vehicle Number</label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="MH12AB1234"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Vehicle Type</label>
                  <select
                    className="w-full rounded-xl border border-slate-700/40 bg-slate-200/60 px-3 py-2 text-sm dark:bg-slate-800/70"
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(e.target.value as 'car' | 'bike' | 'truck')
                    }
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Entry Gate Id</label>
                  <Input
                    type="number"
                    value={gateId}
                    onChange={(e) => setGateId(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={entryMutation.isPending}>
                  {entryMutation.isPending ? 'Allocating...' : 'Allocate Spot'}
                </Button>
              </form>
            </Card>
          </motion.div>

          <Card className="lg:col-span-3">
            <h2 className="mb-4 text-xl font-semibold">Live Spot View</h2>
            <SpotGrid
              spots={spotsQuery.data ?? []}
              highlightedSpotId={highlightedSpotId}
            />
          </Card>
        </div>

        <Modal
          open={Boolean(lastTicket)}
          onClose={() => setLastTicket(null)}
          title="Entry Successful"
        >
          {lastTicket ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-100 animate-pulseSoft">
                Ticket generated for {lastTicket.vehicle.vehicleNumber}
              </div>
              <div>Ticket: {lastTicket.ticketNumber}</div>
              <div>
                Spot: Floor {lastTicket.spot.floor.number} / {lastTicket.spot.spotNumber}
              </div>
              <Button className="w-full" onClick={() => setLastTicket(null)}>
                Done
              </Button>
            </div>
          ) : null}
        </Modal>
      </AppShell>
    </RequireAuth>
  );
}
