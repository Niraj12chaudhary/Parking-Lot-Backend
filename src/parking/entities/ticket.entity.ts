import { Entity, Column, ManyToOne, OneToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Vehicle } from './vehicle.entity';
import { Spot } from '../../common/entities/spot.entity';
import { Gate } from './gate.entity';
import { Payment } from './payment.entity';
export enum TicketStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity()
@Index(['status', 'entryTime'])
export class Ticket extends BaseEntity {
  @Index({ unique: true })
  @Column()
  ticketNumber: string;

  @Column({ type: 'timestamp' })
  entryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  exitTime: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status: TicketStatus;

  @Column({ nullable: true, type: 'int' })
  durationMinutes?: number;

  @Column({ nullable: true, type: 'numeric', precision: 10, scale: 2 })
  calculatedAmount?: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.tickets)
  vehicle: Vehicle;

  @ManyToOne(() => Spot, (spot) => spot.tickets)
  spot: Spot;

  @ManyToOne(() => Gate, (gate) => gate.entryTickets)
  entryGate: Gate;

  @ManyToOne(() => Gate, (gate) => gate.exitTickets, { nullable: true })
  exitGate: Gate;

  @OneToOne(() => Payment, (payment) => payment.ticket, { nullable: true })
  payment: Payment;
}
