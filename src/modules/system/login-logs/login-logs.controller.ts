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
  ApiBody,
} from '@nestjs/swagger';
import { LoginLogsService } from './login-logs.service';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteLoginLogsDto } from './dto/batch-delete-login-logs.dto';
import { CleanLoginLogsDto } from './dto/clean-login-logs.dto';

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
  async findAll(@Query() query: QueryLoginLogDto) {
    const pageData = await this.loginLogsService.findAll(query);
    return ResponseUtil.paginated(pageData, '登录日志查询成功');
  }

  @Get('stats')
  @RequirePermissions('system:loginlog:view')
  @ApiOperation({ summary: '获取登录统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getStats(@Query('days') days?: number) {
    const data = await this.loginLogsService.getLoginStats(days || 7);
    return ResponseUtil.found(data, '获取成功');
  }

  @Delete('clear')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '清空所有登录日志' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async clear() {
    const count = await this.loginLogsService.clearAll();
    return ResponseUtil.deleted(count, '清理成功');
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
  async findOne(@Param('id') id: string) {
    const data = await this.loginLogsService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Delete(':id')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '删除登录日志' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '登录日志不存在' })
  async remove(@Param('id') id: string) {
    await this.loginLogsService.remove(id);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '批量删除登录日志' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiBody({ type: BatchDeleteLoginLogsDto })
  async removeMany(@Body() dto: BatchDeleteLoginLogsDto) {
    await this.loginLogsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('clean')
  @RequirePermissions('system:loginlog:delete')
  @ApiOperation({ summary: '清理指定天数之前的登录日志' })
  @ApiResponse({ status: 200, description: '清理成功' })
  @ApiBody({ type: CleanLoginLogsDto })
  async cleanOldLogs(@Body() dto: CleanLoginLogsDto) {
    const count = await this.loginLogsService.cleanBeforeDays(dto.days);
    return ResponseUtil.deleted(count, '清理成功');
  }
}
