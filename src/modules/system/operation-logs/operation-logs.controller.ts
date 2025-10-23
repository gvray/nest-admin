import { Controller, Get, Query, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { OperationLogsService } from './operation-logs.service';

@ApiTags('OperationLogs')
@Controller('system/operation-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OperationLogsController {
  constructor(private readonly service: OperationLogsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询操作日志' })
  findMany(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('username') username?: string,
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('status') status?: number,
    @Query('path') path?: string,
    @Query('keyword') keyword?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.service.findMany({
      page: Number(page),
      pageSize: Number(pageSize),
      username,
      userId,
      module,
      action,
      status: status !== undefined ? Number(status) : undefined,
      path,
      keyword,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });
  }

  @Get(':logId')
  @ApiOperation({ summary: '获取操作日志详情' })
  findOne(@Param('logId') logId: string) {
    return this.service.findOne(logId);
  }

  @Delete(':logId')
  @ApiOperation({ summary: '删除操作日志' })
  remove(@Param('logId') logId: string) {
    return this.service.remove(logId);
  }

  @Delete()
  @ApiOperation({ summary: '清理操作日志（可选按时间）' })
  clean(@Query('before') before?: string) {
    return this.service.clean(before ? new Date(before) : undefined);
  }
}


