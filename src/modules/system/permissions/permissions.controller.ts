import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { BatchDeletePermissionsDto } from './dto/batch-delete-permissions.dto';

@ApiTags('系统-权限管理')
@Controller('system/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions('system:permission:create')
  @Audit('create')
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.permissionsService.create(
      createPermissionDto,
      user.userId,
    );
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions('system:permission:view')
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '权限列表' })
  async findAll(@Query() query: QueryPermissionDto) {
    const pageData = await this.permissionsService.findAll(query);
    return ResponseUtil.paginated(pageData, '权限列表');
  }

  @Get('tree')
  @RequirePermissions('system:permission:view')
  @ApiOperation({ summary: '获取权限树结构' })
  @ApiResponse({ status: 200, description: '权限树结构' })
  async getTree(@Query() queryDto: QueryPermissionDto) {
    const data = await this.permissionsService.getPermissionTree(queryDto);
    return ResponseUtil.found(data, '权限树结构');
  }

  @Get('tree/simple')
  @RequirePermissions('system:permission:view')
  @ApiOperation({ summary: '获取简化权限树（仅包含权限代码）' })
  @ApiResponse({ status: 200, description: '简化权限树结构' })
  async getSimpleTree() {
    const data = await this.permissionsService.getSimplePermissionTree();
    return ResponseUtil.found(data, '简化权限树结构');
  }

  @Get(':id')
  @RequirePermissions('system:permission:view')
  @ApiOperation({ summary: '获取指定权限' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async findOne(@Param('id') id: string) {
    const data = await this.permissionsService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':id')
  @RequirePermissions('system:permission:update')
  @Audit('update')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.permissionsService.update(
      id,
      updatePermissionDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':id')
  @RequirePermissions('system:permission:delete')
  @Audit('delete')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:permission:delete')
  @Audit('delete')
  @ApiOperation({ summary: '批量删除权限' })
  @ApiBody({ type: BatchDeletePermissionsDto })
  async batchDelete(@Body() dto: BatchDeletePermissionsDto) {
    await this.permissionsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
