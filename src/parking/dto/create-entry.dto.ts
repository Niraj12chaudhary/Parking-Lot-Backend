import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { VehicleType } from '../entities/vehicle.entity';

export class CreateEntryDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim()?.toUpperCase())
  vehicleNumber: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsInt()
  @Min(1)
  gateId: number;
}
