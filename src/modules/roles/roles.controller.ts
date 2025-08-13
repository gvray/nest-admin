import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { Audit } from '../../core/decorators/audit.decorator';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('role:create')
  @Audit('create')
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createRoleDto: CreateRoleDto, @Request() req: any) {
    const currentUserId = req.user?.userId;
    return this.rolesService.create(createRoleDto, currentUserId);
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('role:view')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('role:view')
  @ApiOperation({ summary: '获取指定角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('role:update')
  @Audit('update')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: any,
  ) {
    const currentUserId = req.user?.userId;
    return this.rolesService.update(id, updateRoleDto, currentUserId);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('role:delete')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: '为角色分配权限' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
  }

  @Delete(':id/permissions')
  @Roles('admin')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: '移除角色的权限' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  removePermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.removePermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
  }

  @Put(':id/users')
  @Roles('admin')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: '为角色分配用户（替换所有用户）' })
  @ApiResponse({
    status: 200,
    description: '用户分配成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  assignUsers(@Param('id') id: string, @Body() assignUsersDto: AssignUsersDto) {
    return this.rolesService.assignUsers(id, assignUsersDto.userIds);
  }

  @Delete(':id/users')
  @Roles('admin')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: '移除角色用户' })
  @ApiResponse({
    status: 200,
    description: '用户移除成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  removeUsers(@Param('id') id: string, @Body() removeUsersDto: AssignUsersDto) {
    return this.rolesService.removeUsers(id, removeUsersDto.userIds);
  }
}
