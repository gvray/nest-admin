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
import { PermissionsScannerService } from './permissions-scanner.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { PERMISSION_PERMISSIONS } from '@/shared/constants/permissions.constant';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { BatchDeletePermissionsDto } from './dto/batch-delete-permissions.dto';
import {
  PermissionResponseDto,
  PermissionTreeNodeDto,
} from './dto/permission-response.dto';

@ApiTags('权限管理')
@Controller('system/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly scannerService: PermissionsScannerService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_PERMISSIONS.CREATE)
  @Audit('create')
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功', type: PermissionResponseDto })
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
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '权限列表', type: [PermissionResponseDto] })
  async findAll(@Query() query: QueryPermissionDto) {
    const pageData = await this.permissionsService.findAll(query);
    return ResponseUtil.paginated(pageData, '权限列表');
  }

  @Get('tree')
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限树结构' })
  @ApiResponse({
    status: 200,
    description: '权限树结构',
    type: [PermissionTreeNodeDto],
  })
  async getTree(@Query() queryDto: QueryPermissionDto) {
    const data = await this.permissionsService.getPermissionTree(queryDto);
    return ResponseUtil.found(data, '权限树结构');
  }

  @Get('parent-list')
  @RequirePermissions(PERMISSION_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取父权限列表（仅目录和菜单）' })
  @ApiResponse({
    status: 200,
    description: '父权限列表',
    type: [PermissionResponseDto],
  })
  async getParentList() {
    const data = await this.permissionsService.getParentList();
    return ResponseUtil.found(data, '父权限列表');
  }

  @Get('tree/simple')
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取简化权限树（仅包含权限代码）' })
  @ApiResponse({ status: 200, description: '简化权限树结构' })
  async getSimpleTree() {
    const data = await this.permissionsService.getSimplePermissionTree();
    return ResponseUtil.found(data, '简化权限树结构');
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取指定权限' })
  @ApiResponse({ status: 200, description: '获取成功', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async findOne(@Param('id') id: string) {
    const data = await this.permissionsService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.UPDATE)
  @Audit('update')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功', type: PermissionResponseDto })
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
  @RequirePermissions(PERMISSION_PERMISSIONS.DELETE)
  @Audit('delete')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions(PERMISSION_PERMISSIONS.DELETE)
  @Audit('delete')
  @ApiOperation({ summary: '批量删除权限' })
  @ApiBody({ type: BatchDeletePermissionsDto })
  async batchDelete(@Body() dto: BatchDeletePermissionsDto) {
    await this.permissionsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('scan')
  @RequirePermissions(PERMISSION_PERMISSIONS.SCAN)
  @ApiOperation({ summary: '扫描控制器并同步API权限' })
  @ApiResponse({
    status: 200,
    description: '扫描成功',
    schema: {
      type: 'object',
      properties: {
        scanned: { type: 'number', description: '扫描到的权限数量' },
        created: { type: 'number', description: '新增的权限数量' },
        updated: { type: 'number', description: '更新的权限数量' },
        deleted: { type: 'number', description: '删除的权限数量' },
      },
    },
  })
  async scanPermissions() {
    const stats = await this.scannerService.scanControllers();
    return ResponseUtil.success(stats, '权限扫描完成');
  }
}
