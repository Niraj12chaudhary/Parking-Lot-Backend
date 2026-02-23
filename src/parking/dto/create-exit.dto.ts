import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreateExitDto {
  @IsString()
  ticketNumber: string;

  @IsInt()
  @Min(1)
  gateId: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
