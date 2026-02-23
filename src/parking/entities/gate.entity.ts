import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ticket } from './ticket.entity';
export enum GateType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

@Entity()
export class Gate extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: GateType,
  })
  gateType: GateType;

  @OneToMany(() => Ticket, (ticket) => ticket.entryGate)
  entryTickets: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.exitGate)
  exitTickets: Ticket[];
}
