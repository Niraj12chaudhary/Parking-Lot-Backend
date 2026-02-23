import { PricingStrategy } from './pricing-strategy.interface';
import {
  PricingContext,
  PricingResult,
  PricingSettings,
} from './pricing.types';

export class NightPricingStrategy implements PricingStrategy {
  constructor(private readonly next: PricingStrategy) {}

  calculate(context: PricingContext, settings: PricingSettings): PricingResult {
    const result = this.next.calculate(context, settings);
    if (!settings.nightEnabled || result.totalAmount === 0) {
      return result;
    }

    const hour = context.exitTime.getHours();
    const inNightWindow =
      settings.nightStartHour <= settings.nightEndHour
        ? hour >= settings.nightStartHour && hour < settings.nightEndHour
        : hour >= settings.nightStartHour || hour < settings.nightEndHour;

    if (!inNightWindow) {
      return result;
    }

    const totalAmount = Number(
      (result.totalAmount * settings.nightMultiplier).toFixed(2),
    );

    return {
      ...result,
      multipliers: {
        ...result.multipliers,
        night: settings.nightMultiplier,
      },
      totalAmount,
    };
  }
}
