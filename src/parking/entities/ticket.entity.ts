import { Entity, Column, ManyToOne, OneToOne } from 'typeorm';
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
export class Ticket extends BaseEntity {
  @Column()
  entryTime: Date;

  @Column({ nullable: true })
  exitTime: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status: TicketStatus;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.tickets)
  vehicle: Vehicle;

  @ManyToOne(() => Spot, (spot) => spot.tickets)
  spot: Spot;

  @ManyToOne(() => Gate, (gate) => gate.entryTickets)
  entryGate: Gate;

  @ManyToOne(() => Gate, (gate) => gate.exitTickets, { nullable: true })
  exitGate: Gate;

  @OneToOne(() => Payment, (payment) => payment.ticket)
  payment: Payment;
}
