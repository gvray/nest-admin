import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('role:create')
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: '获取所有角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: '获取指定角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('role:delete')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: '为角色分配权限' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }

  @Delete(':id/permissions')
  @Roles('admin')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: '移除角色的权限' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.removePermissions(id, assignPermissionsDto.permissionIds);
  }
} 