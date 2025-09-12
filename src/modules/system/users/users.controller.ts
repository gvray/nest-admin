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
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
  findAll(@Query() query?: QueryUserDto) {
    return this.usersService.findAll(query);
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
  findOne(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch(':userId')
  @RequirePermissions('system:user:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':userId')
  @RequirePermissions('system:user:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
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
  assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(userId, assignRolesDto.roleIds);
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
  removeRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.removeRoles(userId, assignRolesDto.roleIds);
  }
}
