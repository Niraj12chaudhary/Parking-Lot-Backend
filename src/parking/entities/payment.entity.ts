import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ticket } from './ticket.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
}

@Entity()
export class Payment extends BaseEntity {
  @Column()
  amount: number;

  @Column({ type: 'timestamp' })
  paidAt: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @OneToOne(() => Ticket, (ticket) => ticket.payment)
  @JoinColumn()
  ticket: Ticket;
}
