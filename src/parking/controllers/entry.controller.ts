import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EntryService } from '../services/entry.service';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { Ticket } from '../entities/ticket.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/auth/entities/user.entity';
import type { Request } from 'express';

@ApiTags('Parking - Entry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking')
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post('entry')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  async createEntry(
    @Body() dto: CreateEntryDto,
    @Req() request: Request,
  ): Promise<Ticket> {
    const user = request.user as { sub: number } | undefined;
    return this.entryService.handleEntry(dto, user?.sub);
  }
}
