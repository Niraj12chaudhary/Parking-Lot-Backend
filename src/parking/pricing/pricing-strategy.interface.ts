import {
  PricingContext,
  PricingResult,
  PricingSettings,
} from './pricing.types';

export interface PricingStrategy {
  calculate(context: PricingContext, settings: PricingSettings): PricingResult;
}
