'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { SpotGrid } from '@/components/spot-grid';
import { Card } from '@/components/ui/card';
import { useParkingSocket } from '@/hooks/use-parking-socket';
import { useRequiredToken } from '@/hooks/use-required-token';
import { api } from '@/lib/api';
import { Spot } from '@/lib/types';

export default function SpotsPage() {
  const token = useRequiredToken();
  const spotsQuery = useQuery({
    queryKey: ['spots', token],
    queryFn: () => api.spots(token as string) as Promise<Spot[]>,
    enabled: Boolean(token),
  });

  const [liveSpots, setLiveSpots] = useState<Spot[]>([]);
  const [highlightedSpotId, setHighlightedSpotId] = useState<number | null>(null);

  useEffect(() => {
    if (spotsQuery.data) {
      setLiveSpots(spotsQuery.data);
    }
  }, [spotsQuery.data]);

  useParkingSocket({
    onSpotUpdated: (event) => {
      setLiveSpots((current) =>
        current.map((spot) =>
          spot.id === event.spotId
            ? {
                ...spot,
                status: event.status,
                isOccupied: event.status === 'occupied',
              }
            : spot,
        ),
      );
      setHighlightedSpotId(event.spotId);
      setTimeout(() => setHighlightedSpotId(null), 1200);
    },
  });

  return (
    <RequireAuth>
      <AppShell>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <h1 className="mb-4 text-2xl font-semibold">Spot Visualization Grid</h1>
            <SpotGrid spots={liveSpots} highlightedSpotId={highlightedSpotId} />
          </Card>
        </motion.div>
      </AppShell>
    </RequireAuth>
  );
}
