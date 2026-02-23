import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ticket } from './ticket.entity';
export enum VehicleType {
  CAR = 'car',
  BIKE = 'bike',
  TRUCK = 'truck',
}

@Entity()
export class Vehicle extends BaseEntity {
  @Index({ unique: true })
  @Column()
  vehicleNumber: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @OneToMany(() => Ticket, (ticket) => ticket.vehicle)
  tickets: Ticket[];
}
