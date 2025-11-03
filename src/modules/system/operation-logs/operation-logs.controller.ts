import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { OperationLogsService } from './operation-logs.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';

@ApiTags('OperationLogs')
@Controller('system/operation-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class OperationLogsController {
  constructor(private readonly service: OperationLogsService) {}

  @Get()
  @RequirePermissions('system:oplog:view')
  @ApiOperation({ summary: '分页查询操作日志' })
  async findMany(@Query() query: QueryOperationLogDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('system:oplog:view')
  @ApiOperation({ summary: '获取操作日志详情（按数值ID）' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Delete(':id')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '删除操作日志（按数值ID）' })
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Post('batch-delete')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '批量删除操作日志（按数值ID）' })
  async removeMany(@Body() body: { ids: string[] }) {
    return this.service.removeMany(body.ids.map(Number));
  }

  @Delete()
  @RequirePermissions('system:oplog:clean')
  @ApiOperation({ summary: '清理操作日志（可选按时间）' })
  async clean(@Query('before') before?: string) {
    return this.service.clean(before ? new Date(before) : undefined);
  }
}
