import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { ResponseUtil } from '@/shared/utils/response.util';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '总览统计：用户数、角色数、权限点数' })
  async getOverview() {
    const data = await this.dashboardService.getOverview();
    return ResponseUtil.found(data, '总览统计');
  }

  @Get('role-distribution')
  @ApiOperation({ summary: '角色分布：[{ name, value }]' })
  async getRoleDistribution() {
    const data = await this.dashboardService.getRoleDistribution();
    return ResponseUtil.found(data, '角色分布');
  }

  @Get('login-trend')
  @ApiOperation({ summary: '最近7天登录趋势：[{ date, value }]' })
  async getLoginTrend() {
    const data = await this.dashboardService.getLoginTrendLast7Days();
    return ResponseUtil.found(data, '最近7天登录趋势');
  }
}
