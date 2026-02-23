import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AuditEntityType {
  TICKET = 'ticket',
  PAYMENT = 'payment',
  SPOT = 'spot',
}

@Entity()
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @Column({ type: 'int' })
  entityId: number;

  @Column()
  eventType: string;

  @Column({ type: 'int', nullable: true })
  actorId?: number;

  @Column({ type: 'jsonb', nullable: true })
  previousState?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  nextState?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
