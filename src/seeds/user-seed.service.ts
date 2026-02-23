import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { EntityManager, Repository } from 'typeorm';
import { User, UserRole } from 'src/auth/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async createUsers(manager?: EntityManager) {
    const userRepository = manager
      ? manager.getRepository(User)
      : this.userRepository;

    const defaultPassword = this.configService.get<string>(
      'SEED_DEFAULT_PASSWORD',
      'ChangeMe123!',
    );
    const passwordHash = await hash(defaultPassword, 10);

    const users: Array<Pick<User, 'username' | 'role'>> = [
      { username: 'admin', role: UserRole.ADMIN },
      { username: 'manager', role: UserRole.MANAGER },
      { username: 'gateop', role: UserRole.GATE_OPERATOR },
    ];

    for (const user of users) {
      const exists = await userRepository.findOne({
        where: { username: user.username },
      });
      if (!exists) {
        await userRepository.save(
          userRepository.create({
            username: user.username,
            role: user.role,
            passwordHash,
            isActive: true,
          }),
        );
      }
    }
  }
}
