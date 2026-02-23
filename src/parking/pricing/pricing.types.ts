import { VehicleType } from '../entities/vehicle.entity';

export interface PricingContext {
  entryTime: Date;
  exitTime: Date;
  vehicleType: VehicleType;
}

export interface PricingResult {
  durationMinutes: number;
  billableHours: number;
  baseRate: number;
  graceApplied: boolean;
  multipliers: {
    surge: number;
    night: number;
  };
  totalAmount: number;
}

export interface PricingSettings {
  gracePeriodMinutes: number;
  hourlyRate: Record<VehicleType, number>;
  surgeEnabled: boolean;
  surgeMultiplier: number;
  surgeStartHour: number;
  surgeEndHour: number;
  nightEnabled: boolean;
  nightMultiplier: number;
  nightStartHour: number;
  nightEndHour: number;
}
