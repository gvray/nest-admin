import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';

import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { IUser } from '@/core/interfaces/user.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteUsersDto } from './dto/batch-delete-users.dto';

@ApiTags('用户管理')
@Controller('system/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('system:user:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功', type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions('system:user:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({
    status: 200,
    description: '用户列表',
    type: [UserResponseDto],
  })
  async findAll(@Query() query?: QueryUserDto) {
    const pageData = await this.usersService.findAll(query);
    return ResponseUtil.paginated(pageData, '用户列表');
  }

  @Get(':userId')
  @RequirePermissions('system:user:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定用户（通过UserId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('userId') userId: string) {
    const data = await this.usersService.findOne(userId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':userId')
  @RequirePermissions('system:user:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const data = await this.usersService.update(userId, updateUserDto);
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':userId')
  @RequirePermissions('system:user:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('userId') userId: string) {
    await this.usersService.remove(userId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Put(':userId/roles')
  @RequirePermissions('system:user:manage')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '为用户分配角色（替换所有角色）' })
  @ApiResponse({
    status: 200,
    description: '角色分配成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.assignRoles(
      userId,
      assignRolesDto.roleIds,
      currentUser.userId,
    );
    return ResponseUtil.updated(data, '角色分配成功');
  }

  @Delete(':userId/roles')
  @RequirePermissions('system:user:manage')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '移除用户的角色' })
  @ApiResponse({
    status: 200,
    description: '角色移除成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async removeRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    const data = await this.usersService.removeRoles(
      userId,
      assignRolesDto.roleIds,
    );
    return ResponseUtil.updated(data, '角色移除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:user:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '批量删除用户' })
  async batchDelete(@Body() { ids }: BatchDeleteUsersDto) {
    await this.usersService.removeMany(ids);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
