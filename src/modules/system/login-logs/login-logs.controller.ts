import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginLogsService } from './login-logs.service';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';

@ApiTags('登录日志管理')
@Controller('system/login-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class LoginLogsController {
  constructor(private readonly loginLogsService: LoginLogsService) {}

  @Get()
  @RequirePermissions('system:loginlog:view')
  @ApiOperation({ summary: '获取登录日志列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [LoginLogResponseDto],
  })
  findAll(@Query() query: QueryLoginLogDto) {
    return this.loginLogsService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('system:loginlog:view')
  @ApiOperation({ summary: '获取登录统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  getStats(@Query('days') days?: number) {
    return this.loginLogsService.getLoginStats(days || 7);
  }

  @Get(':id')
  @RequirePermissions('system:loginlog:view')
  @ApiOperation({ summary: '获取指定登录日志' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: LoginLogResponseDto,
  })
  @ApiResponse({ status: 404, description: '登录日志不存在' })
  findOne(@Param('id') id: string) {
    return this.loginLogsService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '删除登录日志' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '登录日志不存在' })
  remove(@Param('id') id: string) {
    return this.loginLogsService.remove(id);
  }

  @Post('batch-delete')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '批量删除登录日志' })
  @ApiResponse({ status: 200, description: '删除成功' })
  removeMany(@Body() body: { ids: string[] }) {
    return this.loginLogsService.removeMany(body.ids);
  }

  @Post('clean')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '清理指定天数之前的登录日志' })
  @ApiResponse({ status: 200, description: '清理成功' })
  cleanOldLogs(@Body() body: { days: number }) {
    return this.loginLogsService.cleanOldLogs(body.days);
  }
}