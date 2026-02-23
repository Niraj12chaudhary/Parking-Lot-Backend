import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SpotStatus } from 'src/common/entities/spot.entity';

export class SpotQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  floorId?: number;

  @IsOptional()
  @IsEnum(SpotStatus)
  status?: SpotStatus;
}
