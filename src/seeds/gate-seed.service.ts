import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Gate, GateType } from 'src/parking/entities/gate.entity';

@Injectable()
export class GateSeedService {
  constructor(
    @InjectRepository(Gate)
    private readonly gateRepo: Repository<Gate>,
  ) {}

  async createGates(manager?: EntityManager) {
    const gateRepo = manager ? manager.getRepository(Gate) : this.gateRepo;

    const gates: Array<Pick<Gate, 'name' | 'gateType'>> = [
      { name: 'Entry Gate 1', gateType: GateType.ENTRY },
      { name: 'Entry Gate 2', gateType: GateType.ENTRY },
      { name: 'Exit Gate 1', gateType: GateType.EXIT },
      { name: 'Exit Gate 2', gateType: GateType.EXIT },
    ];

    for (const gate of gates) {
      const exists = await gateRepo.findOne({ where: { name: gate.name } });
      if (!exists) {
        await gateRepo.save(gateRepo.create(gate));
      }
    }
  }
}
