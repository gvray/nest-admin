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
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('user:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('user:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '用户列表' })
  findAll(@Query() query?: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':userId')
  @Roles('admin')
  @RequirePermissions('user:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('userId') userId: string) {
    return this.usersService.findOneByUserId(userId);
  }



  @Patch(':userId')
  @Roles('admin')
  @RequirePermissions('user:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateByUserId(userId, updateUserDto);
  }



  @Delete(':userId')
  @Roles('admin')
  @RequirePermissions('user:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('userId') userId: string) {
    return this.usersService.removeByUserId(userId);
  }



  @Post(':userId/roles')
  @Roles('admin')
  @RequirePermissions('user:manage')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '为用户分配角色' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(userId, assignRolesDto.roleIds);
  }

  @Delete(':userId/roles')
  @Roles('admin')
  @RequirePermissions('user:manage')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '移除用户的角色' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  removeRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.removeRoles(userId, assignRolesDto.roleIds);
  }
}
