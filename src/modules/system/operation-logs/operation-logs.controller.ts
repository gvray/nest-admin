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
import { ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { OperationLogsService } from './operation-logs.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteOperationLogsDto } from './dto/batch-delete-operation-logs.dto';
import { CleanOperationLogsDto } from './dto/clean-operation-logs.dto';

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
    const pageData = await this.service.findAll(query);
    return ResponseUtil.paginated(pageData, '操作日志查询成功');
  }

  @Delete('clear')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '清空所有操作日志' })
  async clear() {
    const count = await this.service.clearAll();
    return ResponseUtil.deleted(count, '清理成功');
  }

  @Get(':id')
  @RequirePermissions('system:oplog:view')
  @ApiOperation({ summary: '获取操作日志详情（按数值ID）' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(Number(id));
    return ResponseUtil.found(data, '获取成功');
  }

  @Delete(':id')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '删除操作日志（按数值ID）' })
  async remove(@Param('id') id: string) {
    await this.service.remove(Number(id));
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '批量删除操作日志（按数值ID）' })
  @ApiBody({ type: BatchDeleteOperationLogsDto })
  async removeMany(@Body() dto: BatchDeleteOperationLogsDto) {
    await this.service.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('clean')
  @RequirePermissions('system:oplog:delete')
  @ApiOperation({ summary: '清理指定天数之前的操作日志' })
  @ApiBody({ type: CleanOperationLogsDto })
  async clean(@Body() dto: CleanOperationLogsDto) {
    const count = await this.service.cleanBeforeDays(dto.days);
    return ResponseUtil.deleted(count, '清理成功');
  }
}
