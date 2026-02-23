import { PricingStrategy } from './pricing-strategy.interface';
import {
  PricingContext,
  PricingResult,
  PricingSettings,
} from './pricing.types';

export class HourlyPricingStrategy implements PricingStrategy {
  calculate(context: PricingContext, settings: PricingSettings): PricingResult {
    const durationMs = context.exitTime.getTime() - context.entryTime.getTime();
    const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
    const graceApplied = durationMinutes <= settings.gracePeriodMinutes;
    const chargeableMinutes = graceApplied ? 0 : durationMinutes;
    const billableHours =
      chargeableMinutes === 0 ? 0 : Math.ceil(chargeableMinutes / 60);

    const baseRate = settings.hourlyRate[context.vehicleType];
    const totalAmount = Number((billableHours * baseRate).toFixed(2));

    return {
      durationMinutes,
      billableHours,
      baseRate,
      graceApplied,
      multipliers: {
        surge: 1,
        night: 1,
      },
      totalAmount,
    };
  }
}
