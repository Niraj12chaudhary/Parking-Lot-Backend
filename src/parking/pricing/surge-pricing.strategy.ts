import { PricingStrategy } from './pricing-strategy.interface';
import {
  PricingContext,
  PricingResult,
  PricingSettings,
} from './pricing.types';

export class SurgePricingStrategy implements PricingStrategy {
  constructor(private readonly next: PricingStrategy) {}

  calculate(context: PricingContext, settings: PricingSettings): PricingResult {
    const result = this.next.calculate(context, settings);
    if (!settings.surgeEnabled || result.totalAmount === 0) {
      return result;
    }

    const hour = context.exitTime.getHours();
    const inSurgeWindow =
      settings.surgeStartHour <= settings.surgeEndHour
        ? hour >= settings.surgeStartHour && hour < settings.surgeEndHour
        : hour >= settings.surgeStartHour || hour < settings.surgeEndHour;

    if (!inSurgeWindow) {
      return result;
    }

    const totalAmount = Number(
      (result.totalAmount * settings.surgeMultiplier).toFixed(2),
    );

    return {
      ...result,
      multipliers: {
        ...result.multipliers,
        surge: settings.surgeMultiplier,
      },
      totalAmount,
    };
  }
}
