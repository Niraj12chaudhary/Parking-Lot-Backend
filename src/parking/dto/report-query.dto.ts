import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { DateRangeDto } from 'src/common/dto/date-range.dto';

export class ReportQueryDto extends DateRangeDto {
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.toLowerCase())
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}
