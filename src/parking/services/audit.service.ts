import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuditEntityType, AuditLog } from '../entities/audit-log.entity';

export interface AuditEventInput {
  entityType: AuditEntityType;
  entityId: number;
  eventType: string;
  actorId?: number;
  previousState?: Record<string, unknown>;
  nextState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  async log(manager: EntityManager, input: AuditEventInput): Promise<void> {
    const repository = manager.getRepository(AuditLog);
    const event = repository.create(input);
    await repository.save(event);
  }

  async logMany(
    manager: EntityManager,
    events: AuditEventInput[],
  ): Promise<void> {
    if (!events.length) {
      return;
    }
    const repository = manager.getRepository(AuditLog);
    const entities = repository.create(events);
    await repository.save(entities);
  }
}
