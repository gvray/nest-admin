import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '总览统计：用户数、角色数、权限点数' })
  async getOverview(): Promise<{
    users: number;
    roles: number;
    permissions: number;
  }> {
    return await this.dashboardService.getOverview();
  }

  @Get('role-distribution')
  @ApiOperation({ summary: '角色分布：[{ name, value }]' })
  async getRoleDistribution(): Promise<Array<{ name: string; value: number }>> {
    return await this.dashboardService.getRoleDistribution();
  }

  @Get('login-trend')
  @ApiOperation({ summary: '最近7天登录趋势：[{ date, value }]' })
  async getLoginTrend(): Promise<Array<{ date: string; value: number }>> {
    return await this.dashboardService.getLoginTrendLast7Days();
  }
}

