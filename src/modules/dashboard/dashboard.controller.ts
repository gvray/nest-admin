import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '总览统计：用户数、角色数、权限点数' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('role-distribution')
  @ApiOperation({ summary: '角色分布：[{ name, value }]' })
  getRoleDistribution() {
    return this.dashboardService.getRoleDistribution();
  }
}


