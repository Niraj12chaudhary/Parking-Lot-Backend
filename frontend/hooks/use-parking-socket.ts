'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { SpotStatus } from '@/lib/types';

interface ParkingSocketHandlers {
  onSpotUpdated?: (event: {
    spotId: number;
    spotNumber: string;
    floorNumber: number;
    status: SpotStatus;
    ticketNumber?: string;
  }) => void;
  onMetrics?: (event: {
    activeTickets: number;
    occupancyRate: number;
    updatedAt: string;
  }) => void;
}

export function useParkingSocket(handlers: ParkingSocketHandlers) {
  useEffect(() => {
    socket.connect();

    if (handlers.onSpotUpdated) {
      socket.on('spot.updated', handlers.onSpotUpdated);
    }
    if (handlers.onMetrics) {
      socket.on('dashboard.metrics', handlers.onMetrics);
    }

    return () => {
      if (handlers.onSpotUpdated) {
        socket.off('spot.updated', handlers.onSpotUpdated);
      }
      if (handlers.onMetrics) {
        socket.off('dashboard.metrics', handlers.onMetrics);
      }
      socket.disconnect();
    };
  }, [handlers]);
}
