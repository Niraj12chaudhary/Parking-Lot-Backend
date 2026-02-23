export type TicketStatus = 'active' | 'completed';

export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'out_of_service';

export interface Floor {
  id: number;
  number: number;
  name: string;
}

export interface Spot {
  id: number;
  spotNumber: string;
  type: 'compact' | 'large' | 'bike' | 'handicapped';
  status: SpotStatus;
  isOccupied: boolean;
  floor: Floor;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  entryTime: string;
  exitTime?: string;
  status: TicketStatus;
  durationMinutes?: number;
  calculatedAmount?: number;
  vehicle: {
    id: number;
    vehicleNumber: string;
    type: 'car' | 'bike' | 'truck';
  };
  spot: Spot;
}
