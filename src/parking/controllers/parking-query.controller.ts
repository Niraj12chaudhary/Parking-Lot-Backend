import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/auth/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SpotQueryDto } from '../dto/spot-query.dto';
import { ParkingQueryService } from '../services/parking-query.service';

@ApiTags('Parking - Query')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking')
export class ParkingQueryController {
  constructor(private readonly parkingQueryService: ParkingQueryService) {}

  @Get('spots')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  listSpots(@Query() query: SpotQueryDto) {
    return this.parkingQueryService.listSpots(query);
  }

  @Get('floors')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listFloors() {
    return this.parkingQueryService.listFloors();
  }
}
