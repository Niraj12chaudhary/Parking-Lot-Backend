import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Floor } from './floor.entity';
import { Ticket } from '../../parking/entities/ticket.entity';

export enum SpotType {
  COMPACT = 'compact',
  LARGE = 'large',
  BIKE = 'bike',
  HANDICAPPED = 'handicapped',
}

export enum SpotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service',
}

@Entity()
@Index(['status', 'type'])
@Index(['floor', 'spotNumber'], { unique: true })
export class Spot extends BaseEntity {
  @Column()
  spotNumber: string;

  @Column({
    type: 'enum',
    enum: SpotType,
  })
  type: SpotType;

  @Column({
    type: 'enum',
    enum: SpotStatus,
    default: SpotStatus.AVAILABLE,
  })
  status: SpotStatus;

  @Column({ default: false })
  isOccupied: boolean;

  @ManyToOne(() => Floor, (floor) => floor.spots)
  floor: Floor;
  @OneToMany(() => Ticket, (ticket) => ticket.spot)
  tickets: Ticket[];
}
