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
  ApiBody,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AssignDataScopeDto } from './dto/assign-data-scope.dto';

import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { BatchDeleteRolesDto } from './dto/batch-delete-roles.dto';

@ApiTags('角色管理')
@Controller('system/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('system:role:create')
  @Audit('create')
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.rolesService.create(createRoleDto, user.userId);
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions('system:role:view')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: QueryRoleDto) {
    const pageData = await this.rolesService.findAll(query);
    return ResponseUtil.paginated(pageData, '获取成功');
  }

  @Get(':id')
  @RequirePermissions('system:role:view')
  @ApiOperation({ summary: '获取指定角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':id')
  @RequirePermissions('system:role:update')
  @Audit('update')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.rolesService.update(id, updateRoleDto, user.userId);
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':id')
  @RequirePermissions('system:role:delete')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Put(':id/permissions')
  @RequirePermissions('system:role:update')
  @ApiOperation({ summary: '为角色分配权限（替换所有权限）' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    const data = await this.rolesService.assignPermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
    return ResponseUtil.updated(data, '分配成功');
  }

  @Delete(':id/permissions')
  @RequirePermissions('system:role:update')
  @ApiOperation({ summary: '移除角色的权限' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async removePermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    const data = await this.rolesService.removePermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
    return ResponseUtil.updated(data, '移除成功');
  }

  @Put(':id/users')
  @RequirePermissions('system:role:update')
  @ApiOperation({ summary: '为角色分配用户（替换所有用户）' })
  @ApiResponse({
    status: 200,
    description: '用户分配成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.rolesService.assignUsers(
      id,
      assignUsersDto.userIds,
      user.userId,
    );
    return ResponseUtil.updated(data, '用户分配成功');
  }

  @Delete(':id/users')
  @RequirePermissions('system:role:update')
  @ApiOperation({ summary: '移除角色用户' })
  @ApiResponse({
    status: 200,
    description: '用户移除成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async removeUsers(
    @Param('id') id: string,
    @Body() removeUsersDto: AssignUsersDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.rolesService.removeUsers(
      id,
      removeUsersDto.userIds,
      user.userId,
    );
    return ResponseUtil.updated(data, '用户移除成功');
  }

  @Put(':id/data-scope')
  @RequirePermissions('system:role:update')
  @Audit('update')
  @ApiOperation({ summary: '为角色分配数据权限' })
  @ApiResponse({ status: 200, description: '数据权限分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async assignDataScope(
    @Param('id') id: string,
    @Body() assignDataScopeDto: AssignDataScopeDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.rolesService.assignDataScope(
      id,
      assignDataScopeDto.dataScope,
      assignDataScopeDto.departmentIds,
      user.userId,
    );
    return ResponseUtil.updated(data, '数据权限分配成功');
  }

  @Get(':id/data-scope')
  @RequirePermissions('system:role:view')
  @ApiOperation({ summary: '获取角色的数据权限' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async getRoleDataScope(@Param('id') id: string) {
    const data = await this.rolesService.getRoleDataScope(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:role:delete')
  @Audit('delete')
  @ApiOperation({ summary: '批量删除角色' })
  @ApiBody({ type: BatchDeleteRolesDto })
  async batchDelete(@Body() dto: BatchDeleteRolesDto) {
    await this.rolesService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
