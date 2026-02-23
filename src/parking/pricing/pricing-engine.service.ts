import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VehicleType } from '../entities/vehicle.entity';
import { HourlyPricingStrategy } from './hourly-pricing.strategy';
import { NightPricingStrategy } from './night-pricing.strategy';
import { PricingStrategy } from './pricing-strategy.interface';
import {
  PricingContext,
  PricingResult,
  PricingSettings,
} from './pricing.types';
import { SurgePricingStrategy } from './surge-pricing.strategy';

@Injectable()
export class PricingEngineService {
  constructor(private readonly configService: ConfigService) {}

  calculate(context: PricingContext): PricingResult {
    const settings = this.getSettings();
    let strategy: PricingStrategy = new HourlyPricingStrategy();

    if (settings.surgeEnabled) {
      strategy = new SurgePricingStrategy(strategy);
    }

    if (settings.nightEnabled) {
      strategy = new NightPricingStrategy(strategy);
    }

    return strategy.calculate(context, settings);
  }

  private getSettings(): PricingSettings {
    return {
      gracePeriodMinutes: this.configService.get<number>(
        'PARKING_GRACE_PERIOD_MINUTES',
        15,
      ),
      hourlyRate: {
        [VehicleType.CAR]: this.configService.get<number>(
          'PARKING_RATE_CAR',
          40,
        ),
        [VehicleType.BIKE]: this.configService.get<number>(
          'PARKING_RATE_BIKE',
          20,
        ),
        [VehicleType.TRUCK]: this.configService.get<number>(
          'PARKING_RATE_TRUCK',
          80,
        ),
      },
      surgeEnabled:
        this.configService.get<string>('PARKING_SURGE_ENABLED', 'true') ===
        'true',
      surgeMultiplier: this.configService.get<number>(
        'PARKING_SURGE_MULTIPLIER',
        1.2,
      ),
      surgeStartHour: this.configService.get<number>(
        'PARKING_SURGE_START_HOUR',
        17,
      ),
      surgeEndHour: this.configService.get<number>(
        'PARKING_SURGE_END_HOUR',
        21,
      ),
      nightEnabled:
        this.configService.get<string>('PARKING_NIGHT_ENABLED', 'true') ===
        'true',
      nightMultiplier: this.configService.get<number>(
        'PARKING_NIGHT_MULTIPLIER',
        1.1,
      ),
      nightStartHour: this.configService.get<number>(
        'PARKING_NIGHT_START_HOUR',
        22,
      ),
      nightEndHour: this.configService.get<number>('PARKING_NIGHT_END_HOUR', 6),
    };
  }
}
