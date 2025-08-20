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
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { Audit } from '../../core/decorators/audit.decorator';

@ApiTags('权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('permission:create')
  @Audit('create')
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @Request() req: any,
  ) {
    const currentUserId = req.user?.userId;
    return this.permissionsService.create(createPermissionDto, currentUserId);
  }

  @Get()
  @Roles('admin', 'user')
  @RequirePermissions('permission:view')
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '权限列表' })
  findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get('tree')
  @Roles('admin', 'user')
  @RequirePermissions('permission:view')
  @ApiOperation({ summary: '获取权限树结构' })
  @ApiResponse({ status: 200, description: '权限树结构' })
  getTree(@Query() queryDto: QueryPermissionDto) {
    return this.permissionsService.getPermissionTree(queryDto);
  }

  @Get('tree/simple')
  @Roles('admin', 'user')
  @RequirePermissions('permission:view')
  @ApiOperation({ summary: '获取简化权限树（仅包含权限代码）' })
  @ApiResponse({ status: 200, description: '简化权限树结构' })
  getSimpleTree() {
    return this.permissionsService.getSimplePermissionTree();
  }

  @Get(':id')
  @Roles('admin', 'user')
  @RequirePermissions('permission:view')
  @ApiOperation({ summary: '获取指定权限' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('permission:update')
  @Audit('update')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @Request() req: any,
  ) {
    const currentUserId = req.user?.userId;
    return this.permissionsService.update(
      id,
      updatePermissionDto,
      currentUserId,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('permission:delete')
  @Audit('delete')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
