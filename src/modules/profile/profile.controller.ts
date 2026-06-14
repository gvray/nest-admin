import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { AuthService } from '@/modules/auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUserResponseDto } from '@/modules/auth/dto/current-user-response.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { DenyRoles } from '@/core/decorators/roles.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { GUEST_ROLE_KEY } from '@/shared/constants/role.constant';

@ApiTags('个人中心')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '当前用户完整信息',
    type: CurrentUserResponseDto,
  })
  async getProfile(@CurrentUser() user: { userId: string }) {
    const data = await this.authService.getCurrentUser(user.userId);
    return ResponseUtil.found(data, '获取当前用户信息');
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取当前用户角色与权限' })
  @ApiResponse({
    status: 200,
    description: '当前用户角色与权限列表',
    type: UserPermissionsResponseDto,
  })
  async getPermissions(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.getPermissions(user.userId);
    return ResponseUtil.found(data, '获取权限成功');
  }

  @Patch()
  @ApiOperation({ summary: '更新个人信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateProfile(user.userId, dto);
    return ResponseUtil.success(data, '更新个人信息成功');
  }

  @Post('change-password')
  @UseGuards(RolesGuard)
  @DenyRoles(GUEST_ROLE_KEY)
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '当前密码不正确' })
  @ApiResponse({ status: 403, description: '游客账号不允许修改密码' })
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.profileService.changePassword(user.userId, dto);
    return ResponseUtil.success(null, '密码修改成功');
  }

  @Get('settings')
  @ApiOperation({ summary: '获取个人偏好设置' })
  @ApiResponse({
    status: 200,
    description: '偏好设置',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        theme: 'light',
        language: 'zh-CN',
        sidebarCollapsed: false,
        pageSize: 20,
      },
    },
  })
  async getSettings(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.getSettings(user.userId);
    return ResponseUtil.found(data, '获取偏好设置成功');
  }

  @Patch('settings')
  @ApiOperation({ summary: '更新个人偏好设置' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        theme: 'light',
        language: 'zh-CN',
        sidebarCollapsed: false,
        pageSize: 20,
      },
    },
  })
  async updateSettings(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    const data = await this.profileService.updateSettings(user.userId, dto);
    return ResponseUtil.success(data, '更新偏好设置成功');
  }
}
