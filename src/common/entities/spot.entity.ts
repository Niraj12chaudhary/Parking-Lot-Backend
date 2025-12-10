import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Floor } from './floor.entity';
import { Ticket } from '../../parking/entities/ticket.entity';

export enum SpotType {
  COMPACT = 'compact',
  LARGE = 'large',
  BIKE = 'bike',
  HANDICAPPED = 'handicapped',
}

@Entity()
export class Spot extends BaseEntity {
  @Column()
  spotNumber: string;

  @Column({
    type: 'enum',
    enum: SpotType,
  })
  type: SpotType;

  @Column({ default: false })
  isOccupied: boolean;

  @ManyToOne(() => Floor, (floor) => floor.spots)
  floor: Floor;
  @OneToMany(() => Ticket, (ticket) => ticket.spot)
  tickets: Ticket[];
}
