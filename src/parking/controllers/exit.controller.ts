import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/auth/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateExitDto } from '../dto/create-exit.dto';
import { ExitReceipt, ExitService } from '../services/exit.service';

@ApiTags('Parking - Exit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking')
export class ExitController {
  constructor(private readonly exitService: ExitService) {}

  @Post('exit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  createExit(
    @Body() dto: CreateExitDto,
    @Req() request: Request,
  ): Promise<ExitReceipt> {
    const user = request.user as { sub: number } | undefined;
    return this.exitService.handleExit(dto, user?.sub);
  }
}
