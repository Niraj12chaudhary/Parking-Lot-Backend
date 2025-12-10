import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Spot } from './spot.entity';
@Entity()
export class Floor extends BaseEntity {
  @Column()
  number: number;

  @Column()
  name: string;

  @OneToMany(() => Spot, (spot) => spot.floor)
  spots: Spot[];
}
