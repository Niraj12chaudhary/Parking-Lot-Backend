import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { FloorSeedService } from './floor-seed.service';
import { SpotSeedService } from './spot-seed.service';
import { GateSeedService } from './gate-seed.service';
import { UserSeedService } from './user-seed.service';
import { ScenarioSeedService } from './scenario-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const dataSource = app.get(DataSource);
  const floorSeeder = app.get(FloorSeedService);
  const spotSeeder = app.get(SpotSeedService);
  const gateSeeder = app.get(GateSeedService);
  const userSeeder = app.get(UserSeedService);
  const scenarioSeeder = app.get(ScenarioSeedService);

  await dataSource.transaction(async (manager) => {
    await floorSeeder.createFloors(manager);
    await spotSeeder.createSpots(manager);
    await gateSeeder.createGates(manager);
    await userSeeder.createUsers(manager);
    await scenarioSeeder.seedLargeScenarioData(manager);
  });

  await app.close();
}

bootstrap()
  .then(() => {
    console.log('Seeding completed.');
  })
  .catch((error: unknown) => {
    console.error('Seeding failed', error);
    process.exit(1);
  });
